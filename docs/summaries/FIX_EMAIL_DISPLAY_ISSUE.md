# Fix: Email Display Issue in DPDPA Records Dashboard

## Problem
Emails are not showing in the DPDPA records dashboard at `https://www.consently.in/dashboard/dpdpa/records` even when clicking the "Show Emails" button.

## Root Cause
The `visitor_email` and `visitor_email_hash` columns may not exist in the production database, or the migrations that add these columns haven't been applied yet.

## Solution

### Step 1: Check if Columns Exist

Run this query in your **Supabase SQL Editor** to check if the columns exist:

```sql
-- Check if email columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('dpdpa_consent_records', 'visitor_consent_preferences')
    AND column_name IN ('visitor_email', 'visitor_email_hash')
ORDER BY 
    table_name, column_name;
```

**Expected Result:** You should see 4 rows:
- `dpdpa_consent_records.visitor_email`
- `dpdpa_consent_records.visitor_email_hash`
- `visitor_consent_preferences.visitor_email`
- `visitor_consent_preferences.visitor_email_hash`

### Step 2: Apply Migration (If Columns Don't Exist)

If the columns don't exist, run the migration script `apply_email_columns_migration.sql`:

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `apply_email_columns_migration.sql`
5. Click **Run**

Alternatively, copy and run this SQL directly:

```sql
-- Add visitor_email_hash to dpdpa_consent_records
ALTER TABLE public.dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64);

-- Add visitor_email to dpdpa_consent_records
ALTER TABLE public.dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email TEXT;

-- Add visitor_email_hash to visitor_consent_preferences
ALTER TABLE public.visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64);

-- Add visitor_email to visitor_consent_preferences
ALTER TABLE public.visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_email_hash 
ON public.dpdpa_consent_records(visitor_email_hash) 
WHERE visitor_email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_preferences_email_hash 
ON public.visitor_consent_preferences(visitor_email_hash) 
WHERE visitor_email_hash IS NOT NULL;
```

### Step 3: Verify Migration Success

Run this query to verify the columns were added:

```sql
SELECT 
    COUNT(*) as total_records,
    COUNT(visitor_email) as records_with_email,
    COUNT(visitor_email_hash) as records_with_email_hash,
    ROUND(100.0 * COUNT(visitor_email) / NULLIF(COUNT(*), 0), 2) as email_percentage
FROM 
    public.dpdpa_consent_records;
```

### Step 4: Check Recent Records

If columns exist but no emails are showing, check if recent records have email data:

```sql
SELECT 
    id,
    consent_given_at,
    visitor_email,
    visitor_email_hash,
    consent_status,
    device_type
FROM 
    public.dpdpa_consent_records
WHERE 
    consent_given_at > NOW() - INTERVAL '7 days'
ORDER BY 
    consent_given_at DESC
LIMIT 20;
```

## Expected Behavior After Fix

1. **Columns Exist**: `visitor_email` and `visitor_email_hash` columns are present in both tables
2. **Data is Captured**: New consent records will include visitor emails when users verify their email via the widget
3. **UI Shows Emails**: When clicking "Show Emails" button in the dashboard, verified emails will be displayed

## Important Notes

### Email Capture Flow
The DPDPA widget captures emails through an **optional email verification modal** that appears:
1. After user gives consent (if they haven't already verified)
2. When user clicks "Link Email to Sync Preferences" in the manage preferences modal

### Privacy & Security
- Emails are **only** shown when admin explicitly clicks "Show Emails" button
- Emails are **not** included in CSV exports by default
- Both plaintext email and SHA-256 hash are stored:
  - `visitor_email`: For admin dashboard identification
  - `visitor_email_hash`: For cross-device consent management

### Why Some Records Don't Have Emails
- **Legacy records**: Records created before the email feature was added won't have emails
- **User choice**: Email verification is optional - users can skip it
- **Session-based**: If user declined email verification, they won't be prompted again for 24 hours

## Troubleshooting

### Issue: Columns exist but emails still don't show

**Cause**: Records might not have email data yet

**Solution**: 
1. Test the widget on a page
2. Give consent
3. Verify email when prompted
4. Check the dashboard to see if the new record shows the email

### Issue: Migration fails with "permission denied"

**Cause**: Insufficient database permissions

**Solution**: 
1. Ensure you're running the migration as a database admin
2. Check Supabase dashboard → Database → Settings → Connection string
3. Contact Supabase support if you don't have admin access

### Issue: Email verification modal doesn't appear

**Cause**: 
- Widget might be cached
- Email verification was previously declined (24-hour cooldown)

**Solution**:
1. Clear browser cache and localStorage
2. Run `localStorage.clear()` in browser console
3. Reload the page

## Testing Checklist

After applying the fix, verify:

- [ ] Columns exist in database (Step 1 query returns 4 rows)
- [ ] Migration completed successfully (no errors)
- [ ] Dashboard loads without errors
- [ ] "Show Emails" button is visible and functional
- [ ] Test widget shows email verification modal after consent
- [ ] New consent record includes email in dashboard (when verified)
- [ ] Email is hidden when "Hide Emails" is clicked

## Files Modified

- ✅ Created: `apply_email_columns_migration.sql` (Quick fix SQL script)
- ✅ Created: `supabase/migrations/20251123_ensure_visitor_email_columns.sql` (Production-ready migration)
- ✅ Created: `FIX_EMAIL_DISPLAY_ISSUE.md` (This documentation)

## Related Code

### Frontend Display Logic
File: `app/dashboard/dpdpa/records/page.tsx` (lines 386-388)

```typescript
{record.visitor_email
  ? (showVerifiedEmails ? record.visitor_email : 'Verified User (Hidden)')
  : (record.visitor_email_hash ? 
      (showVerifiedEmails ? 'Verified User (Email Not Available)' : 'Verified User (Hidden)') 
      : 'Anonymous')}
```

### API Data Flow
File: `app/api/dpdpa/consent-record/route.ts`

- **GET** (line 101): Fetches all columns with `.select('*')`
- **POST** (line 424): Stores `visitorEmail` from widget request

### Widget Email Capture
File: `public/dpdpa-widget.js` (line 3747)

```javascript
visitorEmail: verifiedEmail || undefined, // Send verified email if available
```

## Need Help?

If the issue persists after following these steps:

1. Check browser console for JavaScript errors
2. Check Supabase logs for API errors
3. Verify widget integration on your website
4. Contact support with:
   - Screenshot of dashboard showing the issue
   - Result of Step 1 query (column check)
   - Result of Step 4 query (recent records check)
   - Browser console logs (F12 → Console)

---

**Last Updated**: November 23, 2025  
**Status**: Ready to Apply  
**Priority**: High - Production Issue

