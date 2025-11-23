-- ============================================================================
-- BACKFILL SCRIPT: Sync Verified Emails from visitor_consent_preferences to dpdpa_consent_records
-- Description: Updates existing consent records with verified emails from preferences table
--              This ensures emails show up in dashboards for users who verified before the fix
-- Date: 2025-11-23
-- ============================================================================

-- Step 1: Check how many records need updating
SELECT 
    '📊 BACKFILL STATISTICS' as check_name,
    COUNT(DISTINCT vcp.visitor_id) as visitors_with_verified_emails,
    COUNT(DISTINCT dcr.id) as consent_records_missing_email,
    COUNT(DISTINCT CASE 
        WHEN vcp.visitor_email IS NOT NULL AND dcr.visitor_email IS NULL 
        THEN dcr.id 
    END) as records_to_update
FROM 
    visitor_consent_preferences vcp
LEFT JOIN 
    dpdpa_consent_records dcr 
    ON vcp.visitor_id = dcr.visitor_id 
    AND vcp.widget_id = dcr.widget_id
WHERE 
    vcp.visitor_email IS NOT NULL;

-- Step 2: Update consent records with emails from preferences
-- This updates records where:
-- 1. The visitor has a verified email in visitor_consent_preferences
-- 2. The consent record doesn't have an email yet
UPDATE dpdpa_consent_records dcr
SET 
    visitor_email = vcp.visitor_email,
    visitor_email_hash = vcp.visitor_email_hash,
    updated_at = NOW()
FROM 
    visitor_consent_preferences vcp
WHERE 
    dcr.visitor_id = vcp.visitor_id
    AND dcr.widget_id = vcp.widget_id
    AND vcp.visitor_email IS NOT NULL
    AND vcp.visitor_email_hash IS NOT NULL
    AND (dcr.visitor_email IS NULL OR dcr.visitor_email_hash IS NULL);

-- Step 3: Verification - Check results
SELECT 
    '✅ VERIFICATION' as check_name,
    COUNT(*) as total_consent_records,
    COUNT(visitor_email) as records_with_email,
    COUNT(visitor_email_hash) as records_with_email_hash,
    ROUND(100.0 * COUNT(visitor_email) / NULLIF(COUNT(*), 0), 2) || '%' as email_coverage
FROM 
    dpdpa_consent_records
WHERE 
    consent_given_at > NOW() - INTERVAL '90 days'; -- Check last 90 days

-- Step 4: Show sample of updated records
SELECT 
    '📋 SAMPLE UPDATED RECORDS' as check_name,
    dcr.id,
    dcr.visitor_id,
    dcr.widget_id,
    LEFT(dcr.visitor_email, 3) || '***' as email_preview,
    dcr.consent_status,
    dcr.consent_given_at,
    dcr.updated_at
FROM 
    dpdpa_consent_records dcr
WHERE 
    dcr.visitor_email IS NOT NULL
    AND dcr.updated_at > NOW() - INTERVAL '1 hour' -- Records updated in last hour
ORDER BY 
    dcr.updated_at DESC
LIMIT 10;

-- ============================================================================
-- NOTES:
-- 1. This script is idempotent - safe to run multiple times
-- 2. Only updates records where email is missing (won't overwrite existing emails)
-- 3. Updates both visitor_email and visitor_email_hash for consistency
-- 4. Run this after applying the API fixes to sync existing verified emails
-- ============================================================================

