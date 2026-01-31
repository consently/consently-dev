/**
 * MeriPehchaan Consent Postback Service
 *
 * Handles verification and processing of consent artefact JWTs
 * received from MeriPehchaan's consent postback system.
 *
 * SECURITY NOTES:
 * - Postback JWTs are verified using a static JWKS (RS256) configured in API Setu
 * - The postback key is validated via HMAC comparison (timing-safe)
 * - Consent artefacts are stored with full audit trail
 * - No sensitive user data is extracted beyond what's needed for consent tracking
 *
 * Configuration (API Setu Consent Partner):
 * - Consent Client ID: UK0F7C1979
 * - Token Authentication Method: Static JWKS
 * - Postback URL: https://www.consently.in/api/meri-pehchaan/consent/postback
 */

import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ConsentArtefact {
  /** Unique acknowledgement ID from MeriPehchaan */
  acknowledgementId: string;
  /** Subject/user identifier in MeriPehchaan's system */
  subjectId: string;
  /** Consent status: granted, denied, revoked, expired */
  status: 'granted' | 'denied' | 'revoked' | 'expired';
  /** ISO timestamp of when consent was given/actioned */
  consentTimestamp: string;
  /** Consent validity period (ISO date or duration) */
  validUntil?: string;
  /** Scopes/purposes the consent covers */
  scopes?: string[];
  /** Data categories consented to */
  dataCategories?: string[];
  /** The raw JWT for audit storage */
  rawJwt: string;
  /** All decoded claims from the JWT (for audit) */
  claims: Record<string, unknown>;
}

export interface PostbackVerificationResult {
  success: boolean;
  artefact?: ConsentArtefact;
  error?: string;
  errorCode?: string;
}

export interface JwksKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface StaticJwks {
  keys: JwksKey[];
}

// ============================================================================
// STATIC JWKS MANAGEMENT
// ============================================================================

/**
 * Load the static JWKS from environment variable.
 * The JWKS JSON is stored in MERIPEHCHAAN_CONSENT_STATIC_JWKS env var.
 *
 * NOTE: The static JWKS is configured in the API Setu consent partner dashboard.
 * It contains the public key(s) used to verify JWT signatures on postback tokens.
 * If the JWKS changes in the dashboard, update the env var accordingly.
 */
function loadStaticJwks(): StaticJwks | null {
  const jwksJson = process.env.MERIPEHCHAAN_CONSENT_STATIC_JWKS;
  if (!jwksJson) {
    console.error('[MeriPehchaan Consent] MERIPEHCHAAN_CONSENT_STATIC_JWKS not configured');
    return null;
  }

  try {
    const jwks = JSON.parse(jwksJson) as StaticJwks;
    if (!jwks.keys || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      console.error('[MeriPehchaan Consent] Invalid JWKS: no keys found');
      return null;
    }
    return jwks;
  } catch (e) {
    console.error('[MeriPehchaan Consent] Failed to parse static JWKS:', e);
    return null;
  }
}

// ============================================================================
// JWT VERIFICATION WITH STATIC JWKS (RS256)
// ============================================================================

/**
 * Decode a base64url string to a Buffer.
 */
