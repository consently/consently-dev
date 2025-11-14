# Consent Banner Fixes - Same Device Issue

## Problem

The consent banner was showing again on the same device when navigating between pages:
- User consents on `/contact` page
- User navigates to `/careers` page
- User returns to `/contact` page
- Banner shows again ❌ (should not show)

## Root Cause

The `checkConsentForCurrentPage()` function was too strict:
- It checked if consent covered **all activities** for the current page
- If page activities differed, it considered consent invalid
- This caused the banner to re-appear unnecessarily

## Fixes Applied

### Fix 1: Simplified `checkConsentForCurrentPage()` Logic

**Before:**
```javascript
// Check if user has consented to ALL required activities for this page
const allConsented = requiredActivityIds.every(activityId => 
  consentedActivityIds.includes(activityId)
);
```

**After:**
```javascript
// If user has consented to ANY activities, consider it valid
// This prevents the banner from showing again on different pages on the same device
if (consentedActivityIds.length > 0) {
  console.log('[Consently DPDPA] User has existing valid consent for', consentedActivityIds.length, 'activities');
  return true;
}
```

**Rationale:**
- Once a user gives consent on **any page**, respect it across **all pages**
- Don't ask for consent again on the same device
- More user-friendly experience

### Fix 2: Added Expiration Validation in localStorage Fallback

**Before:**
```javascript
if (localStorageConsent && localStorageConsent.timestamp) {
  existingConsent = localStorageConsent;
  console.log('[Consently DPDPA] Found consent in localStorage');
}
```

**After:**
```javascript
if (localStorageConsent && localStorageConsent.timestamp) {
  // Validate expiration before using localStorage consent
  if (localStorageConsent.expiresAt) {
    const expiresAt = new Date(localStorageConsent.expiresAt);
    if (expiresAt < new Date()) {
      console.log('[Consently DPDPA] localStorage consent expired, clearing...');
      ConsentStorage.delete(`consently_dpdpa_consent_${widgetId}`);
      existingConsent = null;
    } else {
      existingConsent = localStorageConsent;
      console.log('[Consently DPDPA] Found valid consent in localStorage');
    }
  } else {
    // No expiration date, check by duration
    const consentAge = (Date.now() - new Date(localStorageConsent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    const consentDuration = config.consentDuration || 365;
    if (consentAge < consentDuration) {
      existingConsent = localStorageConsent;
      console.log('[Consently DPDPA] Found valid consent in localStorage (age: ' + Math.round(consentAge) + ' days)');
    } else {
      console.log('[Consently DPDPA] localStorage consent expired by duration, clearing...');
      ConsentStorage.delete(`consently_dpdpa_consent_${widgetId}`);
      existingConsent = null;
    }
  }
}
```

**Rationale:**
- Properly validate expiration before using localStorage consent
- Clear expired consent from storage
- Prevents using stale consent data

### Fix 3: Added Expiration Check in `checkConsentForCurrentPage()`

Added validation at the start of the function:

```javascript
// Validate expiration first
if (existingConsent.expiresAt) {
  const expiresAt = new Date(existingConsent.expiresAt);
  if (expiresAt < new Date()) {
    console.log('[Consently DPDPA] Consent expired');
    return false;
  }
}
```

## Expected Behavior After Fix

### Same Device - Multiple Pages

```
1. User visits /contact
   → Banner shows
   → User accepts/rejects
   → Consent saved ✅

2. User visits /careers
   → Checks localStorage/API
   → Finds valid consent
   → Banner does NOT show ✅

3. User returns to /contact
   → Checks localStorage/API
   → Finds valid consent
   → Banner does NOT show ✅

4. User visits any other page
   → Checks localStorage/API
   → Finds valid consent
   → Banner does NOT show ✅
```

### Cross-Device with Email

```
Device 1:
1. User consents with email@example.com
   → Consent saved with principal_id ✅

Device 2 (New):
1. First visit
   → No email stored
   → Banner shows
   
2. User enters email@example.com
   → principal_id generated
   → Finds consent from Device 1 via API ✅
   → Banner does NOT show ✅

3. Next visits on Device 2
   → Email stored in localStorage
   → principal_id generated
   → API checks by principal_id
   → Finds consent ✅
   → Banner does NOT show ✅
```

## Files Modified

- `public/dpdpa-widget.js`:
  - Updated `checkConsentForCurrentPage()` - more lenient logic
  - Updated localStorage fallback - added expiration validation
  - Added expiration check in consent validation

## Testing Checklist

- [x] Consent on one page → Navigate to another → Banner should not show
- [x] Consent expires → Banner should show again
- [x] Clear localStorage → Banner should show
- [x] Cross-device with email → Banner should not show on Device 2 after email entry
- [x] Same device, no email → Banner shows once, then never again

## Deployment

Changes applied to:
- `public/dpdpa-widget.js`

Run `npm run build` to rebuild the application.

---

**Fix Date**: November 14, 2025  
**Issue**: Same device banner re-appearing  
**Status**: ✅ Fixed

