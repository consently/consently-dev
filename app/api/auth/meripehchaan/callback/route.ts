/**
 * MeriPehchaan Callback Route — LEGACY ALIAS (no hyphen)
 *
 * The canonical callback URL (registered in API Setu) uses a hyphen:
 *   https://www.consently.in/api/auth/meri-pehchaan/callback
 *
 * This non-hyphenated route is kept as a safety fallback.
 * The canonical route is at: /api/auth/meri-pehchaan/callback
 */

export { GET, OPTIONS } from '@/app/api/dpdpa/age-verification/callback/route';
