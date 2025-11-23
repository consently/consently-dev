-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Verified Emails Status
-- Run this to understand why emails aren't showing up
-- ============================================================================

-- Check 1: Do we have verified emails in visitor_consent_preferences?
SELECT 
    '📧 VERIFIED EMAILS IN PREFERENCES' as check_name,
    COUNT(DISTINCT visitor_id) as unique_visitors_with_email,
    COUNT(DISTINCT widget_id) as widgets_with_emails,
    COUNT(*) as total_preference_records_with_email
FROM 
    visitor_consent_preferences
WHERE 
    visitor_email IS NOT NULL
    AND visitor_email_hash IS NOT NULL;

-- Check 2: Do we have verified OTPs?
SELECT 
    '✅ VERIFIED OTPS' as check_name,
    COUNT(DISTINCT email_hash) as unique_verified_emails,
    COUNT(*) as total_verified_otps,
    MIN(verified_at) as first_verification,
    MAX(verified_at) as last_verification
FROM 
    email_verification_otps
WHERE 
    verified = true
    AND email IS NOT NULL;

-- Check 3: Consent records that could be updated
SELECT 
    '🔄 CONSENT RECORDS NEEDING UPDATE' as check_name,
    COUNT(DISTINCT dcr.visitor_id) as visitors_without_email_in_records,
    COUNT(dcr.id) as consent_records_missing_email
FROM 
    dpdpa_consent_records dcr
WHERE 
    (dcr.visitor_email IS NULL OR dcr.visitor_email_hash IS NULL)
    AND EXISTS (
        SELECT 1 
        FROM visitor_consent_preferences vcp
        WHERE vcp.visitor_id = dcr.visitor_id
        AND vcp.widget_id = dcr.widget_id
        AND vcp.visitor_email IS NOT NULL
    );

-- Check 4: Sample of visitors with emails in preferences but not in consent records
SELECT 
    '📋 SAMPLE: Visitors needing sync' as check_name,
    vcp.visitor_id,
    vcp.widget_id,
    LEFT(vcp.visitor_email, 3) || '***' as email_preview,
    COUNT(DISTINCT dcr.id) as consent_records_count,
    MAX(dcr.consent_given_at) as latest_consent
FROM 
    visitor_consent_preferences vcp
INNER JOIN 
    dpdpa_consent_records dcr 
    ON vcp.visitor_id = dcr.visitor_id 
    AND vcp.widget_id = dcr.widget_id
WHERE 
    vcp.visitor_email IS NOT NULL
    AND (dcr.visitor_email IS NULL OR dcr.visitor_email_hash IS NULL)
GROUP BY 
    vcp.visitor_id, vcp.widget_id, vcp.visitor_email
ORDER BY 
    latest_consent DESC
LIMIT 10;

-- Check 5: Overall email coverage by source
SELECT 
    '📊 EMAIL COVERAGE SUMMARY' as check_name,
    'visitor_consent_preferences' as source_table,
    COUNT(DISTINCT visitor_id) as visitors_with_email,
    COUNT(*) as total_records_with_email
FROM 
    visitor_consent_preferences
WHERE 
    visitor_email IS NOT NULL
UNION ALL
SELECT 
    '📊 EMAIL COVERAGE SUMMARY' as check_name,
    'dpdpa_consent_records' as source_table,
    COUNT(DISTINCT visitor_id) as visitors_with_email,
    COUNT(*) as total_records_with_email
FROM 
    dpdpa_consent_records
WHERE 
    visitor_email IS NOT NULL;

-- ============================================================================
-- INTERPRETATION GUIDE:
-- 
-- If Check 1 shows 0: No emails verified via OTP yet
-- If Check 1 > 0 but Check 3 = 0: All emails already synced (good!)
-- If Check 1 > 0 and Check 3 > 0: Need to run backfill script
-- If Check 2 shows 0: No OTPs have been verified yet
-- ============================================================================

