# Issue Diagnostic Guide

## Problem Summary
1. **Cookie widget showing default text** instead of customized content for non-consently.in accounts
2. **Consent records page not fetching data** properly

## Root Causes Identified

### Issue 1: Widget Configuration
**Location**: `/app/api/cookies/widget-public/[widgetId]/route.ts`

The widget API returns default configuration when:
- No banner template is linked to the widget (`banner_template_id` is null)
- The widget doesn't have custom `banner_content` configured
- Falls back to hardcoded defaults (lines 96-145)

**Default fallback values**:
```javascript
title: 'We value your privacy',
message: 'We use cookies to enhance your browsing experience and analyze our traffic.'
```

### Issue 2: Consent Records Not Loading
**Location**: `/app/api/dpdpa/consent-record/route.ts` (GET endpoint)

The API filters records by:
1. Fetching widgets owned by the authenticated user (lines 117-122)
2. Filtering consent records by those widget IDs (lines 123-132)
3. Returns empty array if no widgets found

## Debugging Steps

### Step 1: Check Widget Configuration
```sql
-- Check if widget exists for the user
SELECT 
  w.widget_id,
  w.user_id,
  w.domain,
  w.banner_template_id,
  w.banner_content,
  w.supported_languages,
  u.email
FROM widget_configs w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'target_gmail_account@gmail.com';
```

### Step 2: Check Banner Template
```sql
-- Check if banner template exists
SELECT 
  b.id,
  b.name,
  b.title,
  b.message,
  b.is_active,
  b.is_default
FROM banner_configs b
WHERE b.user_id = (SELECT id FROM auth.users WHERE email = 'target_gmail_account@gmail.com');
```

### Step 3: Check DPDPA Widget Configuration
```sql
-- Check DPDPA widgets
SELECT 
  widget_id,
  user_id,
  is_active
FROM dpdpa_widget_configs
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_gmail_account@gmail.com');
```

### Step 4: Check Consent Records
```sql
-- Check if consent records exist
SELECT 
  id,
  widget_id,
  visitor_email,
  consent_status,
  consent_timestamp
FROM dpdpa_consent_records
WHERE widget_id IN (
  SELECT widget_id 
  FROM dpdpa_widget_configs 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_gmail_account@gmail.com')
)
ORDER BY consent_timestamp DESC
LIMIT 10;
```

## Solutions

### Fix 1: Ensure Widget Has Banner Configuration

**Option A**: Link a banner template to the widget
```sql
-- Create or update banner template
INSERT INTO banner_configs (
  user_id,
  name,
  title,
  message,
  layout,
  position,
  is_active,
  is_default
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com'),
  'Default Banner',
  'Custom Title Here',
  'Custom message about cookies and privacy',
  'bar',
  'bottom',
  true,
  true
);

-- Link banner to widget
UPDATE widget_configs
SET banner_template_id = (
  SELECT id FROM banner_configs 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com')
  AND is_default = true
  LIMIT 1
)
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com');
```

**Option B**: Add custom banner_content to widget config
```sql
UPDATE widget_configs
SET banner_content = jsonb_build_object(
  'title', 'Your Custom Title',
  'message', 'Your custom cookie consent message',
  'acceptButtonText', 'Accept All',
  'rejectButtonText', 'Reject All',
  'settingsButtonText', 'Cookie Settings'
)
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com');
```

### Fix 2: Ensure DPDPA Widget Exists

```sql
-- Check if DPDPA widget exists for the user
SELECT COUNT(*) 
FROM dpdpa_widget_configs 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com');

-- If no widget exists, create one
INSERT INTO dpdpa_widget_configs (
  widget_id,
  user_id,
  is_active,
  consent_duration
) VALUES (
  'dpdpa_' || gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'target_email@gmail.com'),
  true,
  365
);
```

### Fix 3: Verify Consent Records Are Being Created

Check the browser console when consent is given:
1. Look for `[Consently] Consent recorded` log
2. Check Network tab for POST to `/api/dpdpa/consent-record`
3. Verify the response shows `success: true`

## Quick Test Commands

### Test widget API directly
```bash
# Get widget configuration
curl "https://consently.in/api/cookies/widget-public/YOUR_WIDGET_ID"

# Check response has proper title and message
```

### Test consent records API
```bash
# Login and get session cookie first, then:
curl "https://consently.in/api/dpdpa/consent-record?limit=100&page=1" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Next Steps

1. **Identify the user's email** having the issue
2. **Run diagnostic SQL queries** to check widget and banner config
3. **Update configuration** using one of the fix options
4. **Clear browser cache** and test the widget again
5. **Check consent recording** by giving consent and verifying in database

## Files to Check

- Widget API: `/app/api/cookies/widget-public/[widgetId]/route.ts`
- Consent Record API: `/app/api/dpdpa/consent-record/route.ts`
- Widget JS: `/public/widget.js`
- DPDPA Widget JS: `/public/dpdpa-widget.js`
- Records Page: `/app/dashboard/dpdpa/records/page.tsx`