function base64urlDecode(str: string): Buffer {
  // Replace base64url chars with base64 chars and add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64.length % 4);
  if (padding !== 4) {
    base64 += '='.repeat(padding);
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Build an RSA public key from JWK parameters (n, e).
 * Returns a KeyObject suitable for crypto.verify().
 */
function buildRsaPublicKey(jwkKey: JwksKey): crypto.KeyObject {
  // Convert JWK to Node.js KeyObject
  const keyData = {
    kty: jwkKey.kty,
    n: jwkKey.n,
    e: jwkKey.e,
    alg: jwkKey.alg || 'RS256',
    use: jwkKey.use || 'sig',
  };

  return crypto.createPublicKey({
    key: keyData,
    format: 'jwk',
  });
}

/**
 * Find the matching key in the JWKS by kid (Key ID) from JWT header.
 * If no kid in header, falls back to first key with use=sig and alg=RS256.
 */
function findSigningKey(jwks: StaticJwks, kid?: string): JwksKey | null {
  if (kid) {
    const match = jwks.keys.find((k) => k.kid === kid);
    if (match) return match;
    console.warn(`[MeriPehchaan Consent] No key found for kid="${kid}", trying fallback`);
  }

  // Fallback: first RS256 signing key
  const fallback = jwks.keys.find(
    (k) => k.use === 'sig' && (k.alg === 'RS256' || !k.alg) && k.kty === 'RSA'
  );
  return fallback || null;
}

/**
 * Verify a JWT signed with RS256 using the static JWKS.
 *
 * Performs:
 * 1. Structural validation (3 parts, valid base64url)
 * 2. Header parsing and algorithm check (RS256 only)
 * 3. Key lookup by kid in static JWKS
 * 4. RSA-SHA256 signature verification
 * 5. Claims extraction and expiry check
 *
 * Returns decoded claims if valid, or error details if not.
 */
export function verifyConsentJwt(token: string): {
  valid: boolean;
  header?: Record<string, unknown>;
  claims?: Record<string, unknown>;
  error?: string;
} {
  // Load static JWKS
  const jwks = loadStaticJwks();
  if (!jwks) {
    return { valid: false, error: 'Static JWKS not configured' };
  }

  // Step 1: Structural validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT structure: expected 3 parts' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Step 2: Decode and validate header
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString('utf8'));
  } catch {
    return { valid: false, error: 'Failed to decode JWT header' };
  }

  // Enforce RS256 algorithm — reject all others to prevent algorithm confusion attacks
  if (header.alg !== 'RS256') {
    return {
      valid: false,
      error: `Unsupported algorithm: ${header.alg}. Only RS256 is accepted.`,
    };
  }

  // Step 3: Find signing key by kid
  const kid = header.kid as string | undefined;
  const signingKey = findSigningKey(jwks, kid);
  if (!signingKey) {
    return {
      valid: false,
      error: `No matching signing key found${kid ? ` for kid="${kid}"` : ''}`,
    };
  }

  // Step 4: Verify RS256 signature
  try {
    const publicKey = buildRsaPublicKey(signingKey);
    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = base64urlDecode(signatureB64);

    const isValid = crypto.verify(
      'sha256',
      Buffer.from(signatureInput, 'utf8'),
      publicKey,
      signature
    );

    if (!isValid) {
      return { valid: false, error: 'JWT signature verification failed' };
    }
  } catch (e) {
    return {
      valid: false,
      error: `Signature verification error: ${e instanceof Error ? e.message : 'unknown'}`,
    };
  }

  // Step 5: Decode claims and check expiry
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
  } catch {
    return { valid: false, error: 'Failed to decode JWT payload' };
  }

  // Check token expiry (if exp claim present)
  if (claims.exp && typeof claims.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    // Allow 30-second clock skew
    if (claims.exp + 30 < now) {
      return { valid: false, error: 'JWT has expired', header, claims };
    }
  }

  // Check not-before (if nbf claim present)
  if (claims.nbf && typeof claims.nbf === 'number') {
    const now = Math.floor(Date.now() / 1000);
    // Allow 30-second clock skew
    if (claims.nbf - 30 > now) {
      return { valid: false, error: 'JWT is not yet valid (nbf)', header, claims };
    }
  }

  return { valid: true, header, claims };
}

// ============================================================================
// POSTBACK KEY VALIDATION
// ============================================================================

/**
 * Validate the postback key sent in the request.
 * MeriPehchaan may send this as a header or query parameter.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function validatePostbackKey(received: string): boolean {
  const expected = process.env.MERIPEHCHAAN_CONSENT_POSTBACK_KEY;
  if (!expected) {
    console.error('[MeriPehchaan Consent] MERIPEHCHAAN_CONSENT_POSTBACK_KEY not configured');
    return false;
  }

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

/**
 * Validate the callback key (used for outgoing requests to MeriPehchaan).
 */
