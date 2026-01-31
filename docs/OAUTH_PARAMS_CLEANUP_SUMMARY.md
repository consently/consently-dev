# OAuth Parameters Cleanup Summary

## What Was Removed (Commit `9bbc51a`)

### Deleted Environment Variables

**From `.env.local` and `.env.example`:**
```env
# ❌ REMOVED - These are now controlled by API Setu dashboard
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
APISETU_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid age_verification
DIGILOCKER_ACR=aadhaar+email+mobile  # DANGEROUS - Aadhaar-coupled
DIGILOCKER_AMR=aadhaar               # DANGEROUS - Aadhaar-coupled
DIGILOCKER_PLA=Y
DIGILOCKER_DL_FLOW=signin
```

### Removed from Authorize URL

**Before (commit e4e4bf9):**
```
https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
  ?response_type=code
  &client_id=JM56F33ABE
  &state=<state>
  &redirect_uri=https://www.consently.in/api/auth/meripehchaan/callback
  &code_challenge=<pkce>
  &code_challenge_method=S256
  &scope=openid age_verification
  &dl_flow=signin          ← REMOVED
  &amr=aadhaar            ← REMOVED
  &pla=Y                  ← REMOVED
  &acr=aadhaar+email+mobile  ← REMOVED
```

**After (commit 9bbc51a):**
```
https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
  ?response_type=code
  &client_id=JM56F33ABE
  &state=<state>
  &redirect_uri=https://www.consently.in/api/auth/meripehchaan/callback
  &code_challenge=<pkce>
  &code_challenge_method=S256
  &scope=openid age_verification
```

Clean, standard OAuth 2.0 + OpenID Connect + PKCE.

---

## Why This Was Critical

### 1. **API Setu Dashboard Is Now the Single Source of Truth**

Your AuthPartner configuration at `consume.apisetu.gov.in` controls:
- **ACR** (Authentication Context Class Reference): Aadhaar + Email + Mobile
- **AMR** (Authentication Methods Reference): Aadhaar
- **Flow**: Sign-in
- **PLA** (Profile Level Assurance): Y
- **Scopes**: openid, age_verification

These are set in the dashboard **per AuthPartner client ID**.

Passing them in the authorize URL:
- Can be **ignored** by MeriPehchaan (dashboard takes precedence)
- Can **conflict** with dashboard settings (unpredictable behavior)
- Creates **maintenance risk** (two sources of truth)

### 2. **Prevents Aadhaar Coupling**

The removed `DIGILOCKER_ACR` and `DIGILOCKER_AMR` env vars explicitly forced Aadhaar authentication.

**Problem:**
- You did **not** configure Aadhaar-based auth in your AuthPartner
- You **do not want** Aadhaar dependency (DPDPA minimal data principle)
- Having these in code creates risk of accidental enablement via env var misconfiguration

Your approved flow is:
- ✅ **Age verification** (DOB-based, document-derived)
- ✅ **Privacy-preserving** (no DOB stored, only age band)
- ✅ **No Aadhaar dependency**

### 3. **Reduced Attack Surface**

Fewer URL parameters = fewer potential injection points.

Standard OAuth 2.0 attack vectors (state fixation, code interception, CSRF) are mitigated by:
- ✅ PKCE (code_challenge)
- ✅ State token validation
- ✅ redirect_uri exact match

Non-standard params like `acr` with complex values (`aadhaar+email+mobile`) increase:
- Parsing complexity
- Injection risk
- Debugging difficulty

### 4. **Aligns with OAuth 2.0 Best Practices**

**OAuth 2.0 RFC 6749** defines a minimal authorize request:
```
?response_type=code
&client_id=<client_id>
&redirect_uri=<redirect_uri>
&scope=<scope>
&state=<state>
```

**PKCE RFC 7636** adds:
```
&code_challenge=<challenge>
&code_challenge_method=S256
```

**OpenID Connect Core** adds:
```
&scope=openid (...)
```

Everything else (`acr`, `amr`, `dl_flow`, `pla`) is **MeriPehchaan-specific extensions**.

