/**
 * MeriPehchaan (DigiLocker) Callback Route Alias
 *
 * This route handles callbacks from API Setu's DigiLocker OAuth flow.
 * It re-exports the main age verification callback handler.
 *
 * Callback URL registered with API Setu:
 * https://consently.in/api/auth/meripehchaan/callback
 */

export { GET, OPTIONS } from '@/app/api/dpdpa/age-verification/callback/route';
