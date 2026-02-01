/**
 * DigiLocker OAuth 2.0 + PKCE Service
 * 
 * Handles age verification through DigiLocker MeriPehchaan API
 * - Generates PKCE code verifier and challenge
 * - Builds authorization URL
 * - Exchanges authorization code for access token
 * - Parses DOB and calculates age (18+ verification)
 * 
 * @see https://partners.digilocker.gov.in
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
}

export interface DigiLockerTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  id_token?: string; // JWT containing user profile
  digilockerid: string;
  name: string;
  dob: string; // Format: DDMMYYYY
  gender: string;
  eaadhaar: string;
  new_account: boolean;
  reference_key: string;
  consent_valid_till?: string;
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
 */
export function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  purpose: 'kyc' | 'verification' | 'compliance' | 'availing_services' | 'educational' = 'kyc'
): string {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    scope: 'openid',
    purpose: purpose,
  });

  return `${baseUrl}/public/oauth2/1/authorize?${params.toString()}`;
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

  // DigiLocker MeriPehchaan API expects client_credentials grant type
  // NOT authorization_code like standard OAuth 2.0
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

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
    throw new DigiLockerError(
      error.error || 'unknown_error',
      error.error_description || 'Failed to exchange code for token'
    );
  }

  // Extract DOB from id_token if not directly available
  const result = data as DigiLockerTokenResponse;

  if (!result.dob && result.id_token) {
    try {
      const payload = parseJwtPayload(result.id_token);
      if (payload.dob) {
        result.dob = payload.dob;
      }
      // Also fallback for other fields if needed
      if (!result.name && payload.name) result.name = payload.name;
      if (!result.gender && payload.gender) result.gender = payload.gender;
      if (!result.digilockerid && payload.digilockerid) result.digilockerid = payload.digilockerid;
    } catch (e) {
      console.warn('Failed to parse id_token:', e);
    }
  }

  return result;
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
          message: 'Configuration error. Please contact support.',
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