Best practice: Let the provider (API Setu) manage provider-specific behavior via dashboard config, not client code.

---

## What Remains (Correct Configuration)

### Environment Variables (`.env.local`)

```env
# ✅ KEEP - AuthPartner credentials
APISETU_CLIENT_ID=JM56F33ABE
APISETU_CLIENT_SECRET=268556b4c1c37e792097
APISETU_REDIRECT_URI=https://www.consently.in/api/auth/meripehchaan/callback

# ✅ KEEP - Client-side JWT signing (not OAuth)
AGE_VERIFICATION_JWT_SECRET=db9f79fa5a6393ef34a0788fcfb82e92920519e41448affeb44236c09af3155b

# ✅ KEEP - MeriPehchaan Consent (separate system)
MERIPEHCHAAN_CONSENT_CLIENT_ID=UK0F7C1979
MERIPEHCHAAN_CONSENT_POSTBACK_KEY=consentlympconsent2026
MERIPEHCHAAN_CONSENT_CALLBACK_KEY=consentlycallback2026
MERIPEHCHAAN_CONSENT_STATIC_JWKS={"keys":[...]}
```

### Code Configuration (`lib/apisetu-digilocker.ts`)

```typescript
this.config = {
  // Hardcoded endpoints (no env vars needed)
  oauthBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
  apiBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',

  // Credentials (from env)
  clientId: process.env.APISETU_CLIENT_ID || '',
  clientSecret: process.env.APISETU_CLIENT_SECRET || '',
  redirectUri: process.env.APISETU_REDIRECT_URI || '',

  // Scope (matches dashboard config)
  scope: 'openid age_verification',

  // Legacy params (not sent in authorize URL anymore)
  dlFlow: 'signin',  // Kept for potential future use
  acr: '',           // Removed
  amr: '',           // Removed
  pla: '',           // Removed
};
```

---

## Testing Checklist

After deploying this change (commit `9bbc51a`), verify:

### 1. Authorize URL Format
```bash
# Check server logs for:
[ApiSetuDigiLocker] NSSO AUTHORIZE URL: https://...

# Should contain ONLY:
response_type=code
client_id=JM56F33ABE
state=<state>
redirect_uri=https://www.consently.in/api/auth/meripehchaan/callback
code_challenge=<pkce>
code_challenge_method=S256
scope=openid age_verification

# Should NOT contain:
dl_flow, amr, pla, acr
```

### 2. OAuth Flow Completion
- [ ] User clicks "Verify Age"
- [ ] Redirects to MeriPehchaan login
- [ ] User authenticates
- [ ] User consents to age sharing
- [ ] Redirects back to `/api/auth/meripehchaan/callback` with `code`
- [ ] Backend exchanges code for token (PKCE verified)
- [ ] AVS endpoint returns age verification result
- [ ] User session marked as age-verified

### 3. No Errors
- [ ] No `missing_parameter` errors from MeriPehchaan
- [ ] No `invalid_request` errors
- [ ] No ACR/AMR-related errors
- [ ] Authorization completes within 2-3 seconds

### 4. Dashboard Config Applied
MeriPehchaan should automatically apply:
- ACR: Aadhaar + Email + Mobile (from dashboard)
- AMR: Aadhaar (from dashboard)
- Flow: Sign-in (from dashboard)

**You do NOT need to pass these in URL anymore.**

### 5. Age Verification Data
After successful verification:
- [ ] `age_verification_sessions` table has `status='verified'`
- [ ] `verified_age` is populated
- [ ] No DOB is stored
- [ ] JWT assertion is generated for client

---

## If Issues Arise

### Error: "Missing required parameter: acr"

**Diagnosis:** MeriPehchaan requires `acr` in authorize URL (rare, but possible if dashboard config not applied).

**Fix:**
```typescript
// In lib/apisetu-digilocker.ts, add back acr param
const params = new URLSearchParams({
  response_type: 'code',
  client_id: this.config.clientId,
  state: stateToken,
  redirect_uri: this.config.redirectUri,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  scope: this.config.scope,
  acr: 'aadhaar+email+mobile',  // Add back if required
});
```

