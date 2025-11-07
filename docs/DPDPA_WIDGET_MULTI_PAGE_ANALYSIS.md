# DPDPA Widget Multi-Page Integration Analysis

## User Scenario

**Question:** If a user integrates DPDPA widget code on their contact page, then creates a new activity and adds it to the same widget, and integrates the same widget code on their career page - will it work perfectly?

## Current Implementation Analysis

### ✅ **What Works Well**

1. **Activity Updates Are Fetched**
   - Widget uses cache-buster (`?_t=${Date.now()}`) to fetch fresh config
   - Widget sets `cache: 'no-store'` to prevent browser caching
   - API endpoint `/api/dpdpa/widget-public/${widgetId}` reads `selected_activities` from database
   - When you add activity D to widget config, it updates `selected_activities` array in database
   - Next page load will fetch the updated activities list

2. **Same Widget ID on Multiple Pages**
   - ✅ Works perfectly - same widget ID can be used on multiple pages
   - Each page load fetches fresh configuration from API
   - All pages using same widget ID will show the same activities

3. **Consent Sharing Across Pages**
   - Consent is stored in localStorage with key: `consently_dpdpa_consent_${widgetId}`
   - Same widget ID = same consent state across all pages
   - If user gives consent on contact page, they won't see widget again on career page (until consent expires)

### ⚠️ **Potential Issues**

#### Issue 1: Server-Side Caching (Minor)
- **Problem:** API has 60-second server-side cache (`max-age=60`)
- **Impact:** If you add activity D and immediately visit career page, you might see old activities for up to 60 seconds
- **Severity:** LOW - Only affects immediate updates
- **Workaround:** Wait 60 seconds or clear cache

#### Issue 2: New Activities After Consent (CRITICAL) ⚠️
- **Problem:** If user already gave consent for activities A, B, C on contact page, and then you add activity D to the widget:
  - User visits career page
  - Widget fetches fresh config (includes activity D)
  - Widget checks existing consent (finds consent for A, B, C)
  - Widget doesn't show because consent exists
  - **User is never asked about new activity D!**

- **Current Code Behavior:**
  ```javascript
  // From public/dpdpa-widget.js line 364-367
  if (existingConsent && existingConsent.timestamp) {
    console.log('[Consently DPDPA] Valid consent found');
    applyConsent(existingConsent);
    return; // Widget doesn't show!
  }
  ```

- **Severity:** HIGH - Compliance issue
- **Impact:** User's consent doesn't cover new activity D, but widget assumes it does

## Recommended Solutions

### Solution 1: Activity-Based Consent Validation (Recommended)

**Modify consent check to validate against current activities:**

```javascript
// In public/dpdpa-widget.js init() function
const existingConsent = ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);

if (existingConsent && existingConsent.timestamp) {
  // Check if consent covers all current activities
  const consentedActivityIds = existingConsent.acceptedActivities || [];
  const currentActivityIds = activities.map(a => a.id);
  
  // Check if there are new activities not covered by consent
  const newActivities = currentActivityIds.filter(id => !consentedActivityIds.includes(id));
  
  if (newActivities.length > 0) {
    console.log('[Consently DPDPA] New activities detected, showing widget for re-consent');
    // Show widget to get consent for new activities
    if (config.autoShow) {
      setTimeout(() => showConsentWidget(), config.showAfterDelay || 1000);
    }
    return;
  }
  
  // All activities covered, apply existing consent
  console.log('[Consently DPDPA] Valid consent found');
  applyConsent(existingConsent);
  return;
}
```

### Solution 2: Consent Version Tracking

**Track consent version and compare with widget version:**

1. Store `consentVersion` or `activityHash` in consent record
2. When activities change, update widget's `activityHash`
3. Compare hashes - if different, require re-consent

### Solution 3: Privacy Notice Version Tracking

**Use existing `privacy_notice_version` field:**

- Update `privacy_notice_version` when activities change
- Check version in consent record vs current widget version
- If versions don't match, require re-consent

## Current Code Flow

### Widget Initialization
1. Widget loads → calls `fetchWidgetConfig()`
2. Fetches from `/api/dpdpa/widget-public/${widgetId}` with cache-buster
3. API reads `selected_activities` from `dpdpa_widget_configs` table
4. API fetches all activities whose IDs are in `selected_activities`
5. Returns config + activities array

### Consent Check
1. Widget checks localStorage: `consently_dpdpa_consent_${widgetId}`
2. If consent exists and timestamp is valid → apply consent, don't show widget
3. If no consent or expired → show widget

### Adding New Activity
1. User creates activity D in dashboard
2. User edits widget config, adds activity D to `selectedActivities`
3. Saves widget config → updates `selected_activities` in database
4. Next widget load will fetch activity D

## Testing Scenarios

### Scenario 1: Fresh Integration (No Consent)
- ✅ Contact page: Widget shows activities A, B, C
- ✅ Career page: Widget shows activities A, B, C
- ✅ Add activity D, save widget
- ✅ Career page (after 60s): Widget shows activities A, B, C, D

### Scenario 2: Consent Given, Then New Activity Added
- ✅ Contact page: User gives consent for A, B, C
- ✅ Add activity D, save widget
- ❌ Career page: Widget doesn't show (consent exists)
- ❌ **User never sees activity D!** ← **ISSUE**

### Scenario 3: Different Widget IDs
- ✅ Contact page: Widget ID "dpdpa_123" with activities A, B, C
- ✅ Career page: Widget ID "dpdpa_456" with activities D, E
- ✅ Works perfectly - separate consent states

## Recommendations

1. **Immediate Fix:** Implement Solution 1 (Activity-Based Consent Validation)
2. **Long-term:** Add consent version tracking in database
3. **Documentation:** Update user docs to explain multi-page behavior
4. **Dashboard Warning:** Show alert when adding activities to widget that already has consents

## Conclusion

**Current Status:** ⚠️ **Works with limitations**

- ✅ Same widget ID works on multiple pages
- ✅ Activity updates are fetched correctly
- ⚠️ New activities added after consent are not shown to users
- ⚠️ Server-side caching may delay updates by up to 60 seconds

**Recommendation:** Implement activity-based consent validation to ensure users are always asked about new activities, even if they've given consent before.

