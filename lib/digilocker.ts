/**
 * DigiLocker OAuth 2.0 + PKCE Service
 * 
 * Handles age verification through Direct DigiLocker MeriPehchaan API (NSSO)
 * NOT API Setu - this uses the direct OAuth flow for user authentication
 * and profile access (Name, DOB, Gender).
 * 
 * Flow:
 * 1. Generate PKCE code verifier and challenge
 * 2. Build authorization URL with NSSO parameters (acr=digilocker)
 * 3. Exchange authorization code for access token
 * 4. Parse DOB from id_token or fetch via /userinfo endpoint
 * 5. Calculate age (18+ verification)
 * 
 * API Endpoints Used:
 * - Authorization: POST /public/oauth2/1/authorize
 * - Token: POST /public/oauth2/2/token
 * - UserInfo: GET /public/oauth2/2/userinfo
 * 
 * Required Environment Variables:
 * - DIGILOCKER_CLIENT_ID
 * - DIGILOCKER_CLIENT_SECRET
 * - DIGILOCKER_REDIRECT_URI
 * - DIGILOCKER_SCOPE=openid profile (MUST include 'profile' for DOB)
 * 
 * @see https://partners.digilocker.gov.in
 * @see docs/DIGILOCKER_IMPLEMENTATION_GUIDE.md
 */

import { env } from '@/lib/env';

// ============================================================================
// TYPES
// ============================================================================

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export interface DigiLockerConfig {
  env: 'production' | 'sandbox';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  issuerId: string;
  scope?: string; // Defaults to 'openid profile' - MUST include 'profile' for DOB
  acr?: string;   // Authentication Context Class Reference - NSSO parameter
}

export interface DigiLockerTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  id_token?: string; // JWT containing user profile
  digilockerid?: string;
  name?: string;
  dob?: string; // Format: DDMMYYYY
  gender?: string;
  eaadhaar?: string;
  new_account?: boolean;
  reference_key?: string;
  consent_valid_till?: string;
}

/**
 * UserInfo response from DigiLocker /userinfo endpoint
 */
export interface DigiLockerUserInfo {
  sub: string;
  digilockerid?: string;
  name?: string;
  dob?: string; // Format: DDMMYYYY
  gender?: string;
  email?: string;
  mobile?: string;
}

export interface AgeVerificationResult {
  isAdult: boolean;
  isMinor: boolean;
  age: number;
  birthDate: string; // ISO format
  dobRaw: string;
}

export interface DigiLockerErrorResponse {
  error: string;
  error_description: string;
}

