-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC: Email Verification Flow
-- Run this to understand why emails aren't showing up
-- ============================================================================

-- Check 1: Are there any OTP records at all?
SELECT 
    '📧 OTP RECORDS OVERVIEW' as check_name,
    COUNT(*) as total_otp_records,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_otps,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_otps,
    COUNT(CASE WHEN verified = true AND email IS NOT NULL THEN 1 END) as verified_otps_with_email
FROM 
    email_verification_otps;

-- Check 2: Recent OTP activity (last 7 days)
SELECT 
    '🕐 RECENT OTP ACTIVITY (Last 7 Days)' as check_name,
    DATE(created_at) as date,
    COUNT(*) as total_otps,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_count
FROM 
    email_verification_otps
WHERE 
    created_at > NOW() - INTERVAL '7 days'
GROUP BY 
    DATE(created_at)
ORDER BY 
    date DESC;

-- Check 3: Sample of verified OTPs (if any exist)
SELECT 
    '✅ SAMPLE VERIFIED OTPS' as check_name,
    id,
    LEFT(email, 3) || '***' as email_preview,
    visitor_id,
    widget_id,
    verified_at,
    created_at
FROM 
    email_verification_otps
WHERE 
    verified = true
    AND email IS NOT NULL
ORDER BY 
    verified_at DESC
LIMIT 10;

-- Check 4: Check if verified OTPs have corresponding preferences
SELECT 
    '🔗 OTP → PREFERENCES LINKAGE' as check_name,
    COUNT(DISTINCT otp.visitor_id) as visitors_with_verified_otp,
    COUNT(DISTINCT vcp.visitor_id) as visitors_with_email_in_preferences,
    COUNT(DISTINCT CASE 
        WHEN otp.verified = true AND otp.email IS NOT NULL 
        AND vcp.visitor_email IS NULL 
        THEN otp.visitor_id 
    END) as visitors_missing_email_in_preferences
FROM 
    email_verification_otps otp
LEFT JOIN 
    visitor_consent_preferences vcp
    ON otp.visitor_id = vcp.visitor_id
    AND otp.widget_id = vcp.widget_id
WHERE 
    otp.verified = true
    AND otp.email IS NOT NULL;

-- Check 5: Check if verified OTPs have corresponding consent records
SELECT 
    '🔗 OTP → CONSENT RECORDS LINKAGE' as check_name,
    COUNT(DISTINCT otp.visitor_id) as visitors_with_verified_otp,
    COUNT(DISTINCT dcr.visitor_id) as visitors_with_email_in_records,
    COUNT(DISTINCT CASE 
        WHEN otp.verified = true AND otp.email IS NOT NULL 
        AND dcr.visitor_email IS NULL 
        THEN otp.visitor_id 
    END) as visitors_missing_email_in_records
FROM 
    email_verification_otps otp
LEFT JOIN 
    dpdpa_consent_records dcr
    ON otp.visitor_id = dcr.visitor_id
    AND otp.widget_id = dcr.widget_id
WHERE 
    otp.verified = true
    AND otp.email IS NOT NULL;

-- Check 6: Are there any consent records at all?
SELECT 
    '📋 CONSENT RECORDS OVERVIEW' as check_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT widget_id) as unique_widgets,
    MIN(consent_given_at) as first_consent,
    MAX(consent_given_at) as latest_consent
FROM 
    dpdpa_consent_records;

-- Check 7: Are there any preference records at all?
SELECT 
    '⚙️ PREFERENCE RECORDS OVERVIEW' as check_name,
    COUNT(*) as total_preferences,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT widget_id) as unique_widgets,
    COUNT(CASE WHEN visitor_email IS NOT NULL THEN 1 END) as preferences_with_email,
    COUNT(CASE WHEN visitor_email_hash IS NOT NULL THEN 1 END) as preferences_with_hash
FROM 
    visitor_consent_preferences;

-- Check 8: Check if email columns exist (sanity check)
SELECT 
    '🔍 COLUMN EXISTENCE CHECK' as check_name,
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('dpdpa_consent_records', 'visitor_consent_preferences')
    AND column_name IN ('visitor_email', 'visitor_email_hash')
ORDER BY 
    table_name, column_name;

-- ============================================================================
-- INTERPRETATION GUIDE:
-- 
-- If Check 1 shows 0 verified OTPs:
--   → Email verification hasn't been used yet, or OTPs are being cleaned up
--   → Action: Test the email verification flow
--
-- If Check 1 shows verified OTPs but Check 4/5 show missing emails:
--   → OTP verification works but emails aren't being synced to preferences/records
--   → Action: Check verify-otp endpoint logs, may need to run backfill
--
-- If Check 6 shows 0 consent records:
--   → No consents have been recorded yet
--   → Action: Test the widget consent flow
--
-- If Check 8 doesn't show 4 rows:
--   → Email columns are missing
--   → Action: Run the migration script
-- ============================================================================