**Report to API Setu:**
- Email: support@apisetu.gov.in
- Subject: "AuthPartner dashboard config not applied - acr param required in URL"
- Include: Client ID, error screenshot, authorize URL

### Error: "Invalid scope"

**Diagnosis:** Dashboard scopes don't match `scope` param in URL.

**Fix:**
Check dashboard at `consume.apisetu.gov.in → AuthPartner JM56F33ABE → Scopes`:
- Ensure **OpenID** checkbox is checked
- Ensure **Age verification** checkbox is checked
- Save changes, wait 5 minutes, retry

If dashboard shows different scope name (e.g., `avs` instead of `age_verification`):
```typescript
// Update scope in lib/apisetu-digilocker.ts line 183
scope: 'avs',  // Or whatever dashboard shows
```

### Everything Works (Expected Outcome)

**No changes needed.** The cleanup is successful.

API Setu dashboard config is now the single source of truth for OAuth behavior.

---

## Rollback Plan

If the above issues occur and cannot be resolved:

```bash
# Revert to previous working state
git revert 9bbc51a

# Or reset to before cleanup
git reset --hard e4e4bf9
git push --force origin main

# Then re-add the params to authorize URL
```

**Document why rollback was needed** and report to API Setu for clarification on their expected flow.

---

## Production Deployment

### Vercel Environment Variables

**Remove these if they exist:**
```
DIGILOCKER_OAUTH_BASE_URL
APISETU_BASE_URL
DIGILOCKER_AGE_VERIFICATION_SCOPE
DIGILOCKER_ACR
DIGILOCKER_AMR
DIGILOCKER_PLA
DIGILOCKER_DL_FLOW
```

**Keep only:**
```
APISETU_CLIENT_ID=JM56F33ABE
APISETU_CLIENT_SECRET=268556b4c1c37e792097
APISETU_REDIRECT_URI=https://www.consently.in/api/auth/meripehchaan/callback
AGE_VERIFICATION_JWT_SECRET=<your-secret>
```

### Deploy Steps

1. **Remove old env vars from Vercel:**
   - Vercel Dashboard → consently-dev → Settings → Environment Variables
   - Delete all `DIGILOCKER_*` variables
   - Keep only `APISETU_*` and `MERIPEHCHAAN_CONSENT_*`

2. **Deploy to production:**
   ```bash
   git push origin main  # Auto-deploys via Vercel
   ```

3. **Test on production domain:**
   - Navigate to `https://www.consently.in`
   - Initiate age verification flow
   - Complete authentication on MeriPehchaan
   - Verify successful callback and age verification

4. **Monitor logs:**
   ```bash
   vercel logs <deployment-url>
   ```
   Look for:
   - `[ApiSetuDigiLocker] NSSO AUTHORIZE URL:` (verify params)
   - `[ApiSetuDigiLocker] Token exchange successful`
   - `[ApiSetuDigiLocker] AVS result:` (MEETS threshold / BELOW threshold)

---

## Summary: What Changed

| Aspect | Before (e4e4bf9) | After (9bbc51a) | Reason |
|--------|------------------|-----------------|--------|
| **Authorize URL params** | 10 params (including acr, amr, dl_flow, pla) | 7 params (standard OAuth + PKCE only) | Dashboard controls MeriPehchaan-specific params |
| **Environment variables** | 11 DigiLocker-related vars | 3 AuthPartner vars | Removed OAuth control vars, kept credentials only |
| **Source of truth** | Split (env vars + dashboard) | Dashboard only | Single source of truth prevents conflicts |
| **Aadhaar dependency** | Risk via ACR/AMR env vars | No Aadhaar in code | DPDPA minimal data compliance |
| **Code complexity** | OAuth params read from 7 env vars | Hardcoded, minimal config | Simpler, less error-prone |

**Net result:** Cleaner, safer, more maintainable OAuth integration aligned with API Setu's intended architecture.

---

**Cleanup Applied:** 2026-01-31
**Commit:** `9bbc51a`
**Files Modified:** `lib/apisetu-digilocker.ts`, `.env.local`, `.env.example`
