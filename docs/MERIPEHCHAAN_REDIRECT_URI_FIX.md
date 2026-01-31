# MeriPehchaan OAuth redirect_uri_mismatch Fix

## Problem

OAuth error: `redirect_uri_mismatch` when redirecting to MeriPehchaan authorize endpoint.

**Root Cause**: Two issues identified:

1. **Missing OAuth scope in environment** — The scope was hardcoded to `'avs'` in the code, but your AuthPartner (`JM56F33ABE`) is configured for `'openid age_verification'` in the API Setu dashboard.

2. **Missing environment variables** — The code had fallback defaults, but several OAuth parameters weren't explicitly set in `.env.local`, potentially causing mismatches in production.

## Solution Applied

### 1. Updated `lib/apisetu-digilocker.ts`

**Changed:**
```typescript
// OLD (hardcoded)
scope: 'avs',

// NEW (reads from environment with correct default)
scope: process.env.DIGILOCKER_AGE_VERIFICATION_SCOPE || 'openid age_verification',
```

**Added debug logging** to help diagnose configuration issues in production:
```typescript
console.log('[ApiSetuDigiLocker] Configuration loaded:', {
  clientId: this.config.clientId,
  redirectUri: this.config.redirectUri,
  scope: this.config.scope,
  oauthBaseUrl: this.config.oauthBaseUrl,
  // ... other params
});
```

### 2. Updated `.env.local`

Added explicit OAuth parameters to match your API Setu AuthPartner dashboard configuration:

```env
# OAuth Base URLs
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
APISETU_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1

# OAuth Parameters (must match API Setu AuthPartner dashboard)
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid age_verification
DIGILOCKER_ACR=aadhaar+email+mobile
DIGILOCKER_AMR=aadhaar
DIGILOCKER_PLA=Y
DIGILOCKER_DL_FLOW=signin
```

## Verification Checklist

Before testing, confirm these exact matches:

### In API Setu Dashboard (AuthPartner JM56F33ABE)

- [ ] **Callback URL**: `https://www.consently.in/api/auth/meripehchaan/callback`
  - Exact match: `www` subdomain, no trailing slash, `/api/auth/meri-pehchaan/callback` path
- [ ] **Scopes**: OpenID, Age verification checkboxes selected
- [ ] **ACR**: Aadhaar Verified, Email, Mobile checkboxes selected
- [ ] **AMR**: Aadhaar checkbox selected
- [ ] **Flow**: Sign-in radio button selected
- [ ] **Client ID**: `JM56F33ABE`

### In Your Environment (.env.local and Vercel/Production)

```env
APISETU_CLIENT_ID=JM56F33ABE
APISETU_CLIENT_SECRET=268556b4c1c37e792097
APISETU_REDIRECT_URI=https://www.consently.in/api/auth/meripehchaan/callback
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid age_verification
```

## Expected Authorize URL

After the fix, the generated authorize URL should be:

```
https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
  ?response_type=code
  &client_id=JM56F33ABE
  &state=<generated_state>
  &redirect_uri=https://www.consently.in/api/auth/meripehchaan/callback
  &code_challenge=<pkce_challenge>
  &code_challenge_method=S256
  &dl_flow=signin
  &amr=aadhaar
  &scope=openid age_verification
  &pla=Y
  &acr=aadhaar+email+mobile
```

**Key points:**
- ✅ `redirect_uri` is present and URL-encoded
- ✅ `scope=openid age_verification` (matches dashboard)
- ✅ All NSSO parameters match dashboard config

## Testing Steps

### Local Testing (Development)

**Note:** MeriPehchaan OAuth **will not work on localhost** because the registered callback URL is `https://www.consently.in`. You must test on the production domain or use mock mode.

#### Option 1: Use Mock Mode
```env
# In .env.local
APISETU_USE_MOCK=true
```

This bypasses the real MeriPehchaan flow and simulates verification results.

#### Option 2: Test on Production Domain
Deploy to production/staging and test there.

### Production Testing

1. **Deploy the changes** to Vercel/production

