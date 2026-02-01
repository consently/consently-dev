# DigiLocker Auth Partner Setup Guide

## 🔥 Critical Configuration Requirement

Your DigiLocker OAuth flow **requires** the correct Auth Partner configuration in API Setu.

## ❌ Common Mistake (Causes `invalid_client` Error)

Do NOT use `client_credentials` grant type for DigiLocker login. This is for server-to-server APIs only.

```
Token Authentication Method: client_credentials  ❌ WRONG
```

## ✅ Correct Configuration

### Step 1: Create New Auth Partner in API Setu

1. Go to **API Setu** → **My Products** → **DigiLocker**
2. Click **"Create Auth Partner"**
3. Configure with these exact settings:

```
Partner Name: Consently Web Login
Token Authentication Method: authorization_code  ✅ CORRECT
Enable PKCE: ☑ Checked
Redirect URL: https://www.consently.in/api/auth/digilocker/callback
Scopes:
  ☑ openid
  ☑ Profile information (DOB)
```

### Step 2: Update Environment Variables

After creating the Auth Partner, update your `.env.local`:

```bash
# DigiLocker OAuth Configuration
DIGILOCKER_CLIENT_ID=your_new_client_id_from_api_setu
DIGILOCKER_CLIENT_SECRET=your_new_client_secret_from_api_setu
DIGILOCKER_REDIRECT_URI=https://www.consently.in/api/auth/digilocker/callback
DIGILOCKER_ISSUER_ID=in.consently
DIGILOCKER_ENV=production
DIGILOCKER_SCOPE=openid profile
```

### Step 3: Restart Server

```bash
npm run dev
```

## 🧪 Test the Flow

1. Go to `/age-verification`
2. Click "Verify with DigiLocker"
3. You should see the DigiLocker consent screen
4. After approval, you should be redirected back with verification success

## 🔍 Troubleshooting

### Error: `invalid_client`

**Root Cause**: Your Auth Partner uses `client_credentials` instead of `authorization_code`

**Solution**: Create a NEW Auth Partner (editing existing ones often doesn't work)

### Error: `invalid_scope`

**Root Cause**: Requested scopes are not enabled in Auth Partner

**Solution**: Enable "Profile information (DOB)" scope in API Setu

### Error: `invalid_redirect_uri`

**Root Cause**: Redirect URL mismatch

**Solution**: Ensure the redirect URL in API Setu exactly matches `DIGILOCKER_REDIRECT_URI` in your env

## 📋 API Setu Checklist

- [ ] Created NEW Auth Partner (don't edit existing)
- [ ] Token Authentication Method = `authorization_code`
- [ ] PKCE enabled
- [ ] Redirect URL = `https://www.consently.in/api/auth/digilocker/callback`
- [ ] Scopes: `openid` and `Profile information (DOB)`
- [ ] Updated `.env.local` with new credentials
- [ ] Restarted server after env changes

## 🆘 Need Help?

If you're still getting `invalid_client` errors:

1. Check your current Auth Partner configuration in API Setu
2. Look for "Token Authentication Method" - it MUST say `authorization_code`
3. If it says `client_credentials`, create a new Auth Partner
4. Do not try to edit the existing one - API Setu often doesn't apply changes correctly
