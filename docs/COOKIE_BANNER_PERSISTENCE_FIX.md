# Cookie Banner Persistence & Performance Fixes

**Date:** November 6, 2025  
**Issue:** Cookie banner reappearing after consent and showing on dashboard  
**Status:** ✅ Fixed

## Issues Identified

1. **Preview Mode Override**: The widget was showing on dashboard pages even when consent existed because preview mode was triggered by just being on `consently.in` domain
2. **Cookie Persistence**: Cookies weren't being set with proper domain scope, causing them to be lost on subdomain navigation
3. **Performance**: Config polling was running every 5 seconds regardless of whether consent existed
4. **Dashboard Interference**: Widget was loading on authenticated dashboard pages unnecessarily

## Fixes Applied

### 1. Dashboard Page Detection ✅
- Added check to skip widget initialization on `/dashboard/*` pages
- Only shows widget on dashboard if explicit preview mode is enabled via `?preview=true` or `?test-widget=true` query params
- Prevents banner from showing after login

**Location:** `public/widget.js` lines 387-398, 477-485

### 2. Improved Cookie Persistence ✅
- Added proper domain extraction for cookies (supports subdomains)
- Cookies now set with root domain (e.g., `.consently.in`) so they persist across subdomains
- Added Secure flag only for HTTPS connections
- Improved cookie validation with verification after setting

**Location:** `public/widget.js` lines 173-198, 941-972

### 3. Performance Optimizations ✅
- Reduced polling frequency:
  - Preview mode: Every 5 seconds (for testing)
  - With consent: Every 30 seconds (for config updates)
  - Without consent: Every 10 seconds (waiting for user)
- Config refresh only happens if banner is visible or in explicit preview mode
- Prevents unnecessary API calls when user has already given consent

**Location:** `public/widget.js` lines 357-374, 304-336

### 4. Consent Validation ✅
- Added validation to ensure consent data is complete before using it
- Clears invalid/expired consent automatically
- Better logging for debugging consent issues
- Verifies cookie was set correctly after saving

**Location:** `public/widget.js` lines 412-450

### 5. Preview Mode Refinement ✅
- Preview mode now requires explicit query parameter (`?preview=true`)
- Just being on `consently.in` domain is no longer enough to trigger preview
- Prevents accidental banner showing on production dashboard

**Location:** `public/widget.js` lines 392-405

## Testing Checklist

- [x] Banner doesn't show on dashboard after login
- [x] Consent persists across page refreshes
- [x] Consent persists across subdomain navigation
- [x] Banner doesn't reappear after accepting cookies
- [x] Banner shows correctly on regular website pages
- [x] Preview mode works with `?preview=true` query param
- [x] Performance improved (reduced API calls)
- [x] Cookie validation works correctly

## Performance Improvements

- **Before:** Config polling every 5 seconds (12 requests/minute)
- **After:** Config polling every 30 seconds with consent (2 requests/minute) or every 10 seconds without consent (6 requests/minute)
- **Reduction:** ~83% fewer API calls when consent exists

## Browser Compatibility

- ✅ Chrome/Edge (SameSite=Lax, Secure flag)
- ✅ Firefox (SameSite=Lax, Secure flag)
- ✅ Safari (SameSite=Lax, Secure flag)
- ✅ Mobile browsers

## Cookie Attributes

- **Path:** `/` (available site-wide)
- **Domain:** Root domain (e.g., `.consently.in`) for subdomain support
- **SameSite:** `Lax` (prevents CSRF, allows normal navigation)
- **Secure:** Only on HTTPS connections
- **Expires:** 365 days (configurable via `config.consentDuration`)

## Migration Notes

No breaking changes. Existing consent cookies will continue to work. New cookies will have improved persistence and validation.

## Next Steps

1. Test on production environment
2. Monitor consent cookie persistence in analytics
3. Consider adding cookie consent sync across domains if needed
4. Monitor performance metrics for API call reduction

