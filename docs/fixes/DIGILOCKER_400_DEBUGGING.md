# DigiLocker 400 Bad Request Debugging

## Error

```
GET https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?... 400 (Bad Request)
```

## Current Parameters Being Sent

Based on code analysis, we're sending:
- `response_type=code`
- `client_id=NQ6399EE1C`
- `redirect_uri=https://consently.in/api/auth/meripehchaan/callback`
- `state={random_hex}`
- `scope=avs+avs_parent` (space becomes +)
- `code_challenge={base64url_sha256}`
- `code_challenge_method=S256`

## Possible Causes

### 1. Missing Flow Parameter

Looking at the API Setu test page screenshot, the OAuth URL includes a `flow` parameter:
- `flow=Sign-in` or `flow=Aadhaar`

**Test This:**
```javascript
// Add to authorization URL generation
const params = new URLSearchParams({
  response_type: 'code',
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  state: stateToken,
  scope: config.scope,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  flow: 'Aadhaar', // ← Try adding this
});
```

### 2. Scope Mismatch

The API Setu test page shows these scope options:
- Age verification
- Guardian consent

But we're sending `avs avs_parent`. This might need to be exact scope strings from their API.

**Verify in API Setu Dashboard:**
- Check what exact scope values are enabled
- They might be case-sensitive
- Format might be different (e.g., `age_verification` vs `avs`)

### 3. Client Credentials Issue

**Check:**
- Is the client ID `NQ6399EE1C` active and approved?
- Has the redirect URI been registered exactly as `https://consently.in/api/auth/meripehchaan/callback`?
- Is the application still in sandbox/test mode?

### 4. ACR (Authentication Context Class Reference)

Looking at the test page, there's an ACR parameter for authentication level. The API might require:
```javascript
acr_values: 'DL' // or 'PAN', 'Aadhaar Verified', etc.
```

### 5. AMR (Authentication Methods Reference)

The test page shows AMR options:
- All
- DL (DigiLocker)
- Pan
- Aadhaar
- etc.

**Try adding:**
```javascript
amr: 'All' // or specific method
```

## Recommended Testing Steps

### Step 1: Check API Setu Dashboard

1. Log into https://consume.apisetu.gov.in/consumer/authpartners
2. Click on "Test API" for your application
3. Generate a test URL using their UI
4. Compare the generated URL with ours
5. Note any extra parameters they include

### Step 2: Try Mock Mode First

Set in `.env.local`:
```bash
APISETU_USE_MOCK=true
```

This bypasses DigiLocker entirely and lets you test the rest of the flow.

### Step 3: Test with Minimum Parameters

Try removing PKCE temporarily to isolate the issue:
```javascript
const params = new URLSearchParams({
  response_type: 'code',
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  state: stateToken,
  scope: config.scope,
  // Remove PKCE temporarily
});
```

If this works, the issue is with PKCE implementation.
If this still fails, the issue is with client credentials or other parameters.

### Step 4: Check Browser Console for Details

The 400 error might include a response body with details. Check:
1. Open browser DevTools → Network tab
2. Find the failed request
3. Click on it
4. Check "Response" tab for error details
5. Look for error codes like:
   - `invalid_client`
   - `invalid_scope`
   - `invalid_request`
   - `unsupported_response_type`

### Step 5: Contact API Setu Support

If the issue persists:
1. Save the exact URL being generated
2. Save the error response
3. Contact API Setu support with:
   - Client ID: NQ6399EE1C
   - Exact URL being generated
   - Error response
   - Ask what parameters are missing or incorrect

## Quick Fixes to Try

### Fix 1: Add Flow Parameter

```typescript
// In lib/apisetu-digilocker.ts, generateAuthorizationUrl()
const params = new URLSearchParams({
  response_type: 'code',
  client_id: this.config.clientId,
  redirect_uri: this.config.redirectUri,
  state: stateToken,
  scope: this.config.scope,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  flow: 'Aadhaar', // Add this
});
```

### Fix 2: Add State Format (OIDC)

Some OAuth servers expect state in a specific format:
```typescript
// Instead of random hex
const stateToken = `oidc_flow_${crypto.randomBytes(16).toString('hex')}`;
```

### Fix 3: Try Different Scope Format

```bash
# In .env.local, try:
DIGILOCKER_AGE_VERIFICATION_SCOPE=aadhaar_name aadhaar_dob
# or
DIGILOCKER_AGE_VERIFICATION_SCOPE=resident.aadhaar
# or check API Setu docs for exact scope strings
```

## Environment Variables to Verify

Check `.env.local` has:
```bash
APISETU_CLIENT_ID=NQ6399EE1C
APISETU_CLIENT_SECRET=b7984c3d165cd3c82249
APISETU_REDIRECT_URI=https://consently.in/api/auth/meripehchaan/callback
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
APISETU_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
DIGILOCKER_AGE_VERIFICATION_SCOPE=avs avs_parent
APISETU_USE_MOCK=false
```

## Next Steps

1. **Get the actual error message** from the 400 response
2. **Use API Setu's test page** to generate a working URL
3. **Compare** their URL with ours parameter by parameter
4. **Add missing parameters** (likely `flow` and possibly `acr_values`)

## Temporary Workaround

Use mock mode while investigating:
```bash
APISETU_USE_MOCK=true
```

This lets you continue development while figuring out the OAuth issue.
