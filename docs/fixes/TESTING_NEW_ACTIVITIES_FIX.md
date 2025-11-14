# Testing Guide: New Activities Consent Validation Fix

## What Was Fixed

The widget now properly detects when new activities have been added to a widget configuration and prompts users for re-consent, even if they already gave consent before.

**Previously:** If a user consented to activities A, B, C, and then activity D was added, the widget would not show again - the user would never be asked about activity D.

**Now:** The widget checks if all current activities are covered by existing consent. If new activities are detected, it shows the widget again for re-consent.

## Test Scenarios

### Scenario 1: New Activity Added After Initial Consent ✅

**Setup:**
1. Create a DPDPA widget with activities A, B, C
2. Integrate widget code on a test page (e.g., contact.html)
3. Load the page and give consent (accept or reject)

**Test Steps:**
1. Go to the dashboard and add activity D to the same widget
2. Save the widget configuration
3. Wait 60 seconds (for server-side cache to expire)
4. Reload the test page or visit a different page with the same widget code

**Expected Result:**
- Widget should appear again
- Console should show: `[Consently DPDPA] New activities detected, showing widget for re-consent`
- Console should log details about new activities detected
- User can now consent to the new activity D

### Scenario 2: Multiple New Activities Added ✅

**Setup:**
1. Start with consent given for activities A, B
2. Add activities C, D, E to the widget

**Expected Result:**
- Widget appears again
- Console logs all 3 new activity IDs
- All activities (A, B, C, D, E) are shown in the widget

### Scenario 3: No New Activities - Widget Should Not Show ✅

**Setup:**
1. Give consent for activities A, B, C
2. Don't add any new activities
3. Reload the page

**Expected Result:**
- Widget does NOT appear
- Console shows: `[Consently DPDPA] Valid consent found, all activities covered`
- Existing consent is applied

### Scenario 4: Activity Removed - Should Not Trigger Re-consent ✅

**Setup:**
1. Give consent for activities A, B, C
2. Remove activity C from widget
3. Reload the page

**Expected Result:**
- Widget does NOT appear
- Existing consent for A and B is still valid
- Activity C is simply ignored (no longer relevant)

### Scenario 5: Cross-Page Behavior ✅

**Setup:**
1. User gives consent for A, B, C on contact page
2. Add activity D to widget
3. User visits career page (with same widget ID)

**Expected Result:**
- Widget appears on career page
- User is prompted to consent to all activities including new activity D

## Manual Testing Steps

### Step 1: Create Test Widget
```bash
# Access your development environment
npm run dev
```

1. Login to dashboard
2. Navigate to DPDPA Widget section
3. Create a new widget with 2-3 activities
4. Note the widget ID

### Step 2: Integrate Widget Code
Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>DPDPA Widget Test</title>
</head>
<body>
  <h1>DPDPA Widget Test Page</h1>
  <script src="http://localhost:3000/dpdpa-widget.js?widgetId=YOUR_WIDGET_ID"></script>
</body>
</html>
```

### Step 3: Test New Activity Detection
1. Open test page in browser
2. Accept consent for initial activities
3. Open browser console to see consent logged
4. In dashboard, add a new activity to the widget
5. Wait 60 seconds (or clear cache)
6. Reload the test page
7. Check console for: `New activities detected, showing widget for re-consent`
8. Verify widget appears again

### Step 4: Verify Console Logs
Look for these console messages:

**When new activities detected:**
```
[Consently DPDPA] New activities detected, showing widget for re-consent
{
  newActivityIds: ["activity_xyz"],
  previouslyConsented: 3,
  currentActivities: 4
}
```

**When all activities covered:**
```
[Consently DPDPA] Valid consent found, all activities covered
```

## Edge Cases to Test

### Edge Case 1: Activity ID Changed
If you modify an existing activity's ID (not recommended), it will be treated as a new activity.

**Result:** Widget appears for re-consent ✅

### Edge Case 2: Consent Expired
If consent has expired, the normal expiration logic takes precedence.

**Result:** Widget appears (standard behavior) ✅

### Edge Case 3: Empty Activities
If widget has no activities configured.

**Result:** Widget behavior depends on existing implementation ⚠️

### Edge Case 4: LocalStorage Cleared
If user clears browser storage.

**Result:** Widget appears (no existing consent found) ✅

## Testing with Multiple Pages

1. Create two test pages: `contact.html` and `career.html`
2. Add same widget code to both
3. Give consent on `contact.html`
4. Add new activity to widget
5. Visit `career.html`
6. Verify widget appears with new activity

## Automated Testing (Optional)

You can add unit tests to verify the logic:

```javascript
// Test: Should detect new activities
const existingConsent = {
  acceptedActivities: ['act_1', 'act_2'],
  rejectedActivities: [],
  timestamp: new Date().toISOString()
};

const currentActivities = [
  { id: 'act_1' },
  { id: 'act_2' },
  { id: 'act_3' } // New activity
];

const consentedIds = [
  ...existingConsent.acceptedActivities,
  ...existingConsent.rejectedActivities
];

const currentIds = currentActivities.map(a => a.id);
const newActivities = currentIds.filter(id => !consentedIds.includes(id));

console.assert(newActivities.length === 1, 'Should detect 1 new activity');
console.assert(newActivities[0] === 'act_3', 'Should identify act_3 as new');
```

## Rollback Plan

If issues arise, you can revert the change by replacing the modified consent check with the original:

```javascript
// Original behavior (before fix)
if (existingConsent && existingConsent.timestamp) {
  console.log('[Consently DPDPA] Valid consent found');
  applyConsent(existingConsent);
  return;
}
```

## Browser Compatibility

This fix uses standard JavaScript features:
- Array spread operator (`...`)
- Array.map()
- Array.filter()
- Array.includes()

All supported by modern browsers (Chrome, Firefox, Safari, Edge).

## Performance Impact

**Minimal:** The additional logic only runs once on page load:
- One array map operation: O(n)
- One array filter operation: O(n)
- Total complexity: O(n) where n = number of activities

For typical scenarios (5-20 activities), performance impact is negligible.

## Next Steps

After testing confirms the fix works:
1. ✅ Deploy to staging environment
2. ✅ Run regression tests
3. ✅ Monitor console logs for any errors
4. ✅ Deploy to production
5. ✅ Update user documentation

## Support

If you encounter issues during testing:
1. Check browser console for error messages
2. Verify widget ID is correct
3. Ensure activities are properly saved in database
4. Wait 60 seconds after config changes (server cache)
5. Try clearing browser localStorage for the widget
