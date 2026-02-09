/**
 * Age Verification JWT Token Utility
 *
 * Signs and verifies JWTs for anonymous age verification via DigiLocker.
 * Uses the `jose` library with HS256 and a key derived from SUPABASE_SERVICE_ROLE_KEY.
 * No new env vars needed - reuses existing secret with a unique HKDF salt.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// ============================================================================
// TYPES
// ============================================================================

export interface AgeVerificationClaims extends JWTPayload {
  isAdult: boolean;
  ageThreshold: number;
}

export interface SignTokenOptions {
  isAdult: boolean;
  ageThreshold: number;
  widgetId: string;
  validityDays: number;
}

// ============================================================================
// KEY DERIVATION
// ============================================================================

let _cachedKey: CryptoKey | null = null;

/**
 * Derive a signing key from SUPABASE_SERVICE_ROLE_KEY using HKDF.
 * The salt "age-verification" ensures this key is distinct from any other
 * derivation of the same secret.
 */
async function getJWTSecret(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for age verification tokens');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'HKDF',
    false,
    ['deriveKey']
  );

  _cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode('age-verification'),
      info: encoder.encode('consently-age-token-v1'),
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );

  return _cachedKey;
}

// ============================================================================
// SIGN / VERIFY
// ============================================================================

/**
 * Sign an age verification JWT.
 *
 * @returns Compact JWS string
 */
export async function signAgeVerificationToken(options: SignTokenOptions): Promise<string> {
  const { isAdult, ageThreshold, widgetId, validityDays } = options;
  const secret = await getJWTSecret();

  const token = await new SignJWT({ isAdult, ageThreshold } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('consently.in')
    .setAudience(widgetId)
    .setIssuedAt()
    .setExpirationTime(`${validityDays}d`)
    .sign(secret);

  return token;
}

/**
 * Verify an age verification JWT and return the claims.
 *
 * @returns Claims if valid, null otherwise
 */
export async function verifyAgeVerificationToken(
  token: string,
  widgetId: string
): Promise<AgeVerificationClaims | null> {
  try {
    const secret = await getJWTSecret();

    const { payload } = await jwtVerify(token, secret, {
      issuer: 'consently.in',
      audience: widgetId,
    });

    return payload as AgeVerificationClaims;
  } catch (error) {
    console.warn('[AgeVerificationToken] Verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
