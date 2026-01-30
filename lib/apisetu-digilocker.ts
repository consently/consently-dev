/**
 * API Setu DigiLocker Integration Service
 *
 * Provides government-backed age verification via DigiLocker OAuth flow.
 * Implements DPDPA 2023 "verifiable parental consent" requirement.
 *
 * SECURITY NOTES:
 * - Access tokens are NEVER persisted - deleted immediately after use
 * - DOB is extracted, age calculated, then DOB is discarded
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
  // AVS response from DigiLocker - privacy-preserving, no DOB exposed
  result: 'yes' | 'no';           // Whether user meets age threshold
  threshold_age: number;          // The age threshold that was checked
  document_type?: string;         // E.g., 'AADHAAR' - Kept for audit trail
  consent_artifact_id?: string;   // Reference for audit
}

export interface LegacyAgeVerificationResponse {
  // Legacy response format (if using /user endpoint)
  dob: string;                    // Format: YYYY-MM-DD - DISCARDED after age calculation
  document_type: string;          // E.g., 'AADHAAR' - Kept for audit trail
  consent_artifact_id: string;    // Reference for audit
  name?: string;                  // NOT stored - discarded immediately
}

export interface VerificationResult {
  success: boolean;
  meetsAgeThreshold: boolean;     // True if user meets the age threshold (AVS result)
  thresholdAge: number;           // The threshold that was checked
  age: number | null;             // Actual age (only available in mock mode)
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
  // Test adult (age 30)
  'mock_adult_code': {
    dob: '1996-01-15',
    documentType: 'AADHAAR',
  },
  // Test minor (age 15)
  'mock_minor_code': {
    dob: '2011-06-20',
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
// SERVICE CLASS
// ============================================================================

export class ApiSetuDigiLockerService {
  private config: ApiSetuConfig;
  private mockMode: boolean;

  constructor() {
    this.mockMode = MOCK_MODE_ENABLED || !process.env.APISETU_CLIENT_ID;

    this.config = {
      // OAuth endpoints - CRITICAL: Must use /public/oauth2/1/ path for DigiLocker OAuth
      oauthBaseUrl: process.env.DIGILOCKER_OAUTH_BASE_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
      // API endpoints for document/data pull
      apiBaseUrl: process.env.APISETU_BASE_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
      // Sandbox URLs
      sandboxOauthUrl: process.env.DIGILOCKER_SANDBOX_OAUTH_URL || 'https://api.sandbox.digitallocker.gov.in/public/oauth2/1',
      sandboxApiUrl: process.env.APISETU_SANDBOX_URL || 'https://api.sandbox.digitallocker.gov.in/public/oauth2/1',
      // Credentials
      clientId: process.env.APISETU_CLIENT_ID || '',
      clientSecret: process.env.APISETU_CLIENT_SECRET || '',
      redirectUri: process.env.APISETU_REDIRECT_URI || '',
      // CRITICAL: scope MUST match what's configured in APISetu AuthPartner dashboard.
      // For Age Verification partners, this is 'avs' (maps to "Age verification" checkbox).
      // Do NOT use 'openid' unless your AuthPartner explicitly has OpenID scope enabled.
      // Verify at: consume.apisetu.gov.in → AuthPartner → Scopes
      scope: 'avs',
      useSandbox: process.env.APISETU_USE_SANDBOX === 'true',
      // MeriPehchaan/NSSO parameters - MUST match APISetu AuthPartner configuration
      // Verify at: consume.apisetu.gov.in → AuthPartner → Flow/ACR/AMR settings
      // Current partner config: Sign-in flow, ACR=aadhaar+email+mobile, AMR=aadhaar
      dlFlow: process.env.DIGILOCKER_DL_FLOW || 'signin',
      acr: process.env.DIGILOCKER_ACR || 'aadhaar+email+mobile',
      amr: process.env.DIGILOCKER_AMR || 'aadhaar',
      pla: process.env.DIGILOCKER_PLA || 'Y',
    };

    if (this.mockMode) {
      console.log('[ApiSetuDigiLocker] Running in MOCK MODE - no real API Setu calls');
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
   * Used for: /user, /files, document pull endpoints
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

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      state: stateToken,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      dl_flow: this.config.dlFlow,
      amr: this.config.amr,
      scope: this.config.scope,
      pla: this.config.pla,
    });

    // Append acr separately to preserve literal + signs (URLSearchParams encodes + as %2B)
    // MeriPehchaan/NSSO expects literal + as separators in acr values
    const acr = this.config.acr;
    const authorizeUrl = `${this.getOAuthBaseUrl()}/authorize?${params.toString()}&acr=${acr}`;

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

    // Use OAuth base URL for token exchange
    const response = await fetch(`${this.getOAuthBaseUrl()}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ApiSetuDigiLocker] Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch age verification result from DigiLocker AVS endpoint
   * Returns privacy-preserving yes/no result - no DOB is exposed
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
          document_type: mockUser.documentType,
          consent_artifact_id: `mock_artifact_${Date.now()}`,
        };
      }
      // Default mock adult
      return {
        result: 'yes',
        threshold_age: thresholdAge,
        document_type: 'AADHAAR',
        consent_artifact_id: `mock_artifact_${Date.now()}`,
      };
    }

    // Use AVS endpoint for age verification (privacy-preserving)
    // The AVS endpoint returns yes/no for the given threshold, not the actual DOB
    const avsUrl = `${this.getApiBaseUrl()}/avs?threshold_age=${thresholdAge}`;
    console.log('[ApiSetuDigiLocker] Calling AVS endpoint:', avsUrl);

    const response = await fetch(avsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ApiSetuDigiLocker] AVS endpoint failed:', response.status, error);
      throw new Error(`Failed to fetch age verification: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('[ApiSetuDigiLocker] AVS response:', JSON.stringify(data));

    return {
      result: data.result || data.age_verified || (data.verified ? 'yes' : 'no'),
      threshold_age: data.threshold_age || thresholdAge,
      document_type: data.document_type || 'AADHAAR',
      consent_artifact_id: data.consent_artifact_id || data.txn_id || `avs_${Date.now()}`,
    };
  }

  /**
   * Calculate age from date of birth
   * Uses conservative calculation - assumes birthday hasn't occurred this year if ambiguous
   */
  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
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
   * Complete verification flow - exchanges code, fetches AVS result
   * IMPORTANT: Access token is discarded after use, no DOB is ever received
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

      // Step 2: Call AVS endpoint to get age verification result
      // This returns yes/no for the threshold - no DOB is exposed (privacy-preserving)
      const avsResult = await this.getAgeVerificationAttributes(
        tokenResponse.access_token,
        thresholdAge,
        authorizationCode
      );

      const meetsThreshold = avsResult.result === 'yes';
      console.log('[ApiSetuDigiLocker] AVS result:', meetsThreshold ? 'MEETS threshold' : 'BELOW threshold');

      // Access token is NOT persisted - goes out of scope here
      // No DOB is ever received - only yes/no for the threshold

      return {
        success: true,
        meetsAgeThreshold: meetsThreshold,
        thresholdAge: avsResult.threshold_age,
        age: meetsThreshold ? thresholdAge : thresholdAge - 1, // Approximate for backwards compatibility
        documentType: avsResult.document_type || null,
        consentArtifactRef: avsResult.consent_artifact_id || null,
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
 * Determine if guardian consent is required
 */
export function requiresGuardianConsent(
  age: number,
  threshold: number,
  minorHandling: 'block' | 'guardian_consent' | 'limited_access'
): boolean {
  if (age >= threshold) {
    return false;
  }
  return minorHandling === 'guardian_consent';
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