export function validateCallbackKey(received: string): boolean {
  const expected = process.env.MERIPEHCHAAN_CONSENT_CALLBACK_KEY;
  if (!expected) {
    console.error('[MeriPehchaan Consent] MERIPEHCHAAN_CONSENT_CALLBACK_KEY not configured');
    return false;
  }

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

// ============================================================================
// CONSENT ARTEFACT EXTRACTION
// ============================================================================

/**
 * Extract a consent artefact from verified JWT claims.
 *
 * MeriPehchaan consent postback JWT claims structure (expected):
 * {
 *   "sub": "<user_id>",                    // Subject / user identifier
 *   "iss": "meripehchaan",                 // Issuer
 *   "aud": "<client_id>",                  // Audience (our consent client ID)
 *   "iat": 1706745600,                     // Issued at
 *   "exp": 1706832000,                     // Expiry
 *   "ack_id": "<acknowledgement_id>",      // Consent acknowledgement ID
 *   "consent_status": "granted",           // Status of consent
 *   "consent_timestamp": "2026-01-31T...", // When consent was actioned
 *   "valid_until": "2026-02-01T...",       // Consent validity
 *   "scopes": ["age_verification"],        // Scopes consented
 *   "data_categories": ["age_band"],       // Data categories
 *   ...
 * }
 *
 * NOTE: The exact claim names may vary. This function checks multiple
 * possible field names for each value. Update as needed once the actual
 * MeriPehchaan postback format is confirmed in production.
 */
export function extractConsentArtefact(
  claims: Record<string, unknown>,
  rawJwt: string
): ConsentArtefact {
  // Extract acknowledgement ID — try multiple field names
  const acknowledgementId =
    (claims.ack_id as string) ||
    (claims.acknowledgement_id as string) ||
    (claims.acknowledgementId as string) ||
    (claims.consent_id as string) ||
    (claims.consentId as string) ||
    (claims.txn_id as string) ||
    (claims.jti as string) || // JWT ID as fallback
    `mp_consent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Extract subject/user ID
  const subjectId =
    (claims.sub as string) ||
    (claims.subject as string) ||
    (claims.user_id as string) ||
    (claims.userId as string) ||
    'unknown';

  // Extract consent status — normalize to our canonical values
  const rawStatus =
    (claims.consent_status as string) ||
    (claims.consentStatus as string) ||
    (claims.status as string) ||
    'granted';

  const statusMap: Record<string, ConsentArtefact['status']> = {
    granted: 'granted',
    approved: 'granted',
    accepted: 'granted',
    active: 'granted',
    denied: 'denied',
    rejected: 'denied',
    declined: 'denied',
    revoked: 'revoked',
    withdrawn: 'revoked',
    expired: 'expired',
    lapsed: 'expired',
  };
  const status = statusMap[rawStatus.toLowerCase()] || 'granted';

  // Extract timestamp
  const consentTimestamp =
    (claims.consent_timestamp as string) ||
    (claims.consentTimestamp as string) ||
    (claims.timestamp as string) ||
    (claims.iat ? new Date((claims.iat as number) * 1000).toISOString() : new Date().toISOString());

  // Extract validity
  const validUntil =
    (claims.valid_until as string) ||
    (claims.validUntil as string) ||
    (claims.exp ? new Date((claims.exp as number) * 1000).toISOString() : undefined);

  // Extract scopes
  const scopes = (claims.scopes as string[]) ||
    (claims.scope ? (claims.scope as string).split(' ') : undefined);

  // Extract data categories
  const dataCategories =
    (claims.data_categories as string[]) ||
    (claims.dataCategories as string[]) ||
    undefined;

  return {
    acknowledgementId,
    subjectId,
    status,
    consentTimestamp,
    validUntil,
    scopes,
    dataCategories,
    rawJwt,
    claims,
  };
}

// ============================================================================
// FULL POSTBACK PROCESSING
// ============================================================================

/**
 * Process an incoming consent postback.
 * 1. Validates postback key (if provided)
 * 2. Verifies JWT signature using static JWKS
 * 3. Extracts consent artefact from claims
 *
 * Returns the verified consent artefact or error details.
 */
export function processConsentPostback(
  jwt: string,
  postbackKey?: string
): PostbackVerificationResult {
  // Step 1: Validate postback key if provided
  if (postbackKey) {
    if (!validatePostbackKey(postbackKey)) {
      return {
        success: false,
        error: 'Invalid postback key',
        errorCode: 'INVALID_POSTBACK_KEY',
      };
    }
  }

  // Step 2: Verify JWT
  const verificationResult = verifyConsentJwt(jwt);
  if (!verificationResult.valid) {
    return {
      success: false,
      error: verificationResult.error || 'JWT verification failed',
      errorCode: 'JWT_VERIFICATION_FAILED',
    };
  }

  // Step 3: Validate audience claim matches our consent client ID
  const expectedAudience = process.env.MERIPEHCHAAN_CONSENT_CLIENT_ID;
  if (expectedAudience && verificationResult.claims) {
    const aud = verificationResult.claims.aud;
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.includes(expectedAudience)) {
      return {
        success: false,
        error: `JWT audience mismatch: expected ${expectedAudience}`,
        errorCode: 'AUDIENCE_MISMATCH',
      };
    }
  }

  // Step 4: Extract consent artefact
  const artefact = extractConsentArtefact(verificationResult.claims!, jwt);

  return {
    success: true,
    artefact,
  };
}

// ============================================================================
// CONSENT API HELPERS
// ============================================================================

/**
 * Configuration for MeriPehchaan consent API calls.
 * These are used when we need to query/update consent records
 * via MeriPehchaan's consent service API.
 */
export function getConsentApiConfig() {
  return {
    clientId: process.env.MERIPEHCHAAN_CONSENT_CLIENT_ID || '',
    postbackKey: process.env.MERIPEHCHAAN_CONSENT_POSTBACK_KEY || '',
    callbackKey: process.env.MERIPEHCHAAN_CONSENT_CALLBACK_KEY || '',
    // MeriPehchaan consent service base URL (API Setu)
    baseUrl:
      process.env.MERIPEHCHAAN_CONSENT_API_BASE_URL ||
      'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
  };
}

/**
 * Generate HMAC signature for outgoing consent API requests.
 * Some MeriPehchaan endpoints require HMAC-signed request bodies.
 */
export function generateHmacSignature(payload: string): string {
  const key = process.env.MERIPEHCHAAN_CONSENT_POSTBACK_KEY;
  if (!key) {
    throw new Error('MERIPEHCHAAN_CONSENT_POSTBACK_KEY not configured');
  }

  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}
