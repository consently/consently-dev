/**
 * API Setu DigiLocker Integration Service
 *
 * Provides government-backed age verification via DigiLocker OAuth flow.
 * Implements DPDPA 2023 "verifiable parental consent" requirement.
 *
 * FLOW:
 * 1. User redirected to DigiLocker/MeriPehchaan OAuth
 * 2. User authenticates (Aadhaar/MPIN/Biometric)
 * 3. Callback with authorization code
 * 4. Exchange code for access token (PKCE)
 * 5. Call /user endpoint to get DOB
 * 6. Calculate exact age from DOB
 * 7. DOB is discarded, only age is stored
 *
 * SECURITY NOTES:
 * - Access tokens are NEVER persisted - deleted immediately after use
 * - DOB is extracted from /user endpoint, age calculated, then DOB is discarded
 * - Only verified_age (integer) is stored in database
 * - All credentials read from environment variables only
 */

import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AgeVerificationResponse {
  // Age verification response with exact age calculated from DOB
  result: 'yes' | 'no';           // Whether user meets age threshold
  threshold_age: number;          // The age threshold that was checked
  actual_age: number;             // Exact age calculated from DOB
  document_type?: string;         // E.g., 'AADHAAR' - Kept for audit trail
  consent_artifact_id?: string;   // Reference for audit
}

export interface DigiLockerUserResponse {
  // Response from /user endpoint - DOB is extracted, age calculated, then DOB is discarded
  // NOTE: DigiLocker officially returns DD-MM-YYYY format (e.g., "15-06-1990")
  // Our normalizeDob() function handles both DD-MM-YYYY and YYYY-MM-DD formats
  dob: string;                    // Format: DD-MM-YYYY or YYYY-MM-DD - DISCARDED after age calculation
  document_type: string;          // E.g., 'AADHAAR' - Kept for audit trail
  consent_artifact_id: string;    // Reference for audit
  name?: string;                  // NOT stored - discarded immediately
}

export interface VerificationResult {
  success: boolean;
  meetsAgeThreshold: boolean;     // True if user meets the age threshold
  thresholdAge: number;           // The threshold that was checked
  age: number | null;             // Actual age calculated from DOB (null if failed)
  documentType: string | null;
  consentArtifactRef: string | null;
  error?: string;
  errorCode?: string;
}

export interface SessionInitResult {
  success: boolean;
  sessionId: string;
  stateToken: string;
  redirectUrl: string;
  expiresAt: Date;
  error?: string;
}

export interface ApiSetuConfig {
  // OAuth endpoints (for authorize, token exchange)
  oauthBaseUrl: string;
  // API endpoints (for pulling documents/data)
  apiBaseUrl: string;
  // Sandbox URLs
  sandboxOauthUrl: string;
  sandboxApiUrl: string;
  // Credentials
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  useSandbox: boolean;
  // MeriPehchaan/NSSO parameters
  dlFlow: string;
  acr: string;
  amr: string;
  pla: string;
}

// ============================================================================
// MOCK MODE FOR TESTING
// ============================================================================

const MOCK_MODE_ENABLED = process.env.APISETU_USE_MOCK === 'true';

const MOCK_USERS: Record<string, { dob: string; documentType: string }> = {
  // Test adult (age 30) - YYYY-MM-DD format
  'mock_adult_code': {
    dob: '1996-01-15',
    documentType: 'AADHAAR',
  },
  // Test adult (age 30) - DD-MM-YYYY format (DigiLocker official format)
  'mock_adult_ddmmyyyy_code': {
    dob: '15-01-1996',
    documentType: 'AADHAAR',
  },
  // Test minor (age 15) - YYYY-MM-DD format
  'mock_minor_code': {
    dob: '2011-06-20',
    documentType: 'AADHAAR',
  },
  // Test minor (age 15) - DD-MM-YYYY format
  'mock_minor_ddmmyyyy_code': {
    dob: '20-06-2011',
    documentType: 'AADHAAR',
  },
  // Test edge case (exactly 18 today - calculate dynamically)
  'mock_edge_18_code': {
    dob: getDateYearsAgo(18),
    documentType: 'AADHAAR',
  },
  // Test edge case (17 years 364 days)
  'mock_edge_17_code': {
    dob: getDateYearsAgo(17, -1), // 17 years minus 1 day = still 17
    documentType: 'AADHAAR',
  },
};

function getDateYearsAgo(years: number, offsetDays: number = 0): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

