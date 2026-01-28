# DigiLocker Client ID Configuration Fix

## Issue

DigiLocker OAuth returns **400 Bad Request - invalid_client_id**:
```
The client_id parameter is invalid
```

## Root Cause

The `APISETU_CLIENT_ID` in `.env.local` is set to `consently.in` (your domain name), but DigiLocker expects the **actual Client ID issued by API Setu**.

## How to Fix

### Step 1: Get Your Actual Client ID

1. Go to [API Setu Partners Portal](https://partners.apisetu.gov.in)
2. Log in with your credentials
3. Go to your dashboard
4. Find your **Client ID** or **Issuer ID** (usually shown at the bottom of the dashboard)
5. The format is typically reverse domain notation like:
   - `in.consently`
   - `IN123456789`
   - Or a unique identifier issued by API Setu

### Step 2: Update .env.local

Open `/Users/krissdev/consently-dev/.env.local` and update:

**Current (WRONG):**
```bash
APISETU_CLIENT_ID=consently.in
```

**Should be (EXAMPLE - use your actual ID):**
```bash
APISETU_CLIENT_ID=in.consently
# OR whatever ID is shown in your API Setu dashboard
```

### Step 3: Verify Other Settings

Make sure these are also correct in `.env.local`:

```bash
# Client Secret from API Setu dashboard
APISETU_CLIENT_SECRET=your-actual-secret

# Must EXACTLY match what you registered in API Setu
APISETU_REDIRECT_URI=https://consently.in/api/dpdpa/age-verification/callback

# Correct OAuth endpoint (includes /public/oauth2/1)
DIGILOCKER_OAUTH_BASE_URL=https://api.digitallocker.gov.in/public/oauth2/1

# Scope (openid is standard for age verification)
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid
```

### Step 4: Update Redirect URI in API Setu Dashboard

The callback URL has changed. Update your API Setu dashboard with:

**Old URL (might be registered):**
```
https://consently.in/api/auth/meripehchaan/callback
```

**New URL (current code expects):**
```
https://consently.in/api/dpdpa/age-verification/callback
```

Make sure the redirect URI in `.env.local` matches what's registered in API Setu **exactly** (including protocol, subdomain, path, and no trailing slash).

### Step 5: Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

## Testing

### Option 1: Use Mock Mode (Recommended for Development)

Set this in `.env.local`:
```bash
APISETU_USE_MOCK=true
```

This bypasses DigiLocker entirely and uses mock responses for testing.

Mock codes:
- `mock_adult_code` - Returns age 30 (adult)
- `mock_minor_code` - Returns age 15 (minor)
- `mock_edge_18_code` - Returns exactly 18 years old
- `mock_edge_17_code` - Returns 17 years 364 days old

### Option 2: Use Sandbox

If API Setu provided sandbox credentials:

```bash
APISETU_USE_SANDBOX=true
DIGILOCKER_SANDBOX_OAUTH_URL=https://api.sandbox.digitallocker.gov.in/public/oauth2/1
APISETU_SANDBOX_URL=https://api.sandbox.digitallocker.gov.in/public/oauth2/1
```

### Option 3: Production

Only after testing mock/sandbox, set:
```bash
APISETU_USE_MOCK=false
APISETU_USE_SANDBOX=false
```

## Common Errors

### "invalid_client_id"
- Client ID doesn't match what's registered
- Client ID is in wrong format
- Using domain name instead of actual client ID

### "redirect_uri_mismatch"
- Redirect URI in `.env.local` doesn't match API Setu registration
- Check for trailing slashes, http vs https, www vs non-www

### "invalid_scope"
- Requested scope not enabled for your client
- Check your API Setu dashboard for enabled scopes
- Standard scope for age verification is `openid`

### "unauthorized_client"
- Client secret is incorrect
- Client credentials expired or revoked
- Check API Setu dashboard for status

## Support

If you don't have API Setu credentials yet:
1. Register at [API Setu Partners Portal](https://partners.apisetu.gov.in)
2. Request access to DigiLocker APIs
3. Wait for approval (can take a few days)
4. Once approved, you'll see your client credentials

For urgent testing, use mock mode:
```bash
APISETU_USE_MOCK=true
```