export class DigiLockerError extends Error {
  constructor(
    public code: string,
    public description: string
  ) {
    super(`DigiLocker Error: ${code} - ${description}`);
    this.name = 'DigiLockerError';
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DIGILOCKER_BASE_URLS = {
  production: 'https://digilocker.meripehchaan.gov.in',
  sandbox: 'https://digilocker.meripehchaan.gov.in', // Same URL, different credentials
};

export function getDigiLockerConfig(): DigiLockerConfig {
  if (!env.DIGILOCKER_CLIENT_ID || !env.DIGILOCKER_CLIENT_SECRET || !env.DIGILOCKER_REDIRECT_URI) {
    throw new DigiLockerError(
      'configuration_error',
      'DigiLocker environment variables not configured. Please set DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI.'
    );
  }

  return {
    env: env.DIGILOCKER_ENV || 'sandbox',
    clientId: env.DIGILOCKER_CLIENT_ID,
    clientSecret: env.DIGILOCKER_CLIENT_SECRET,
    redirectUri: env.DIGILOCKER_REDIRECT_URI,
    issuerId: env.DIGILOCKER_ISSUER_ID || 'in.consently',
    scope: env.DIGILOCKER_SCOPE || 'openid profile', // MUST include 'profile' for DOB access
    acr: env.DIGILOCKER_ACR || 'digilocker', // NSSO canonical value
  };
}

function getBaseUrl(): string {
  const config = getDigiLockerConfig();
  return DIGILOCKER_BASE_URLS[config.env];
}

// ============================================================================
// PKCE UTILITIES
// ============================================================================

/**
 * Generate PKCE code verifier and code challenge
 * Per DigiLocker API spec Page 6
 */
export function generatePKCE(): PKCEPair {
  // Generate 32 random bytes and encode as base64url
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  // Create code challenge: SHA256(codeVerifier) then base64url encode
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return { codeVerifier, codeChallenge };
}

/**
 * Generate code challenge from code verifier using SHA-256
 */
function generateCodeChallenge(codeVerifier: string): string {
  // In Node.js environment, use crypto
  if (typeof window === 'undefined') {
    // Dynamic import to avoid bundling issues
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  // In browser environment, use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = crypto.subtle.digest('SHA-256', data);

  // Note: This returns a Promise, but for synchronous usage in PKCE generation
  // we need to handle this differently. The service will use the Node.js path.
  throw new Error('PKCE generation must be done server-side');
}

/**
 * Base64URL encode a Uint8Array
 */
function base64UrlEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE pair (async version for server-side usage)
 * This is the recommended method for Next.js API routes
 */
export async function generatePKCEAsync(): Promise<PKCEPair> {
  const crypto = await import('crypto');

  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

// ============================================================================
// AUTHORIZATION URL
// ============================================================================

/**
 * Build DigiLocker authorization URL
 * Per DigiLocker API spec Page 5
 * 
 * NSSO Canonical Parameters:
 * - scope: 'openid profile' (MUST include 'profile' for DOB access)
 * - acr: 'digilocker' (NSSO canonical value for Authentication Context Class Reference)
 * - purpose: Use case for the authentication (kyc, verification, compliance, etc.)
 */
export function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  purpose: 'kyc' | 'verification' | 'compliance' | 'availing_services' | 'educational' = 'kyc'
): string {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  // DigiLocker supports: openid, profile
  // IMPORTANT: scope must be exactly "openid profile" (space-separated, no commas, no quotes)
  // 'profile' is REQUIRED to get DOB (date of birth) from the user
  const scope = config.scope || 'openid profile';
  
  // NSSO canonical ACR value - REQUIRED for MeriPehchaan integration
  // This ensures the authentication follows NSSO standards
  const acr = config.acr || 'digilocker';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    scope: scope,
    purpose: purpose,
    acr: acr,
  });

  const authUrl = `${baseUrl}/public/oauth2/1/authorize?${params.toString()}`;
  
  // Debug: Log the generated URL (mask sensitive info)
  console.log('[DigiLocker] Generated auth URL:', authUrl.replace(/client_id=[^&]+/, 'client_id=***'));
  console.log('[DigiLocker] Scope parameter:', scope);
  console.log('[DigiLocker] Purpose parameter:', purpose);
  console.log('[DigiLocker] ACR parameter:', acr);
  
  return authUrl;
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

/**
 * Exchange authorization code for access token
 * Per DigiLocker API spec Page 9
 * Note: DigiLocker MeriPehchaan API uses a custom flow, not standard OAuth 2.0
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<DigiLockerTokenResponse> {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  const tokenUrl = `${baseUrl}/public/oauth2/2/token`;

  // DigiLocker OAuth2 token endpoint uses authorization_code grant type
  // This is the standard OAuth 2.0 flow for user authentication
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  // Debug: Log the token request parameters (mask sensitive info)
  console.log('[DigiLocker] Token exchange request:');
  console.log('[DigiLocker] URL:', tokenUrl);
  console.log('[DigiLocker] client_id length:', config.clientId.length);
  console.log('[DigiLocker] client_id (first 5 chars):', config.clientId.substring(0, 5) + '...');
  console.log('[DigiLocker] redirect_uri:', config.redirectUri);
  console.log('[DigiLocker] code length:', code.length);
  console.log('[DigiLocker] code_verifier length:', codeVerifier.length);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  // Handle non-JSON responses (e.g., HTML error pages)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new DigiLockerError(
      'invalid_response',
      `DigiLocker returned non-JSON response: ${text.substring(0, 200)}`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new DigiLockerError(
      'parse_error',
      'Failed to parse DigiLocker response'
    );
  }

  if (!response.ok) {
    const error = data as DigiLockerErrorResponse;
    console.error('[DigiLocker] Token exchange failed:', {
      error: error.error,
      description: error.error_description,
      status: response.status,
      statusText: response.statusText,
    });
    throw new DigiLockerError(
      error.error || 'unknown_error',
      error.error_description || 'Failed to exchange code for token'
    );
  }

  // Log full response for debugging (remove in production)
  console.log('[DigiLocker] Token response:', JSON.stringify(data, null, 2));

  // Extract DOB from id_token if not directly available
  const result = data as DigiLockerTokenResponse;

  // PRIMARY: Extract from id_token (most reliable source per DigiLocker spec)
  if (result.id_token) {
    try {
      const payload = parseJwtPayload(result.id_token);
      // Log full payload for debugging (redact sensitive fields)
      console.log('[DigiLocker] Parsed id_token claims:', {
        ...payload,
        sub: payload.sub ? '[PRESENT]' : '[MISSING]',
        digilockerid: payload.digilockerid ? '[PRESENT]' : '[MISSING]',
        birthdate: payload.birthdate || '[NOT FOUND]',
        dob: payload.dob || '[NOT FOUND]',
        date_of_birth: payload.date_of_birth || '[NOT FOUND]',
      });

      // Try multiple claim names for DOB (per OIDC spec and DigiLocker variations)
      const dobClaims = ['birthdate', 'dob', 'date_of_birth'];
      for (const claim of dobClaims) {
        if (payload[claim]) {
          console.log(`[DigiLocker] Found DOB in id_token claim '${claim}':`, payload[claim]);
          result.dob = normalizeDob(payload[claim]);
          break;
        }
      }
      
      // Also extract other profile fields from id_token if missing
      if (!result.name && payload.name) result.name = payload.name;
      if (!result.gender && payload.gender) result.gender = payload.gender;
      // DigiLocker uses the OIDC 'sub' claim as the unique user identifier (digilockerid)
      if (!result.digilockerid && payload.sub) {
        result.digilockerid = payload.sub;
        console.log('[DigiLocker] Mapped id_token sub claim to digilockerid');
      }
      if (!result.digilockerid && payload.digilockerid) result.digilockerid = payload.digilockerid;
      
      if (!result.dob) {
        console.warn('[DigiLocker] No DOB claim found in id_token. Available claims:', Object.keys(payload).join(', '));
      }
    } catch (e) {
      console.warn('[DigiLocker] Failed to parse id_token:', e);
    }
  }

  // FALLBACK: Check direct response fields (some implementations return DOB directly)
  if (!result.dob && data.dob) {
    result.dob = normalizeDob(data.dob);
    console.log('[DigiLocker] Found DOB in direct response:', result.dob);
  }

  // DISABLED: UserInfo fallback is unreliable for Authorized Partner flow
  // DigiLocker UserInfo endpoint often returns non-JSON or is not implemented
  // The id_token should contain all necessary profile claims when scope includes 'profile'
  // 
  // if (!result.dob || !result.digilockerid) {
  //   console.warn('[DigiLocker] DOB or digilockerid missing - UserInfo fallback skipped (unreliable)');
  // }

  // Check if we have the minimum required fields
  if (!result.dob) {
    console.error('[DigiLocker] CRITICAL: DOB is missing from id_token');
    console.error('[DigiLocker] Available fields in result:', Object.keys(result).join(', '));
    console.error('[DigiLocker] Troubleshooting:');
    console.error('  1. Check that DIGILOCKER_SCOPE includes "profile" (current: ' + config.scope + ')');
    console.error('  2. Verify "Profile information" scope is approved in DigiLocker Partner Portal');
    console.error('  3. Ensure user has completed DigiLocker registration with Aadhaar');
    console.error('  4. Check id_token claims in logs above for available fields');
    throw new DigiLockerError(
      'missing_dob',
      `DOB not returned by DigiLocker. Ensure DIGILOCKER_SCOPE includes 'profile' and Profile scope is approved in portal. Current scope: ${config.scope}`
    );
  }
  
  // Validate DOB format (now supports DDMMYYYY, MM/DD/YYYY, YYYY-MM-DD)
  if (!/^\d{8}$/.test(result.dob)) {
    throw new DigiLockerError(
      'invalid_dob_format',
      `Invalid DOB format from DigiLocker: ${result.dob}. Expected DDMMYYYY.`
    );
  }
  
  console.log('[DigiLocker] Final DOB for verifyAge:', result.dob);

  if (!result.digilockerid) {
    throw new DigiLockerError(
      'missing_digilockerid',
      `DigiLocker response missing 'digilockerid' field. Available fields: ${Object.keys(result).join(', ')}`
    );
  }

  return result;
}

/**
 * Fetch user information from DigiLocker UserInfo endpoint
 * This is the most reliable way to get DOB, name, gender, etc.
 * 
 * GET https://api.digitallocker.gov.in/public/oauth2/1/userinfo
 */
export async function fetchUserInfo(accessToken: string): Promise<DigiLockerUserInfo> {
  const baseUrl = getBaseUrl();
  const userInfoUrl = `${baseUrl}/public/oauth2/2/userinfo`;

  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new DigiLockerError(
      'invalid_userinfo_response',
      `DigiLocker userinfo returned non-JSON response: ${text.substring(0, 200)}`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new DigiLockerError(
      'userinfo_parse_error',
      'Failed to parse DigiLocker userinfo response'
    );
  }

  if (!response.ok) {
    const error = data as DigiLockerErrorResponse;
    throw new DigiLockerError(
      error.error || 'userinfo_failed',
      error.error_description || 'Failed to fetch user information'
    );
  }

  // Validate DOB format if present
  if (data.dob && !/^\d{8}$/.test(data.dob)) {
    throw new DigiLockerError(
      'invalid_dob_format',
      `Invalid DOB format from /userinfo: ${data.dob}. Expected DDMMYYYY.`
    );
  }

  return data as DigiLockerUserInfo;
}

/**
 * Helper to parse JWT payload without verifying signature
 * (We trust the TLS connection to DigiLocker for this direct exchange)
 */
function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    // Should verify environment - atob/btoa might need polyfill in Node, but Next.js usually has them
    // Fallback for Node.js environment if atob is not available
    if (typeof atob === 'undefined') {
      const base64Url = token.split('.')[1];
      return JSON.parse(Buffer.from(base64Url, 'base64').toString());
    }
    throw e;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Pick<DigiLockerTokenResponse, 'access_token' | 'expires_in' | 'token_type' | 'scope' | 'refresh_token'>> {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  const tokenUrl = `${baseUrl}/public/oauth2/1/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as DigiLockerErrorResponse;
    throw new DigiLockerError(
      error.error || 'refresh_failed',
      error.error_description || 'Failed to refresh access token'
    );
  }

  return data;
}

// ============================================================================
// DOB NORMALIZATION
// ============================================================================

/**
 * Normalize various DOB formats to DDMMYYYY
 * Handles:
 * - DDMMYYYY (e.g., "31122005") - already normalized
 * - MM/DD/YYYY (e.g., "01/01/1990") - DigiLocker format
 * - YYYY-MM-DD (e.g., "1990-01-01") - ISO format (OIDC standard)
 * - DD/MM/YYYY (e.g., "31/12/2005") - Alternative format
 * 
 * @param dobRaw - Raw DOB string from DigiLocker
 * @returns Normalized DDMMYYYY string
 */
function normalizeDob(dobRaw: string): string {
  if (!dobRaw || typeof dobRaw !== 'string') {
    throw new DigiLockerError('invalid_dob', 'DOB is empty or invalid');
  }

  const trimmed = dobRaw.trim();
  console.log('[DigiLocker] Normalizing DOB:', trimmed);

  // 1. Already DDMMYYYY (8 digits)
  if (/^\d{8}$/.test(trimmed)) {
    console.log('[DigiLocker] DOB already in DDMMYYYY format');
    return trimmed;
  }

  // 2. Slashed or dashed dates: Detect DD/MM/YYYY (primary for DigiLocker/India) vs MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (slashMatch) {
    const num1 = parseInt(slashMatch[1], 10);
    const num2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];

    let day: number;
    let month: number;

    if (num1 > 12 && num2 <= 12) {
      // Clear DD/MM/YYYY (day > 12 can't be month)
      day = num1;
      month = num2;
      console.log('[DigiLocker] Detected DD/MM/YYYY format');
    } else if (num2 > 12 && num1 <= 12) {
      // MM/DD/YYYY (day > 12 in second position)
      day = num2;
      month = num1;
      console.log('[DigiLocker] Detected MM/DD/YYYY format');
    } else {
      // Ambiguous (both <= 12) → Default to DD/MM/YYYY for India/DigiLocker context
      day = num1;
      month = num2;
      console.log('[DigiLocker] Ambiguous slashed date, assuming DD/MM/YYYY (Indian format)');
    }

    // Validate date parts
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new DigiLockerError('invalid_dob_values', `Invalid date: day=${day}, month=${month}`);
    }

    const normalized = `${day.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${year}`;
    console.log('[DigiLocker] Normalized to DDMMYYYY:', normalized);
    return normalized;
  }

  // 3. Dashed dates (DD-MM-YYYY or MM-DD-YYYY) - same logic as slashes
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const num1 = parseInt(dashMatch[1], 10);
    const num2 = parseInt(dashMatch[2], 10);
    const year = dashMatch[3];

    let day: number;
    let month: number;

    if (num1 > 12 && num2 <= 12) {
      day = num1;
      month = num2;
      console.log('[DigiLocker] Detected DD-MM-YYYY format');
    } else if (num2 > 12 && num1 <= 12) {
      day = num2;
      month = num1;
      console.log('[DigiLocker] Detected MM-DD-YYYY format');
    } else {
      day = num1;
      month = num2;
      console.log('[DigiLocker] Ambiguous dashed date, assuming DD-MM-YYYY (Indian format)');
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new DigiLockerError('invalid_dob_values', `Invalid date: day=${day}, month=${month}`);
    }

    const normalized = `${day.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${year}`;
    console.log('[DigiLocker] Normalized to DDMMYYYY:', normalized);
    return normalized;
  }

  // 4. YYYY-MM-DD format (ISO 8601, OIDC standard)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = isoMatch[3];
    const normalized = `${day}${month}${year}`;
    console.log('[DigiLocker] Converted YYYY-MM-DD to DDMMYYYY:', normalized);
    return normalized;
  }

  // 5. YYYY/MM/DD format
  const yyyymmddSlashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (yyyymmddSlashMatch) {
    const year = yyyymmddSlashMatch[1];
    const month = yyyymmddSlashMatch[2];
    const day = yyyymmddSlashMatch[3];
    const normalized = `${day}${month}${year}`;
    console.log('[DigiLocker] Converted YYYY/MM/DD to DDMMYYYY:', normalized);
    return normalized;
  }

  // Unknown format - throw error with details
  console.error('[DigiLocker] Unknown DOB format:', trimmed);
  throw new DigiLockerError(
    'invalid_dob_format',
    `Unknown DOB format: ${trimmed}. Expected DDMMYYYY, MM/DD/YYYY, or YYYY-MM-DD.`
  );
}

// ============================================================================
// AGE VERIFICATION
// ============================================================================

/**
 * Verify age from DOB string returned by DigiLocker
 * Input format: DDMMYYYY (e.g., "31122005")
 * 
 * @param dobString - Date of birth in DDMMYYYY format
 * @returns AgeVerificationResult with isAdult flag
 */
export function verifyAge(dobString: string): AgeVerificationResult {
  // Validate format
  if (!/^\d{8}$/.test(dobString)) {
    throw new DigiLockerError(
      'invalid_dob_format',
      `Invalid DOB format from DigiLocker: ${dobString}. Expected DDMMYYYY.`
    );
  }

  // Parse components
  const day = parseInt(dobString.substring(0, 2), 10);
  const month = parseInt(dobString.substring(2, 4), 10) - 1; // JS months are 0-indexed
  const year = parseInt(dobString.substring(4, 8), 10);

  // Validate date components
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
    throw new DigiLockerError(
      'invalid_dob_values',
      `Invalid DOB values: day=${day}, month=${month + 1}, year=${year}`
    );
  }

  const birthDate = new Date(year, month, day);
  const today = new Date();

  // Check for invalid date (e.g., Feb 30)
  if (birthDate.getDate() !== day || birthDate.getMonth() !== month) {
    throw new DigiLockerError(
      'invalid_date',
      `Invalid date: ${dobString}`
    );
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();

  // Adjust if birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return {
    isAdult: age >= 18,
    isMinor: age < 18,
    age,
    birthDate: birthDate.toISOString(),
    dobRaw: dobString,
  };
}

/**
 * Check if consent is still valid
 * DigiLocker consent is typically valid for 31 days
 */
export function isConsentValid(consentValidTill: string | Date | null | undefined): boolean {
  if (!consentValidTill) return false;

  const expiryDate = new Date(consentValidTill);
  const now = new Date();

  return expiryDate > now;
}

// ============================================================================
// TOKEN ENCRYPTION/DECRYPTION (Simple AES-256-GCM)
// ============================================================================

/**
 * Encrypt sensitive token data before storing in database
 * Uses AES-256-GCM encryption
 */
export async function encryptToken(plaintext: string): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('Token encryption must be done server-side');
  }

  const crypto = await import('crypto');

  // Use a deterministic key derived from environment
  const encryptionKey = deriveEncryptionKey();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt token data retrieved from database
 */
export async function decryptToken(encryptedData: string): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('Token decryption must be done server-side');
  }

  const crypto = await import('crypto');

  const encryptionKey = deriveEncryptionKey();

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivBase64, authTagBase64, encrypted] = parts;

  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Derive encryption key from environment variable
 * Falls back to a hash of multiple env vars for consistency
 */
function deriveEncryptionKey(): Buffer {
  const crypto = require('crypto');

  // Use SUPABASE_SERVICE_ROLE_KEY as primary encryption key source
  // This ensures the key is consistent across server instances
  const keyMaterial = env.SUPABASE_SERVICE_ROLE_KEY ||
    env.DIGILOCKER_CLIENT_SECRET ||
    'fallback-key-please-set-proper-env-vars';

  // Derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(keyMaterial).digest();
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export interface DigiLockerVerificationRecord {
  user_id: string;
  digilocker_id: string;
  name: string;
  dob_raw: string;
  date_of_birth: string;
  age_at_verification: number;
  is_adult: boolean;
  gender?: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at: string;
  consent_valid_till?: string;
  reference_key?: string;
  eaadhaar_linked: boolean;
  issuer_id: string;
}

/**
 * Save DigiLocker verification data to database
 */
export async function saveVerificationData(
  supabase: any,
  data: DigiLockerVerificationRecord
): Promise<void> {
  const { error } = await supabase
    .from('digilocker_verifications')
    .upsert(data, {
      onConflict: 'digilocker_id',
      ignoreDuplicates: false,
    });

  if (error) {
    throw new DigiLockerError('database_error', `Failed to save verification data: ${error.message}`);
  }
}

/**
 * Get latest verification for a user
 */
export async function getLatestVerification(
  supabase: any,
  userId: string
): Promise<DigiLockerVerificationRecord | null> {
  const { data, error } = await supabase
    .from('digilocker_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw new DigiLockerError('database_error', `Failed to fetch verification data: ${error.message}`);
  }

  return data;
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Get user-friendly error message for DigiLocker errors
 */
export function getErrorMessage(error: DigiLockerError | Error): {
  message: string;
  action: string;
  isRetryable: boolean;
} {
  if (error instanceof DigiLockerError) {
    switch (error.code) {
      case 'invalid_grant':
        return {
          message: 'Your session has expired. Please try again.',
          action: 'restart',
          isRetryable: true,
        };
      case 'invalid_client':
        return {
          message: 'DigiLocker Auth Partner misconfigured: Token Authentication Method must be "authorization_code" (not client_credentials). Create a new Auth Partner in API Setu with the correct settings.',
          action: 'contact_support',
          isRetryable: false,
        };
      case 'access_denied':
        return {
          message: 'You declined to share information with us.',
          action: 'alternative_verification',
          isRetryable: true,
        };
      case 'insufficient_scope':
        return {
          message: 'Cannot verify age. Missing permissions.',
          action: 'contact_support',
          isRetryable: false,
        };
      case 'invalid_dob_format':
      case 'invalid_dob_values':
      case 'invalid_date':
        return {
          message: 'Invalid date format received from DigiLocker.',
          action: 'contact_support',
          isRetryable: false,
        };
      case 'configuration_error':
        return {
          message: 'DigiLocker integration is not configured.',
          action: 'contact_support',
          isRetryable: false,
        };
      default:
        return {
          message: 'An error occurred during verification.',
          action: 'retry',
          isRetryable: true,
        };
    }
  }

  return {
    message: 'An unexpected error occurred.',
    action: 'retry',
    isRetryable: true,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const digilockerService = {
  generatePKCE,
  generatePKCEAsync,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  fetchUserInfo,
  refreshAccessToken,
  verifyAge,
  isConsentValid,
  encryptToken,
  decryptToken,
  saveVerificationData,
  getLatestVerification,
  getErrorMessage,
  getDigiLockerConfig,
};

export default digilockerService;
