# OAuth Configuration Guide

## Current Issues

1. **Google OAuth Security Error**: Redirect URI mismatch between Google OAuth console and Supabase
2. **Microsoft OAuth Button**: Not implemented in code (may be browser extension or misidentification)
3. **OAuth Error Handling**: Improved error messages and handling

## Fixes Applied

### 1. Improved OAuth Error Handling
- Added better error logging
- Added user-friendly error messages
- Added proper error handling in auth callback

### 2. OAuth Redirect URL Configuration
- Uses `window.location.origin` to automatically detect correct URL
- Works for both `localhost:3000` (development) and `www.consently.in` (production)

## Required Supabase Configuration

### Step 1: Configure Site URL in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/skjfzeunsqaayqarotjo
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://www.consently.in`

### Step 2: Configure Redirect URLs in Supabase

Add these URLs to **Redirect URLs**:
- `http://localhost:3000/auth/callback`
- `https://www.consently.in/auth/callback`
- `https://consently.in/auth/callback` (if using non-www)

### Step 3: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add these **Authorized redirect URIs**:
   - `https://skjfzeunsqaayqarotjo.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local testing)
   - `https://www.consently.in/auth/callback` (for production)

### Step 4: Verify Google OAuth Client Configuration

Ensure your Google OAuth client has:
- **Application type**: Web application
- **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `https://www.consently.in`
  - `https://skjfzeunsqaayqarotjo.supabase.co`

### Step 5: Configure Google OAuth in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Enter your **Google Client ID** and **Google Client Secret**
4. Save configuration

## Testing OAuth

### Development (localhost:3000)
1. Ensure Site URL is set to `http://localhost:3000`
2. Ensure redirect URL includes `http://localhost:3000/auth/callback`
3. Test Google OAuth login

### Production (www.consently.in)
1. Ensure Site URL is set to `https://www.consently.in`
2. Ensure redirect URL includes `https://www.consently.in/auth/callback`
3. Test Google OAuth login

## Common OAuth Errors

### Error: "redirect_uri_mismatch"
**Cause**: Redirect URI in Google OAuth console doesn't match Supabase callback URL

**Fix**: 
- Add `https://skjfzeunsqaayqarotjo.supabase.co/auth/v1/callback` to Google OAuth console
- This is the Supabase callback URL that handles OAuth redirects

### Error: "access_denied"
**Cause**: User cancelled OAuth consent or denied permissions

**Fix**: 
- This is expected behavior if user cancels
- User can try again

### Error: "invalid_client"
**Cause**: Google Client ID or Secret is incorrect in Supabase

**Fix**:
- Verify Client ID and Secret in Supabase Dashboard
- Ensure they match Google Cloud Console

## Browser Console Warnings

The iframe sandbox warnings from Google's OAuth flow are **normal** and **cannot be fixed**. They are:
- Browser security warnings from Google's OAuth implementation
- Not blocking OAuth functionality
- Safe to ignore

## Microsoft OAuth

**Note**: Microsoft OAuth is **not currently implemented** in the codebase. Only Google OAuth is configured. If you see a Microsoft button, it may be:
- A browser extension
- A misidentified button
- A future feature not yet implemented

To add Microsoft OAuth:
1. Configure Azure AD application
2. Add Microsoft provider in Supabase
3. Add Microsoft OAuth button to signup/login pages

## Security Best Practices

1. **Never commit OAuth secrets to git**
2. **Use environment variables** for sensitive data
3. **Rotate OAuth credentials** regularly
4. **Monitor OAuth usage** in Google Cloud Console
5. **Use HTTPS** in production (required for OAuth)

## Troubleshooting

### OAuth not working in development
- Check that Site URL is `http://localhost:3000`
- Check that redirect URL includes `http://localhost:3000/auth/callback`
- Check browser console for errors

### OAuth not working in production
- Check that Site URL is `https://www.consently.in`
- Check that redirect URL includes `https://www.consently.in/auth/callback`
- Verify Google OAuth console has correct redirect URIs
- Check Supabase logs for errors

### OAuth redirects to wrong page
- Verify redirect URL in code matches Supabase configuration
- Check that `window.location.origin` is correct
- Verify auth callback route is accessible

