# Backfill Verified Emails - Guide

## Problem

Users who verified their emails before the sync logic was added have their emails stored in `visitor_consent_preferences` but not in `dpdpa_consent_records`. This means:
- ✅ Emails show in Privacy Centre (reads from preferences)
- ❌ Emails don't show in Dashboard (reads from consent records)

## Solution

### 1. API Fixes (Already Applied ✅)

**Files Updated:**
- `app/api/privacy-centre/verify-otp/route.ts` - Now syncs emails to consent records when OTP is verified
- `app/api/privacy-centre/preferences/route.ts` - Checks both tables for email
- `app/api/dpdpa/consent-record/route.ts` - Enriches records with emails from preferences

**What This Does:**
- **New verifications**: Emails are automatically synced to both tables
- **Reading emails**: APIs check both tables to find emails

### 2. Backfill Existing Data

For users who verified **before** the fix, you need to run a backfill script.

## Backfill Options

### Option 1: SQL Script (Recommended - Fastest)

**File:** `scripts/backfill-verified-emails.sql`

**How to Run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire SQL script
3. Click "Run"
4. Review the output statistics

**What It Does:**
- Updates all consent records with emails from `visitor_consent_preferences`
- Only updates records where email is missing (safe to run multiple times)
- Shows statistics before and after

**Expected Output:**
```
📊 BACKFILL STATISTICS
visitors_with_verified_emails: X
consent_records_missing_email: Y
records_to_update: Z

✅ VERIFICATION
total_consent_records: X
records_with_email: Y
email_coverage: Z%
```

### Option 2: Node.js Script (More Control)

**File:** `scripts/backfill-sync-emails-from-preferences.js`

**How to Run:**
```bash
# Make sure you have environment variables set
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Or use .env file
node scripts/backfill-sync-emails-from-preferences.js
```

**What It Does:**
- Processes records in batches (safer for large datasets)
- Shows progress updates
- Provides detailed statistics

**Expected Output:**
```
🚀 Starting email sync from visitor_consent_preferences to dpdpa_consent_records...

📊 Gathering statistics...
   Visitors with verified emails in preferences: X
   Consent records missing email: Y

🔍 Fetching verified emails from preferences...
   Found X unique visitor+widget combinations with verified emails

🔍 Finding consent records that need email updates...
   Progress: 50 records updated...
   Progress: 100 records updated...

✅ Email sync complete!
   Records updated: X
   Records skipped: Y

📊 Verification statistics:
   Total consent records: X
   Records with email: Y
   Email coverage: Z%
```

## Which Backfill to Use?

| Method | Best For | Speed | Control |
|--------|----------|-------|---------|
| **SQL Script** | Quick one-time sync | ⚡ Fastest | Basic |
| **Node.js Script** | Large datasets, detailed logging | 🐢 Slower | Advanced |

**Recommendation:** Start with the SQL script. If you have issues or need more control, use the Node.js script.

## Verification

After running the backfill, verify it worked:

### 1. Check Dashboard
- Go to Dashboard → DPDPA Records
- Click "Show Emails"
- Verified emails should now appear

### 2. Check Privacy Centre
- Visit privacy centre for a verified user
- Linked email should appear in Email Link Card

### 3. Run Diagnostic Query

```sql
-- Check email coverage
SELECT 
    COUNT(*) as total_records,
    COUNT(visitor_email) as records_with_email,
    ROUND(100.0 * COUNT(visitor_email) / NULLIF(COUNT(*), 0), 2) || '%' as email_coverage
FROM 
    dpdpa_consent_records
WHERE 
    consent_given_at > NOW() - INTERVAL '90 days';
```

## Important Notes

1. **Idempotent**: Both scripts are safe to run multiple times - they only update records where email is missing
2. **No Data Loss**: Scripts never overwrite existing emails, only fill in missing ones
3. **Performance**: SQL script is faster but processes all records at once. Node.js script processes in batches.
4. **Timing**: Run the backfill during low-traffic hours if you have a large dataset

## Troubleshooting

### Issue: Script shows 0 records to update
**Cause:** Emails are already synced or no verified emails exist
**Solution:** This is fine - nothing to do!

### Issue: Some records still missing emails
**Possible Causes:**
- User verified email but never gave consent (no consent record exists)
- Email was verified on a different widget_id
- Email verification failed/expired

**Solution:** This is expected - not all users verify emails

### Issue: SQL script times out
**Cause:** Too many records to process at once
**Solution:** Use the Node.js script instead (processes in batches)

## Next Steps

After backfill:
1. ✅ Verify emails show in dashboard
2. ✅ Verify emails show in privacy centre
3. ✅ Monitor new verifications (should auto-sync now)
4. ✅ Consider running backfill weekly/monthly if needed

---

**Last Updated:** November 23, 2025  
**Status:** Ready to Use  
**Risk Level:** Low - Only updates missing emails, never overwrites