2. **Add environment variables** in Vercel dashboard:
   ```
   APISETU_CLIENT_ID=JM56F33ABE
   APISETU_CLIENT_SECRET=268556b4c1c37e792097
   APISETU_REDIRECT_URI=https://www.consently.in/api/auth/meripehchaan/callback
   DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
   DIGILOCKER_AGE_VERIFICATION_SCOPE=openid age_verification
   DIGILOCKER_ACR=aadhaar+email+mobile
   DIGILOCKER_AMR=aadhaar
   DIGILOCKER_PLA=Y
   DIGILOCKER_DL_FLOW=signin
   AGE_VERIFICATION_JWT_SECRET=<your-secret>
   ```

3. **Trigger a new deployment** (Vercel auto-deploys on git push)

4. **Test the age verification flow**:
   - Navigate to your widget or age verification initiation endpoint
   - Click "Verify Age via DigiLocker"
   - Should redirect to MeriPehchaan login
   - Check browser DevTools → Network → the redirect URL should match the expected format above

5. **Check server logs** in Vercel:
   - Look for `[ApiSetuDigiLocker] Configuration loaded:` log
   - Verify `redirectUri` and `scope` are correct

6. **Complete the flow**:
   - Authenticate with DigiLocker (use test Aadhaar if sandbox)
   - Should redirect back to `/api/auth/meripehchaan/callback` with `code` parameter
   - Age verification should complete successfully

## Troubleshooting

### Still getting redirect_uri_mismatch?

1. **Check exact string match** — Even a single character difference causes mismatch:
   - `http` vs `https`
   - `www.consently.in` vs `consently.in`
   - `/api/auth/meripehchaan/callback` vs `/api/auth/meri-pehchaan/callback`
   - Trailing slash

2. **Verify environment variables are loaded**:
   ```bash
   # In Vercel dashboard, check Environment Variables tab
   # Ensure APISETU_REDIRECT_URI is set correctly
   ```

3. **Clear cache and retry**:
   - Clear browser cache/cookies
   - Use incognito/private window
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

4. **Check production logs**:
   ```bash
   # Vercel CLI
   vercel logs <deployment-url>

   # Look for the log line showing the generated authorize URL
   [ApiSetuDigiLocker] NSSO AUTHORIZE URL: https://...
   ```

5. **Verify API Setu dashboard** — Sometimes the dashboard has a delay updating. Re-save the callback URL and wait 5-10 minutes.

### Error: "Invalid scope" or "scope not authorized"

Your AuthPartner doesn't have the requested scopes enabled. In API Setu dashboard:
- Go to AuthPartner details for `JM56F33ABE`
- Check **OpenID** and **Age verification** scopes
- Save and retry

### Error: "Invalid client_id"

Either:
- `APISETU_CLIENT_ID` is not set correctly
- Client ID `JM56F33ABE` was deleted or suspended in API Setu
- Check dashboard: consume.apisetu.gov.in → AuthPartners

### Error: "Token exchange failed" (after successful redirect)

This happens **after** successful authorize redirect. It means:
- `APISETU_CLIENT_SECRET` is incorrect
- PKCE `code_verifier` mismatch
- Authorization code expired (user took too long)

Check:
1. `APISETU_CLIENT_SECRET` matches dashboard exactly
2. Session storage (`age_verification_sessions` table) has valid `code_verifier`
3. User completes flow within 10 minutes

## Rollback Plan

If the fix causes issues, revert to the previous scope:

```typescript
// In lib/apisetu-digilocker.ts line 182
scope: 'avs',  // Revert to old value
```

And remove the new env vars. But this will only work if your AuthPartner is configured for `avs` scope (old config).

## API Setu Contact

If issues persist after following all steps:
- Email: support@apisetu.gov.in
- Portal: consume.apisetu.gov.in → Support → Raise Ticket
- Include: Client ID, error screenshots, authorize URL

## Next Steps After Fix

Once age verification works:
1. Test the full consent flow (user authenticates → age verified → consent recorded)
2. Verify consent artefact postback to `/api/meri-pehchaan/consent/postback`
3. Monitor audit logs (`audit_logs` table) for verification events
4. Set up monitoring/alerts for verification failures

---

**Fix Applied:** 2026-01-31
**Scope Changed:** `'avs'` → `'openid age_verification'`
**Config Loaded:** From `DIGILOCKER_AGE_VERIFICATION_SCOPE` env var
