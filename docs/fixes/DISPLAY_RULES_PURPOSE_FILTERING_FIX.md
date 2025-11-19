# Display Rules Purpose Filtering Fix

## Issue Description

**Problem**: Multiple purposes are appearing on a single page even though display rules are configured to show only one purpose per page.

**Example**: Contact page showing "Careers" purpose along with "Contact" purpose, when only "Contact" should appear.

## Root Cause

The issue occurs when display rules are not properly configured with purpose filtering. There are several potential causes:

### 1. No Activity Filtering
Display rules without an `activities` array will show **ALL activities** from the widget configuration.

### 2. No Purpose Filtering  
Display rules without an `activity_purposes` mapping will show **ALL purposes** from the selected activities.

### 3. Incorrect Purpose IDs
Using the wrong UUID (activity_purposes join table ID instead of actual purpose ID) in the `activity_purposes` mapping.

## Solution

### Step 1: Run Diagnostic Script

First, diagnose your current display rules configuration:

```bash
npx tsx scripts/diagnose-display-rules.ts YOUR_WIDGET_ID
```

This will show you:
- Which activities are configured for each display rule
- Which purposes are being shown (or filtered) for each activity
- Any overlapping or misconfigured rules

### Step 2: Fix Display Rules Structure

Each display rule should have:

1. **`activities`** array - Specifies which activities to show on this page
2. **`activity_purposes`** object - Maps each activity to its allowed purposes

#### Correct Structure

```json
{
  "id": "contact_rule",
  "rule_name": "Contact Page Rule",
  "url_pattern": "/contact",
  "url_match_type": "contains",
  "trigger_type": "onPageLoad",
  "priority": 100,
  "is_active": true,
  "activities": ["activity_uuid_1"],  // ✅ ONLY show this activity
  "activity_purposes": {
    "activity_uuid_1": ["purpose_uuid_1"]  // ✅ ONLY show this purpose for this activity
  },
  "notice_content": {
    "title": "Contact Form Consent",
    "message": "We need your consent to process your contact form data."
  }
}
```

#### Incorrect Structures

❌ **No activities specified**:
```json
{
  "activities": [],  // ❌ Will show ALL activities!
  // ...
}
```

❌ **No purpose filtering**:
```json
{
  "activities": ["activity_uuid_1"],
  // ❌ No activity_purposes = shows ALL purposes from activity!
}
```

❌ **Empty purpose filtering**:
```json
{
  "activities": ["activity_uuid_1"],
  "activity_purposes": {
    "activity_uuid_1": []  // ❌ Empty array = shows ALL purposes!
  }
}
```

### Step 3: Get Correct UUIDs

To configure display rules correctly, you need the actual UUIDs from your database:

```sql
-- Get activity IDs and names
SELECT id, activity_name, industry
FROM processing_activities
WHERE user_id = 'your_user_id'
ORDER BY activity_name;

-- Get purpose IDs for a specific activity
SELECT 
  ap.id as activity_purpose_id,  -- ❌ Don't use this
  ap.purpose_id,                  -- ✅ Use this!
  p.purpose_name,
  p.name,
  ap.legal_basis
FROM activity_purposes ap
JOIN purposes p ON p.id = ap.purpose_id
WHERE ap.activity_id = 'your_activity_id';
```

**CRITICAL**: Use `ap.purpose_id` (the actual purpose UUID), NOT `ap.id` (the join table ID).

### Step 4: Update Display Rules via API

```typescript
PUT /api/dpdpa/widget-config

{
  "widgetId": "your_widget_id",
  "displayRules": [
    {
      "id": "contact_rule",
      "rule_name": "Contact Page",
      "url_pattern": "/contact",
      "url_match_type": "contains",
      "trigger_type": "onPageLoad",
      "priority": 100,
      "is_active": true,
      "activities": ["activity_uuid_for_contact"],
      "activity_purposes": {
        "activity_uuid_for_contact": ["purpose_uuid_for_contact_purpose"]
      },
      "notice_content": {
        "title": "Contact Form Consent",
        "message": "Please provide consent to process your contact form."
      }
    },
    {
      "id": "careers_rule",
      "rule_name": "Careers Page",
      "url_pattern": "/careers",
      "url_match_type": "contains",
      "trigger_type": "onPageLoad",
      "priority": 100,
      "is_active": true,
      "activities": ["activity_uuid_for_careers"],
      "activity_purposes": {
        "activity_uuid_for_careers": ["purpose_uuid_for_careers_purpose"]
      },
      "notice_content": {
        "title": "Job Application Consent",
        "message": "Please provide consent to process your job application."
      }
    }
  ]
}
```