// ============================================================================
// AVS RESULT NORMALIZATION
// ============================================================================

/**
 * Normalize DigiLocker AVS result to canonical 'yes' | 'no'.
 * DigiLocker's actual response format varies and may return:
 *   'yes', 'Y', 'YES', 'Yes', true, 1, 'true'  → 'yes'
 *   'no', 'N', 'NO', 'No', false, 0, 'false'    → 'no'
 *   undefined / null / unrecognized              → 'no' (fail-safe)
 */
function normalizeAvsResult(raw: unknown): 'yes' | 'no' {
  if (raw === null || raw === undefined) {
    return 'no';
  }

  if (typeof raw === 'boolean') {
    return raw ? 'yes' : 'no';
  }

  if (typeof raw === 'number') {
    return raw > 0 ? 'yes' : 'no';
  }

  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (['yes', 'y', 'true', '1', 'pass', 'passed', 'verified'].includes(normalized)) {
      return 'yes';
    }
  }

  return 'no';
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ApiSetuDigiLockerService {
  private config: ApiSetuConfig;
  private mockMode: boolean;

  constructor() {
    // Only use mock mode if explicitly enabled via APISETU_USE_MOCK=true
    // Removed automatic fallback to prevent accidental mock mode in production
    this.mockMode = MOCK_MODE_ENABLED;

    this.config = {
      // OAuth endpoints - MeriPehchaan OAuth via API Setu AuthPartner
      oauthBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
      // API endpoints for AVS (Age Verification Service) calls
      apiBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
      // Sandbox URLs (for testing - not used in production)
      sandboxOauthUrl: 'https://api.sandbox.digitallocker.gov.in/public/oauth2/1',
      sandboxApiUrl: 'https://api.sandbox.digitallocker.gov.in/public/oauth2/1',
      // AuthPartner credentials (from consume.apisetu.gov.in dashboard)
      clientId: process.env.APISETU_CLIENT_ID || '',
      clientSecret: process.env.APISETU_CLIENT_SECRET || '',
      redirectUri: process.env.APISETU_REDIRECT_URI || '',
      // OAuth scope for DigiLocker /user endpoint access
      // 'openid' = Required for accessing /user endpoint to get DOB
      // NOTE: Must be enabled in API Setu dashboard AuthPartner settings
      scope: 'openid',
      useSandbox: process.env.APISETU_USE_SANDBOX === 'true',
      // Legacy NSSO params removed - now controlled by API Setu dashboard
      // (dlFlow, acr, amr, pla are configured in AuthPartner settings, not sent in URL)
      dlFlow: 'signin',  // Kept for potential future use, not sent in authorize URL
      acr: '',           // Removed - controlled by dashboard
      amr: '',           // Removed - controlled by dashboard
      pla: '',           // Removed - controlled by dashboard
    };

    if (this.mockMode) {
      console.log('[ApiSetuDigiLocker] Running in MOCK MODE - no real API Setu calls');
    } else {
      // Validate required credentials in production mode
      if (!this.config.clientId) {
        throw new Error(
          'APISETU_CLIENT_ID is required when not in mock mode. ' +
          'Set APISETU_USE_MOCK=true for testing, or configure APISETU_CLIENT_ID for production.'
        );
      }
      if (!this.config.clientSecret) {
        throw new Error(
          'APISETU_CLIENT_SECRET is required when not in mock mode. ' +
          'Set APISETU_USE_MOCK=true for testing, or configure APISETU_CLIENT_SECRET for production.'
        );
      }
      if (!this.config.redirectUri) {
        throw new Error(
          'APISETU_REDIRECT_URI is required when not in mock mode. ' +
          'Set APISETU_USE_MOCK=true for testing, or configure APISETU_REDIRECT_URI for production.'
        );
      }

      // Log configuration for debugging (redact secrets)
      console.log('[ApiSetuDigiLocker] Configuration loaded:', {
        clientId: this.config.clientId,
        redirectUri: this.config.redirectUri,
        scope: this.config.scope,
        oauthBaseUrl: this.config.oauthBaseUrl,
        useSandbox: this.config.useSandbox,
        note: 'MeriPehchaan-specific params (ACR, AMR, flow) are controlled by API Setu dashboard',
      });
    }
  }

  /**
   * Get the effective OAuth base URL based on sandbox setting
   * Used for: /authorize, /token endpoints
   */
  private getOAuthBaseUrl(): string {
    return this.config.useSandbox ? this.config.sandboxOauthUrl : this.config.oauthBaseUrl;
  }

  /**
   * Get the effective API base URL based on sandbox setting
   * Used for: /user endpoint (to get DOB for age calculation)
   */
  private getApiBaseUrl(): string {
    return this.config.useSandbox ? this.config.sandboxApiUrl : this.config.apiBaseUrl;
  }

  /**
   * Check if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return `avs_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate a secure state token for CSRF protection
   */
  generateStateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code verifier (random string for OAuth PKCE flow)
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier (SHA-256 hash)
   */
  generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest('base64url');
    return hash;
  }

  /**
   * Generate OAuth authorization URL for DigiLocker with PKCE
   */
  generateAuthorizationUrl(stateToken: string, codeVerifier: string): string {
    // Validate redirect URI is configured
    if (!this.config.redirectUri) {
      throw new Error('APISETU_REDIRECT_URI is not configured. Cannot initiate age verification.');
    }

    if (this.mockMode) {
      // In mock mode, redirect to our own mock endpoint
      const mockUrl = new URL(this.config.redirectUri);
      mockUrl.searchParams.set('mock', 'true');
      mockUrl.searchParams.set('state', stateToken);
      return mockUrl.toString();
    }

    // Validate client ID is configured for production
    if (!this.config.clientId) {
      throw new Error('APISETU_CLIENT_ID is not configured. Cannot initiate age verification.');
    }

    // Generate PKCE code challenge from verifier
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Standard OAuth 2.0 + PKCE params
    // NOTE: MeriPehchaan-specific params (acr, amr, dl_flow, pla) are managed
    // by API Setu AuthPartner dashboard config, NOT passed in authorize URL.
    // Passing them can cause conflicts with dashboard settings.
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      state: stateToken,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: this.config.scope,
    });

    const authorizeUrl = `${this.getOAuthBaseUrl()}/authorize?${params.toString()}`;

    // DEBUG: Log the final authorize URL to verify exact parameters sent to NSSO
    // Remove this log after confirming the flow works in production
    console.log('[ApiSetuDigiLocker] NSSO AUTHORIZE URL:', authorizeUrl);

    return authorizeUrl;
  }

  /**
   * Exchange authorization code for access token
   * IMPORTANT: Token is NOT persisted - used once and discarded
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    if (this.mockMode) {
      // Mock token response
      return {
        access_token: `mock_access_token_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
      };
    }

    const tokenUrl = `${this.getOAuthBaseUrl()}/token`;

    // MeriPehchaan token endpoint requires Basic auth header per partner specs
    // Format: Authorization: Basic base64(client_id:client_secret)
    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    // Debug: log token exchange request (redact secrets)
    console.log('[ApiSetuDigiLocker] Token exchange request:', {
      url: tokenUrl,
      method: 'POST',
      redirect_uri: this.config.redirectUri,
      code_length: code.length,
      code_verifier_length: codeVerifier.length,
      has_basic_auth: true,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[ApiSetuDigiLocker] Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        url: tokenUrl,
        redirect_uri: this.config.redirectUri,
        response: errorBody,
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} — ${errorBody}`);
    }

    return await response.json();
  }

  /**
   * Fetch user attributes from DigiLocker /user endpoint
   * Extracts DOB, calculates exact age, then discards DOB
   * SECURITY: DOB is never stored - only calculated age is returned
   */
  async getAgeVerificationAttributes(
    accessToken: string,
    thresholdAge: number = 18,
    authorizationCode?: string
  ): Promise<AgeVerificationResponse> {
    if (this.mockMode && authorizationCode) {
      // Mock response based on code
      const mockUser = MOCK_USERS[authorizationCode];
      if (mockUser) {
        const age = this.calculateAge(mockUser.dob);
        return {
          result: age >= thresholdAge ? 'yes' : 'no',
          threshold_age: thresholdAge,
          actual_age: age,
          document_type: mockUser.documentType,
          consent_artifact_id: `mock_artifact_${Date.now()}`,
        };
      }
      // Default mock adult
      const defaultAge = 30;
      return {
        result: 'yes',
        threshold_age: thresholdAge,
        actual_age: defaultAge,
        document_type: 'AADHAAR',
        consent_artifact_id: `mock_artifact_${Date.now()}`,
      };
    }

    // Use /user endpoint to get DOB, then calculate exact age
    // SECURITY: DOB is extracted, age is calculated, then DOB is discarded
    const userUrl = `${this.getApiBaseUrl()}/user`;
    console.log('[ApiSetuDigiLocker] Calling /user endpoint:', userUrl);

    const response = await fetch(userUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ApiSetuDigiLocker] /user endpoint failed:', response.status, error);
      throw new Error(`Failed to fetch user data: ${response.status} - ${error}`);
    }

    const data: DigiLockerUserResponse = await response.json();
    
    // Validate DOB exists
    if (!data.dob) {
      throw new Error('DOB not found in user response');
    }

    // Detect DOB format for debugging (log format only, not actual DOB)
    const dobFormat = data.dob.match(/^\d{4}/) ? 'YYYY-MM-DD' : 
                      data.dob.match(/^\d{2}-\d{2}-\d{4}$/) ? 'DD-MM-YYYY' : 'other';
    console.log(`[ApiSetuDigiLocker] /user response received (DOB format: ${dobFormat})`);

    // Calculate exact age from DOB
    // SECURITY: DOB is used for calculation only, never stored
    const actualAge = this.calculateAge(data.dob);
    const meetsThreshold = actualAge >= thresholdAge;

    console.log('[ApiSetuDigiLocker] Age calculated:', { 
      actualAge, 
      meetsThreshold, 
      thresholdAge,
      documentType: data.document_type 
    });

    return {
      result: meetsThreshold ? 'yes' : 'no',
      threshold_age: thresholdAge,
      actual_age: actualAge,
      document_type: data.document_type || 'AADHAAR',
      consent_artifact_id: data.consent_artifact_id || `avs_${Date.now()}`,
    };
  }

  /**
   * Normalize DOB string from various formats to a JavaScript Date object.
   * Handles:
   * - DD-MM-YYYY (DigiLocker official format: 15-06-1990)
   * - YYYY-MM-DD (ISO format: 1990-06-15)
   * - DD/MM/YYYY (15/06/1990)
   * - YYYY/MM/DD (1990/06/15)
   * Throws error if format cannot be parsed.
   */
  private normalizeDob(dob: string): Date {
    if (!dob || typeof dob !== 'string') {
      throw new Error('Invalid DOB: empty or not a string');
    }

    const trimmed = dob.trim();
    
    // Try DD-MM-YYYY or DD/MM/YYYY (DigiLocker format)
    // DigiLocker returns: "15-06-1990" for June 15, 1990
    const ddMmYyyyMatch = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ddMmYyyyMatch) {
      const day = parseInt(ddMmYyyyMatch[1], 10);
      const month = parseInt(ddMmYyyyMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(ddMmYyyyMatch[3], 10);
      
      // Validate ranges
      if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
        throw new Error(`Invalid DOB values: day=${day}, month=${month + 1}, year=${year}`);
      }
      
      const date = new Date(year, month, day);
      // Verify the date is valid (e.g., not Feb 30)
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        throw new Error(`Invalid DOB date: ${trimmed}`);
      }
      return date;
    }
    
    // Try YYYY-MM-DD or YYYY/MM/DD (ISO format)
    const isoMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      
      // Validate ranges
      if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
        throw new Error(`Invalid DOB values: year=${year}, month=${month + 1}, day=${day}`);
      }
      
      const date = new Date(year, month, day);
      // Verify the date is valid
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        throw new Error(`Invalid DOB date: ${trimmed}`);
      }
      return date;
    }
    
    // Fallback: try native Date parsing (handles ISO 8601, etc.)
    const fallbackDate = new Date(trimmed);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
    
    throw new Error(`Unrecognized DOB format: ${trimmed}. Expected DD-MM-YYYY or YYYY-MM-DD`);
  }

  /**
   * Calculate age from date of birth
   * Uses conservative calculation - assumes birthday hasn't occurred this year if ambiguous
   * Accepts multiple DOB formats (DD-MM-YYYY, YYYY-MM-DD, etc.)
   */
  calculateAge(dob: string): number {
    const birthDate = this.normalizeDob(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If birthday hasn't occurred this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Complete verification flow - exchanges code, fetches user data, calculates exact age
   * IMPORTANT: 
   * - Access token is discarded after use
   * - DOB is extracted and immediately discarded after age calculation
   * - Only verified_age is stored in database
   */
  async completeVerification(
    authorizationCode: string,
    codeVerifier: string,
    thresholdAge: number = 18
  ): Promise<VerificationResult> {
    try {
      // Step 1: Exchange code for token (with PKCE code verifier)
      const tokenResponse = await this.exchangeCodeForToken(authorizationCode, codeVerifier);
      console.log('[ApiSetuDigiLocker] Token exchange successful');

      // Step 2: Call /user endpoint to get DOB and calculate exact age
      // SECURITY: DOB is received, age is calculated, then DOB is discarded
      const userResult = await this.getAgeVerificationAttributes(
        tokenResponse.access_token,
        thresholdAge,
        authorizationCode
      );

      const meetsThreshold = userResult.result === 'yes';
      const actualAge = userResult.actual_age;
      
      console.log('[ApiSetuDigiLocker] Verification result:', { 
        actualAge,
        meetsThreshold, 
        thresholdAge 
      });

      // Access token is NOT persisted - goes out of scope here
      // DOB was used for calculation only and is now discarded
      // Only the calculated age is returned

      return {
        success: true,
        meetsAgeThreshold: meetsThreshold,
        thresholdAge: userResult.threshold_age,
        age: actualAge,
        documentType: userResult.document_type || null,
        consentArtifactRef: userResult.consent_artifact_id || null,
      };
    } catch (error) {
      console.error('[ApiSetuDigiLocker] Verification failed:', error);
      return {
        success: false,
        meetsAgeThreshold: false,
        thresholdAge: thresholdAge,
        age: null,
        documentType: null,
        consentArtifactRef: null,
        error: error instanceof Error ? error.message : 'Verification failed',
        errorCode: 'VERIFICATION_FAILED',
      };
    }
  }

  /**
   * Validate state token matches expected value (CSRF protection)
   */
  validateStateToken(received: string, expected: string): boolean {
    // Use timing-safe comparison to prevent timing attacks
    if (received.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(received),
      Buffer.from(expected)
    );
  }

  /**
   * Generate signed verification assertion (JWT)
   * This is stored in localStorage on client as proof of verification
   */
  generateVerificationAssertion(payload: {
    sessionId: string;
    visitorId: string;
    widgetId: string;
    age: number;
    verifiedAt: Date;
    expiresAt: Date;
  }): string {
    const secret = process.env.AGE_VERIFICATION_JWT_SECRET;
    if (!secret) {
      throw new Error('AGE_VERIFICATION_JWT_SECRET not configured');
    }

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const claims = {
      sub: payload.visitorId,
      iss: 'consently.in',
      aud: payload.widgetId,
      iat: Math.floor(payload.verifiedAt.getTime() / 1000),
      exp: Math.floor(payload.expiresAt.getTime() / 1000),
      session_id: payload.sessionId,
      age: payload.age,
      age_band: this.getAgeBand(payload.age),
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    return `${signatureInput}.${signature}`;
  }

  /**
   * Verify verification assertion (JWT)
   */
  verifyVerificationAssertion(token: string): {
    valid: boolean;
    claims?: Record<string, unknown>;
    error?: string;
  } {
    const secret = process.env.AGE_VERIFICATION_JWT_SECRET;
    if (!secret) {
      return { valid: false, error: 'JWT secret not configured' };
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Decode and check claims
      const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

      // Check expiration
      if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, claims };
    } catch (error) {
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Get age band for privacy-preserving age reporting
   */
  private getAgeBand(age: number): string {
    if (age < 13) return 'under_13';
    if (age < 16) return '13_to_15';
    if (age < 18) return '16_to_17';
    if (age < 21) return '18_to_20';
    if (age < 25) return '21_to_24';
    if (age < 35) return '25_to_34';
    if (age < 45) return '35_to_44';
    if (age < 55) return '45_to_54';
    if (age < 65) return '55_to_64';
    return '65_plus';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let serviceInstance: ApiSetuDigiLockerService | null = null;

export function getApiSetuService(): ApiSetuDigiLockerService {
  if (!serviceInstance) {
    serviceInstance = new ApiSetuDigiLockerService();
  }
  return serviceInstance;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if age meets threshold for a given widget config
 */
export function isAgeAboveThreshold(age: number, threshold: number): boolean {
  return age >= threshold;
}

/**
 * Calculate session expiry time
 */
export function calculateSessionExpiry(durationMinutes: number = 60): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + durationMinutes);
  return expiry;
}

/**
 * Calculate verification validity expiry
 */
export function calculateVerificationExpiry(validityDays: number = 365): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + validityDays);
  return expiry;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ApiSetuDigiLockerService;
