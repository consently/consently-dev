# DigiLocker Setup - Configuration Complete

## ✅ Fixed Configuration

Updated `.env.local` with correct API Setu credentials from dashboard.

### Correct Values (from API Setu Dashboard)

```bash
# Client ID from dashboard table
APISETU_CLIENT_ID=NQ6399EE1C

# Client Secret (from dashboard)
APISETU_CLIENT_SECRET=b7984c3d165cd3c82249

# Callback URL (registered in dashboard)
APISETU_REDIRECT_URI=https://consently.in/api/auth/meripehchaan/callback

# MeriPehchaan OAuth Base URL (NOT api.digitallocker.gov.in!)
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1

# API Base URL (same as OAuth URL)
APISETU_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1

# Scope for age verification + guardian consent
DIGILOCKER_AGE_VERIFICATION_SCOPE=avs avs_parent

# Disable mock mode for production testing
APISETU_USE_MOCK=false
```

## Key Changes

1. **Client ID**: Changed from `consently.in` → `NQ6399EE1C`
2. **OAuth Domain**: Changed from `api.digitallocker.gov.in` → `digilocker.meripehchaan.gov.in`
3. **Scope**: Changed from `openid` → `avs avs_parent`

## What Was Wrong

### ❌ Before (Incorrect)
```
APISETU_CLIENT_ID=consently.in  # Wrong - this is your domain
DIGILOCKER_OAUTH_BASE_URL=https://api.digitallocker.gov.in/public/oauth2/1  # Wrong domain
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid  # Wrong scope for age verification
```

### ✅ After (Correct)
```
APISETU_CLIENT_ID=NQ6399EE1C  # Correct - from API Setu dashboard
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1  # Correct domain
DIGILOCKER_AGE_VERIFICATION_SCOPE=avs avs_parent  # Correct scope
```

## Understanding the URLs

### MeriPehchaan vs DigiLocker

API Setu uses **MeriPehchaan** (India's National Single Sign-On) which integrates with DigiLocker:

- **OAuth/Authorization**: `digilocker.meripehchaan.gov.in` (MeriPehchaan gateway)
- **Not**: `api.digitallocker.gov.in` (direct DigiLocker - different system)

### Scopes

- `avs` = Age Verification Service (provides age/DOB)
- `avs_parent` = Parent/Guardian consent for minors
- Combined: `avs avs_parent` (both age verification AND guardian consent support)

## Testing

### Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

### Test Age Verification Flow

1. Visit a page with age verification widget
2. Click "Verify with DigiLocker"
3. Should redirect to: `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?client_id=NQ6399EE1C...`
4. Complete MeriPehchaan login
5. Callback to: `https://consently.in/api/auth/meripehchaan/callback`

### Expected OAuth URL

```
https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?
  response_type=code
  &client_id=NQ6399EE1C
  &redirect_uri=https://consently.in/api/auth/meripehchaan/callback
  &state={random_state_token}
  &scope=avs avs_parent
  &code_challenge={pkce_challenge}
  &code_challenge_method=S256
```

## Troubleshooting

### Still getting "invalid_client_id"
- Check that `APISETU_CLIENT_ID=NQ6399EE1C` exactly
- Restart dev server after changing .env.local

### "redirect_uri_mismatch"
- Verify callback URL in API Setu dashboard matches exactly
- Currently registered: `https://consently.in/api/auth/meripehchaan/callback`

### "invalid_scope"
- Your dashboard shows `avs` and `avs_parent` are enabled
- Should work with: `DIGILOCKER_AGE_VERIFICATION_SCOPE=avs avs_parent`

## API Setu Dashboard Info

- **Portal**: https://consume.apisetu.gov.in/consumer/authpartners
- **Issuer ID**: `in.consently` (shown at bottom left)
- **App Name**: "Consently Age Verification and Guardian Consent | PROD"
- **Registered Domain**: https://consently.in
- **Callback**: https://consently.in/api/auth/meripehchaan/callback

## Next Steps

1. ✅ Configuration updated
2. ✅ Error pages created
3. 🔄 Restart dev server
4. 🧪 Test age verification flow
5. 📊 Monitor for any OAuth errors

## Production Deployment

When deploying to production (Vercel):

1. Add all environment variables to Vercel dashboard
2. Make sure `NEXT_PUBLIC_SITE_URL=https://consently.in`
3. Keep `APISETU_USE_MOCK=false`
4. Test thoroughly before going live

## Development Testing

If you want to test without hitting DigiLocker:

```bash
APISETU_USE_MOCK=true
```

Mock codes:
- `mock_adult_code` - Age 30 (adult)
- `mock_minor_code` - Age 15 (minor, needs guardian consent)
- `mock_edge_18_code` - Exactly 18 years old
- `mock_edge_17_code` - 17 years 364 days (still minor)
