/**
 * MeriPehchaan (DigiLocker) Callback Route — CANONICAL
 *
 * This is the PRODUCTION callback URL registered with API Setu:
 *   https://www.consently.in/api/auth/meri-pehchaan/callback
 *
 * Note the hyphen in "meri-pehchaan" — this MUST match the API Setu
 * dashboard exactly (byte-for-byte) for OAuth redirect_uri validation.
 *
 * The actual callback handler lives in the age-verification callback route.
 */

export { GET, OPTIONS } from '@/app/api/dpdpa/age-verification/callback/route';
