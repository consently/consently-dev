# DigiLocker PKCE Implementation Fix

## Issue

When initiating DigiLocker age verification, the OAuth flow fails with:

```
Authentication Error
The code_challenge and code_challenge_method parameter is required
```

## Root Cause

MeriPehchaan/DigiLocker requires **PKCE (Proof Key for Code Exchange)** for OAuth security, but our implementation was not generating or sending PKCE parameters.

PKCE is a security extension to OAuth 2.0 that prevents authorization code interception attacks. It requires:
1. **code_verifier**: A random string (43-128 characters)
2. **code_challenge**: SHA-256 hash of the verifier, base64url encoded
3. **code_challenge_method**: `S256` (SHA-256)

## What is PKCE?

PKCE (RFC 7636) protects against:
- Authorization code interception attacks
- Cross-site request forgery (CSRF)
- Man-in-the-middle attacks

### PKCE Flow

```
1. Client generates random code_verifier
2. Client creates code_challenge = SHA256(code_verifier)
3. Client sends code_challenge to authorization server
4. User authorizes, server returns authorization code
5. Client sends authorization code + original code_verifier to token endpoint
6. Server verifies SHA256(code_verifier) matches stored code_challenge
7. Server returns access token if verification succeeds
```

## Changes Made

### 1. Updated `lib/apisetu-digilocker.ts`

**Added PKCE generation functions:**

```typescript
// Generate PKCE code verifier (random 43-character base64url string)
generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Generate PKCE code challenge (SHA-256 hash of verifier)
generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
```

**Updated authorization URL generation:**

```typescript
generateAuthorizationUrl(stateToken: string, codeVerifier: string): string {
  const codeChallenge = this.generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: this.config.clientId,
    redirect_uri: this.config.redirectUri,
    state: stateToken,
    scope: this.config.scope,
    code_challenge: codeChallenge,          // ✅ Added
    code_challenge_method: 'S256',          // ✅ Added
  });

  return `${this.getOAuthBaseUrl()}/authorize?${params.toString()}`;
}
```

**Updated token exchange:**

```typescript
async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const response = await fetch(`${this.getOAuthBaseUrl()}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,          // ✅ Added
    }),
  });

  return await response.json();
}
```

### 2. Updated Session Creation (`app/api/dpdpa/age-verification/route.ts`)

```typescript
// Generate PKCE code verifier along with other session tokens
const sessionId = apiSetuService.generateSessionId();
const stateToken = apiSetuService.generateStateToken();
const codeVerifier = apiSetuService.generateCodeVerifier();  // ✅ New

// Pass code verifier to authorization URL generator
const redirectUrl = apiSetuService.generateAuthorizationUrl(stateToken, codeVerifier);

// Store code_verifier in database for callback
await supabase.from('age_verification_sessions').insert({
  session_id: sessionId,
  state_token: stateToken,
  code_verifier: codeVerifier,  // ✅ New
  // ... other fields
});
```

### 3. Updated Callback Handler (`app/api/dpdpa/age-verification/callback/route.ts`)

```typescript
// Retrieve code_verifier from session
const codeVerifier = session.code_verifier || '';

if (!codeVerifier && !isMock) {
  return redirectWithError('internal_error', 'Session data incomplete');
}

// Pass code verifier to token exchange
const result = await apiSetuService.completeVerification(code, codeVerifier);
```

### 4. Database Migration

Added `code_verifier` column to `age_verification_sessions` table:

```sql
ALTER TABLE public.age_verification_sessions
ADD COLUMN IF NOT EXISTS code_verifier TEXT;
```

## Files Changed

1. ✅ `lib/apisetu-digilocker.ts`
   - Added `generateCodeVerifier()`
   - Added `generateCodeChallenge()`
   - Updated `generateAuthorizationUrl()` signature
   - Updated `exchangeCodeForToken()` signature
   - Updated `completeVerification()` signature

2. ✅ `app/api/dpdpa/age-verification/route.ts`
   - Generate code verifier during session creation
   - Store code verifier in database
   - Pass code verifier to authorization URL generator

3. ✅ `app/api/dpdpa/age-verification/callback/route.ts`
   - Retrieve code verifier from session
   - Pass code verifier to verification completion

4. ✅ `scripts/sql/add_code_verifier_to_age_verification_sessions.sql`
   - Database migration script

## Database Migration

Run this SQL in Supabase SQL Editor:

```bash
# Via psql
psql $DATABASE_URL < scripts/sql/add_code_verifier_to_age_verification_sessions.sql

# Or copy and paste into Supabase Dashboard → SQL Editor
```

## Security Benefits

### Before (Without PKCE)
- ❌ Authorization code could be intercepted
- ❌ Attackers could exchange stolen codes for tokens
- ❌ No protection against MITM attacks

### After (With PKCE)
- ✅ Authorization code interception is useless without verifier
- ✅ Only the original client can exchange the code
- ✅ Protected against MITM and replay attacks
- ✅ Complies with modern OAuth 2.0 best practices

## Testing

### 1. Verify Authorization URL

The generated URL should now include:

```
https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?
  response_type=code
  &client_id=NQ6399EE1C
  &redirect_uri=https://consently.in/api/auth/meripehchaan/callback
  &state={random_state}
  &scope=avs+avs_parent
  &code_challenge={base64url_encoded_sha256}  ✅ NEW
  &code_challenge_method=S256                  ✅ NEW
```

### 2. Test the Flow

1. Visit page with age verification
2. Click "Verify with DigiLocker"
3. Check console - should NOT see PKCE error anymore
4. Complete DigiLocker authorization
5. Should successfully callback and exchange token

### 3. Verify Database

Check that code_verifier is stored:

```sql
SELECT session_id, state_token, code_verifier, status
FROM age_verification_sessions
ORDER BY created_at DESC
LIMIT 5;
```

## Rollout Plan

### Development

1. ✅ Run database migration locally
2. ✅ Restart dev server
3. ✅ Test age verification flow
4. ✅ Verify no PKCE errors

### Production

1. Run migration in Supabase production:
   ```sql
   ALTER TABLE public.age_verification_sessions
   ADD COLUMN IF NOT EXISTS code_verifier TEXT;
   ```

2. Deploy updated code to Vercel

3. Test with a real DigiLocker account

4. Monitor for errors

## Troubleshooting

### Still getting "code_challenge parameter is required"

**Check:**
- Database migration ran successfully
- `code_verifier` column exists in `age_verification_sessions`
- Dev server restarted after code changes
- No cached sessions from before the fix

**Fix:**
```sql
-- Verify column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'age_verification_sessions'
AND column_name = 'code_verifier';

-- Clear old sessions
DELETE FROM age_verification_sessions
WHERE code_verifier IS NULL;
```

### "code_verifier parameter is invalid"

**Possible causes:**
- Code verifier doesn't match the challenge
- Code verifier was not stored correctly
- Session expired or was modified

**Debug:**
```typescript
console.log('Code verifier length:', codeVerifier.length);
console.log('Code verifier format:', /^[A-Za-z0-9_-]+$/.test(codeVerifier));
```

### Token exchange fails

**Check:**
- Code verifier retrieved from database correctly
- Code verifier matches the one used to generate challenge
- Authorization code hasn't been used already (codes are single-use)

## References

- [RFC 7636 - Proof Key for Code Exchange](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [API Setu DigiLocker Documentation](https://directory.apisetu.gov.in/api-collection/digilocker)

## Commit

This fix has been committed to the repository. Push to deploy:

```bash
git push origin main
```
