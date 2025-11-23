# Email Display Issue - Summary

## Problem Statement
Emails are not showing in the DPDPA records dashboard at `https://www.consently.in/dashboard/dpdpa/records` when clicking the "Show Emails" button.

## Investigation Results

### ✅ Code is Correct
1. **Widget captures emails** (`public/dpdpa-widget.js` line 3747)
   - Email verification modal appears after consent
   - Sends `visitorEmail` with consent record

2. **API handles emails** (`app/api/dpdpa/consent-record/route.ts`)
   - POST endpoint stores `visitor_email` and `visitor_email_hash`
   - GET endpoint returns all fields including emails

3. **UI displays emails** (`app/dashboard/dpdpa/records/page.tsx` line 386-388)
   - Shows/hides emails based on `showVerifiedEmails` state
   - "Show Emails" button toggles visibility

### ❌ Database Columns May Be Missing
The `visitor_email` and `visitor_email_hash` columns might not exist in the **production** database. While migrations exist in the codebase, they may not have been applied to production.

## Quick Fix (5 minutes)

### Step 1: Run Diagnostic
```bash
# In Supabase SQL Editor, run:
check_email_columns.sql
```

This will tell you:
- ✅ If columns exist
- 📊 How many records have emails
- 💡 What action to take

### Step 2: Apply Migration (if needed)
```bash
# In Supabase SQL Editor, run:
apply_email_columns_migration.sql
```

This adds:
- `visitor_email` column (stores plain email)
- `visitor_email_hash` column (stores SHA-256 hash)
- Performance indexes

### Step 3: Verify
1. Reload the dashboard
2. Click "Show Emails" button
3. Emails should now be visible for verified users

## Files Created

| File | Purpose |
|------|---------|
| `check_email_columns.sql` | Diagnostic script - run this first |
| `apply_email_columns_migration.sql` | Quick fix - applies missing columns |
| `supabase/migrations/20251123_ensure_visitor_email_columns.sql` | Production migration |
| `FIX_EMAIL_DISPLAY_ISSUE.md` | Complete documentation |
| `EMAIL_ISSUE_SUMMARY.md` | This summary |

## Expected Behavior After Fix

### Before Fix
```
User / ID
├── Anonymous          (no email)
├── Anonymous          (no email)
└── Anonymous          (no email)
```

### After Fix (when "Show Emails" is clicked)
```
User / ID
├── user@example.com   (verified user)
├── Verified User      (email collected but not stored)
└── Anonymous          (no email - user skipped verification)
```

## Why Some Records Don't Have Emails

Even after the fix, some records won't have emails because:

1. **Legacy records** - Created before email feature existed
2. **User choice** - Email verification is optional (users can skip)
3. **Cooldown** - If user declined once, they won't be prompted again for 24h
4. **Session-based** - Email verification happens after consent

## Testing the Fix

1. **Apply migration** using the SQL scripts
2. **Clear browser cache** and localStorage
3. **Visit a page** with the DPDPA widget
4. **Give consent** and complete email verification
5. **Check dashboard** - email should appear when "Show Emails" is clicked

## Troubleshooting

### Issue: Dashboard shows "Loading..." forever
- **Check**: Browser console for API errors
- **Fix**: Check Supabase logs, verify API endpoint is accessible

### Issue: "Show Emails" button exists but no emails show
- **Check**: Run `check_email_columns.sql` to verify columns exist
- **Fix**: If columns exist but no data, test widget email verification

### Issue: Email verification modal doesn't appear
- **Check**: localStorage for `consently_email_verification_declined`
- **Fix**: Clear localStorage or wait 24 hours

## Next Steps

1. ✅ Run `check_email_columns.sql` to diagnose
2. ✅ Run `apply_email_columns_migration.sql` if columns missing
3. ✅ Test widget email verification flow
4. ✅ Verify emails appear in dashboard

## Need Help?

Run the diagnostic script and share the output:
```sql
-- Copy results of this query:
SELECT * FROM check_email_columns.sql
```

---

**Status**: Ready to Deploy  
**Impact**: High - Affects production dashboard  
**Time to Fix**: ~5 minutes  
**Risk**: Low - Adds columns only, doesn't modify existing data

