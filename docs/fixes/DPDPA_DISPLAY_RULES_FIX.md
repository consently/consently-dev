# DPDPA Display Rules Fix - Page-Specific Purpose Filtering

**Date:** 2025-01-20  
**Issue:** Careers page was showing both "Contact Form Submissions" and "Careers" purposes  
**Status:** ✅ Fixed

## Problem

On the `/careers` page (https://www.consently.in/careers), the DPDPA privacy notice widget was displaying:

1. ✅ **Careers** - Career Application Processing (correct)
2. ❌ **Contact Form Submissions** - Customer Support (incorrect - should only show on contact page)

Similarly, the `/contact` page would show both purposes instead of just the Contact purpose.

## Root Cause

The DPDPA widget configuration did not have proper display rules configured to filter which purposes are shown on specific pages. The widget was displaying all configured activities and purposes on every page, regardless of context.

## Solution

Implemented page-specific display rules using the widget's `display_rules` configuration with `activity_purposes` filtering.

### Display Rules Configured

#### 1. Careers Page Rule

```javascript
{
  rule_name: "Careers Page - Show Only Careers Purpose",
  url_pattern: "/careers",
  url_match_type: "exact",
  trigger_type: "onPageLoad",
  activities: ["2c3a8693-e06f-4733-8f70-eed6cf65f63f"], // Careers activity
  activity_purposes: {
    "2c3a8693-e06f-4733-8f70-eed6cf65f63f": [
      "486b79af-0e3a-4293-b13e-96f78062e29f" // Career Application Processing purpose
    ]
  },
  priority: 100,
  is_active: true
}
```

**Result:** The `/careers` page now shows ONLY the "Careers - Career Application Processing" purpose.

#### 2. Contact Page Rule

```javascript
{
  rule_name: "Contact Page - Show Only Contact Purpose",
  url_pattern: "/contact",
  url_match_type: "exact",
  trigger_type: "onPageLoad",
  activities: ["9be1112d-e051-4de6-95b9-bbb67d0bb46a"], // Contact Form activity
  activity_purposes: {
    "9be1112d-e051-4de6-95b9-bbb67d0bb46a": [
      "db23908d-1868-472d-8ec7-4ee14bcc6dea" // Customer Support purpose
    ]
  },
  priority: 100,
  is_active: true
}
```

**Result:** The `/contact` page now shows ONLY the "Contact Form Submissions - Customer Support" purpose.

## Technical Details

### How Display Rules Work

1. **Widget Loading:** The DPDPA widget loads its configuration from `/api/dpdpa/widget-public/[widgetId]`
2. **Rule Evaluation:** The widget evaluates display rules based on the current URL
3. **URL Matching:** Rules are matched using the `url_match_type`:
   - `exact`: Exact URL match
   - `contains`: URL contains the pattern
   - `startsWith`: URL starts with the pattern
   - `regex`: Regular expression match

4. **Activity Filtering:** When a rule matches, the `activities` array filters which processing activities are shown
5. **Purpose Filtering:** The `activity_purposes` object provides fine-grained filtering of which purposes are shown for each activity
6. **Priority:** Rules with higher priority values are evaluated first

### Key Implementation Details

- The widget uses `purposeId` (the actual UUID from the `purposes` table) for matching, not the `id` field (which is the join table ID from `activity_purposes`)
- Display rules are validated on the server side before being sent to the widget
- Rules with `is_active: false` are filtered out automatically
- The widget caches configurations with ETags for performance

## Files Modified

- Widget configuration in `dpdpa_widget_configs` table (widget ID: `dpdpa_mhnhpimc_atq70ak`)
  - Updated `display_rules` field with page-specific filtering rules

## Testing

To verify the fix:

1. Visit https://www.consently.in/careers
   - Should show ONLY "Careers - Career Application Processing" purpose
   - Should NOT show "Contact Form Submissions" purpose

2. Visit https://www.consently.in/contact
   - Should show ONLY "Contact Form Submissions - Customer Support" purpose
   - Should NOT show "Careers" purpose

3. Visit other pages (e.g., homepage, about)
   - May show both purposes or use default widget behavior (if no rules match)

## Future Considerations

### Adding More Display Rules

To add display rules for other pages:

1. Identify the activity and purpose UUIDs
2. Create a display rule object with:
   - `url_pattern`: The URL to match
   - `activities`: Array of activity IDs to show
   - `activity_purposes`: Object mapping activity IDs to arrays of purpose IDs
   - `priority`: Higher priority = evaluated first

3. Update the widget configuration via the dashboard or API

### Example: Blog Post Page

```javascript
{
  rule_name: "Blog - Show Analytics Purpose",
  url_pattern: "/blog",
  url_match_type: "startsWith", // Matches /blog, /blog/post-1, etc.
  trigger_type: "onPageLoad",
  activities: ["analytics-activity-id"],
  activity_purposes: {
    "analytics-activity-id": ["analytics-purpose-id"]
  },
  priority: 90,
  is_active: true
}
```

## Related Documentation

- [DPDPA Widget Configuration](../features/DPDPA_WIDGET.md)
- [Display Rules Architecture](../architecture/DPDPA_DISPLAY_RULES.md)
- [Widget Public API](../../app/api/dpdpa/widget-public/[widgetId]/route.ts)

## Verification Commands

```bash
# Check display rules
node --import tsx scripts/check-display-rules.ts

# Test widget configuration
curl https://www.consently.in/api/dpdpa/widget-public/dpdpa_mhnhpimc_atq70ak
```

## Compliance Notes

This fix ensures DPDPA 2023 compliance by:

1. **Minimizing Data Collection Context:** Only showing purposes relevant to the current page
2. **Clear Communication:** Users see only the purposes that apply to their current interaction
3. **Granular Consent:** Users can provide consent specific to their current activity
4. **Transparency:** Each page clearly states what data will be collected and why

---

**Implemented by:** AI Assistant  
**Verified:** ✅ Yes  
**Production Impact:** Immediate - widget configuration updates are cached for 60 seconds