## Verification

### 1. Check Browser Console

After updating rules, visit your pages and check the browser console:

```
[Consently DPDPA] Evaluating display rules for path: /contact
[Consently DPDPA] Rule matched: Contact Page
[Consently DPDPA] Filtering activities for rule: Contact Page
[Consently DPDPA] Filtered activities count: 1
[Consently DPDPA] Filtering purposes for rule: Contact Page
[Consently DPDPA] Filtered purposes for activity: activity_uuid from 2 to 1
```

### 2. Expected Behavior

✅ **Correct**: 
- Contact page shows ONLY contact-related purpose
- Careers page shows ONLY careers-related purpose
- Each page shows exactly 1 activity with 1 purpose

❌ **Incorrect**:
- Contact page shows both contact AND careers purposes
- Multiple activities visible on a single page
- Purposes not being filtered

## Widget Code Fix

The widget code has been updated to:

1. **Better debug logging** - Shows which purposes are being filtered and why
2. **Correct purpose ID usage** - Uses `purpose.purposeId` (not `purpose.id`)
3. **Clear warnings** - Alerts when filtering fails or results in no purposes

See `public/dpdpa-widget.js` lines 1103-1145 for the updated filtering logic.

## Common Mistakes

### Mistake 1: Using activity_purposes join table ID

```json
// ❌ WRONG
"activity_purposes": {
  "activity_uuid": ["join_table_uuid"]  // This is ap.id, not ap.purpose_id!
}

// ✅ CORRECT
"activity_purposes": {
  "activity_uuid": ["actual_purpose_uuid"]  // This is ap.purpose_id
}
```

### Mistake 2: Not specifying activities

```json
// ❌ WRONG - Shows all activities
{
  "rule_name": "Contact Page",
  "url_pattern": "/contact"
  // Missing: activities array
}

// ✅ CORRECT - Shows only specified activities
{
  "rule_name": "Contact Page",
  "url_pattern": "/contact",
  "activities": ["contact_activity_uuid"]
}
```

### Mistake 3: Empty purpose filtering

```json
// ❌ WRONG - Shows all purposes
{
  "activities": ["activity_uuid"],
  "activity_purposes": {}  // Empty object
}

// ✅ CORRECT - Shows only specified purposes
{
  "activities": ["activity_uuid"],
  "activity_purposes": {
    "activity_uuid": ["purpose_uuid"]
  }
}
```

## Best Practices

1. **One Activity Per Page** - For page-specific consent, typically one activity per page is clearest
2. **One Purpose Per Activity** - Most pages have one primary purpose (contact, careers, newsletter, etc.)
3. **Use Descriptive Names** - Make rule names clear: "Contact Page Rule", "Careers Application Rule"
4. **Test in Stages** - Configure one rule at a time and verify it works before adding more
5. **Check Console Logs** - The widget logs detailed debugging information about rule matching and filtering

## Testing Checklist

- [ ] Run diagnostic script on your widget
- [ ] Verify activities array is specified for each rule
- [ ] Verify activity_purposes mapping is correct
- [ ] Check purpose UUIDs are from `purposes` table, not `activity_purposes` join table
- [ ] Test each page individually (contact, careers, etc.)
- [ ] Verify browser console shows correct filtering
- [ ] Confirm only one activity/purpose shows per page

## Related Files

- `public/dpdpa-widget.js` - Widget code with filtering logic
- `scripts/diagnose-display-rules.ts` - Diagnostic script
- `app/api/dpdpa/widget-config/route.ts` - API for updating rules
- `app/dashboard/dpdpa/widget/page.tsx` - Dashboard UI for managing rules

## Support

If you're still experiencing issues after following this guide:

1. Run the diagnostic script and share the output
2. Check the browser console for error messages
3. Verify your database structure matches the expected schema
4. Ensure you're using actual purpose UUIDs, not join table IDs

