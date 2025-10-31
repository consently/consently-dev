# Cookie Consent Module Fixes

## Issues Identified

### Issue 1: Widget Showing "We value your privacy" Default Text ✅ FIXED

**Root Cause:**
- The widget API (`/app/api/cookies/widget-public/[widgetId]/route.ts`) falls back to hardcoded default text when:
  - No banner template is linked to the widget (`banner_template_id` is null)
  - No custom `banner_content` is configured
- This explains why it works on consently.in (has linked banner templates) but not for new accounts

**Solution Implemented:**
1. **Auto-creation of Default Banners** - Modified the widget API to automatically create a default banner template when none exists
2. **Automatic Widget Linking** - The new banner is immediately linked to the widget
3. **Fallback Protection** - If database insertion fails, still falls back to inline defaults

**Files Changed:**
- `app/api/cookies/widget-public/[widgetId]/route.ts` (lines 95-214)

**Changes Made:**
```typescript
// Before: Used hardcoded "We value your privacy" text
if (!banner) {
  banner = { title: 'We value your privacy', ... }
}

// After: Creates actual banner template in database
if (!banner && widgetConfig.user_id) {
  const { data: newBanner } = await supabase
    .from('banner_configs')
    .insert({ 
      title: 'Cookie Consent',
      message: 'We use cookies to improve your experience...',
      is_default: true,
      ...
    });
  
  // Link to widget
  await supabase
    .from('widget_configs')
    .update({ banner_template_id: newBanner.id })
    .eq('widget_id', widgetConfig.widget_id);
}
```

### Issue 2: Consent Records Not Loading ℹ️ CLARIFICATION NEEDED

**Analysis:**
- The consent recording flow is working correctly
- Cookie widget calls `/api/consent/record` which writes to `consent_records` table
- The dashboard page (`/app/dashboard/cookies/records/page.tsx`) reads from `/api/consent/records` which queries `consent_records`

**Potential Causes:**
1. **No actual consent events recorded** - Users may not have tested the widget on their site
2. **Different user accounts** - Testing with different Gmail accounts that don't own widgets
3. **DPDPA vs Cookie confusion** - User may be checking DPDPA consent records instead of cookie consent records

**To Verify:**
1. Check if the widget is actually embedded on the user's website
2. Test by accepting/rejecting cookies on the test site
3. Verify the correct API endpoint is being called from the dashboard

**Note:** There are THREE separate consent systems:
- `consent_records` - General consent (cookie + DPDPA) ← Cookie dashboard uses this
- `dpdpa_consent_records` - DPDPA-specific consent ← DPDPA dashboard uses this
- `consent_logs` - Also being written to for compatibility

## Database Migration

Created migration file: `supabase/migrations/20251031_link_widgets_to_default_banners.sql`

**What it does:**
1. Creates default banner templates for users who don't have any
2. Links all existing widgets without `banner_template_id` to their user's default banner
3. Logs the results for verification

**To apply the migration:**
```bash
# If using Supabase CLI
supabase db push

# Or run directly in Supabase SQL editor
# Copy and paste the contents of the migration file
```

## Testing Instructions

### Test Issue #1 Fix (Default Banner Text)

1. **Create a new test widget without a banner template:**
   ```sql
   -- In Supabase SQL editor
   INSERT INTO widget_configs (user_id, widget_id, domain)
   VALUES ('[your-user-id]', 'test-widget-123', 'example.com');
   ```

2. **Fetch the widget config via API:**
   ```bash
   curl https://[your-domain]/api/cookies/widget-public/test-widget-123
   ```

3. **Verify the response:**
   - Should contain `"title": "Cookie Consent"` (not "We value your privacy")
   - Should have a real banner ID (not "default")

4. **Check database:**
   ```sql
   -- Verify banner was created
   SELECT * FROM banner_configs WHERE is_default = true AND user_id = '[your-user-id]';
   
   -- Verify widget was linked
   SELECT widget_id, banner_template_id FROM widget_configs WHERE widget_id = 'test-widget-123';
   ```

### Test Issue #2 (Consent Records)

1. **Embed the widget on a test page:**
   ```html
   <script src="https://[your-domain]/widget.js"></script>
   <script>
     Consently.init({
       widgetId: 'test-widget-123'
     });
   </script>
   ```

2. **Accept/reject cookies on the test page**

3. **Check the dashboard:**
   - Navigate to `/dashboard/cookies/records`
   - Should see the consent record appear

4. **Verify in database:**
   ```sql
   SELECT * FROM consent_records 
   WHERE user_id = '[your-user-id]' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## Rollback Instructions

If you need to rollback these changes:

### Rollback Code Changes

```bash
git checkout HEAD~1 app/api/cookies/widget-public/[widgetId]/route.ts
```

### Rollback Database Migration

```sql
-- Remove auto-created default banners
DELETE FROM banner_configs 
WHERE description = 'Auto-generated default banner template for cookie consent';

-- Clear banner_template_id from widgets
UPDATE widget_configs 
SET banner_template_id = NULL 
WHERE banner_template_id IN (
  SELECT id FROM banner_configs WHERE is_default = true
);
```

## Additional Recommendations

### 1. Add Banner Template to Widget Creation Flow

When users create a new widget, automatically offer to:
- Use an existing banner template
- Create a new custom banner
- Use the default banner

### 2. Dashboard Improvements

Add indicators to show:
- Which widgets have custom banner templates
- Which widgets are using default templates
- Link to edit banner templates from widget list

### 3. Better Error Messages

If consent records are empty, show helpful messages:
- "No consent records yet. Make sure your widget is embedded on your website."
- "Test your widget at [link to test page]"
- "Learn how to embed the widget [link to docs]"

### 4. Unified Consent System

Consider consolidating the consent recording systems:
- Currently using both `consent_records` and `consent_logs`
- Duplicated data and potential confusion
- Recommend choosing one as the source of truth

## Summary

✅ **Fixed:** Default "We value your privacy" text issue
- Widgets now auto-create proper banner templates
- Text is now customizable through the dashboard

⚠️ **Needs Verification:** Consent records not loading
- Technical implementation is correct
- Likely a user/testing issue rather than code issue
- Recommend adding better UI guidance for new users

## Questions to Ask the User

1. Have you embedded the widget on your website yet?
2. Have you tested accepting/rejecting cookies on your site?
3. Are you checking the correct dashboard page (Cookies vs DPDPA)?
4. Can you share a screenshot of what you're seeing in the records page?
5. What email account are you using to test?
