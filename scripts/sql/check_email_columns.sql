-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Email Column Status
-- Run this in Supabase SQL Editor to diagnose the email display issue
-- ============================================================================

-- ============================================================================
-- CHECK 1: Do the columns exist?
-- ============================================================================
SELECT 
    '✅ COLUMN CHECK' as check_name,
    table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL allowed' ELSE 'NOT NULL' END as nullable_status
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('dpdpa_consent_records', 'visitor_consent_preferences')
    AND column_name IN ('visitor_email', 'visitor_email_hash')
ORDER BY 
    table_name, column_name;

-- Expected: Should return 4 rows (2 columns × 2 tables)
-- If returns 0 rows: Columns don't exist - run migration
-- If returns 1-3 rows: Partial migration - run migration again

-- ============================================================================
-- CHECK 2: How many records have email data?
-- ============================================================================
SELECT 
    '📊 DATA STATISTICS' as check_name,
    COUNT(*) as total_records,
    COUNT(visitor_email) as records_with_email,
    COUNT(visitor_email_hash) as records_with_email_hash,
    COUNT(*) - COUNT(visitor_email) as records_without_email,
    ROUND(100.0 * COUNT(visitor_email) / NULLIF(COUNT(*), 0), 2) || '%' as email_capture_rate
FROM 
    public.dpdpa_consent_records;

-- This shows how many existing records have email data
-- Low percentage is normal if email feature was recently added

-- ============================================================================
-- CHECK 3: Recent records (last 24 hours)
-- ============================================================================
SELECT 
    '🕐 RECENT RECORDS (Last 24h)' as check_name,
    id,
    consent_given_at,
    CASE 
        WHEN visitor_email IS NOT NULL THEN '✅ Has Email'
        WHEN visitor_email_hash IS NOT NULL THEN '⚠️  Hash Only'
        ELSE '❌ No Email'
    END as email_status,
    LEFT(visitor_email, 3) || '***' as email_preview,
    consent_status,
    device_type
FROM 
    public.dpdpa_consent_records
WHERE 
    consent_given_at > NOW() - INTERVAL '24 hours'
ORDER BY 
    consent_given_at DESC
LIMIT 10;

-- This shows if new records are capturing emails
-- If all show "❌ No Email" after migration: Check widget integration

-- ============================================================================
-- CHECK 4: Sample of records WITH emails
-- ============================================================================
SELECT 
    '✉️  RECORDS WITH EMAILS (Sample)' as check_name,
    COUNT(*) as total_with_emails,
    MIN(consent_given_at) as first_email_record,
    MAX(consent_given_at) as last_email_record,
    COUNT(DISTINCT widget_id) as widgets_capturing_emails
FROM 
    public.dpdpa_consent_records
WHERE 
    visitor_email IS NOT NULL;

-- This shows when email capture started working
-- If count is 0: No emails captured yet (normal for new feature)

-- ============================================================================
-- CHECK 5: Index status (Performance)
-- ============================================================================
SELECT 
    '⚡ INDEX CHECK' as check_name,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename IN ('dpdpa_consent_records', 'visitor_consent_preferences')
    AND indexname LIKE '%email%'
ORDER BY 
    tablename, indexname;

-- This checks if performance indexes exist
-- If empty: Indexes missing - should be added for better performance

-- ============================================================================
-- DIAGNOSIS SUMMARY
-- ============================================================================

DO $$
DECLARE
    columns_exist_count INTEGER;
    total_records INTEGER;
    records_with_email INTEGER;
    email_percentage NUMERIC;
    diagnosis TEXT := '';
BEGIN
    -- Check if columns exist
    SELECT COUNT(*) INTO columns_exist_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'dpdpa_consent_records'
        AND column_name IN ('visitor_email', 'visitor_email_hash');
    
    -- Get record statistics
    SELECT 
        COUNT(*),
        COUNT(visitor_email),
        ROUND(100.0 * COUNT(visitor_email) / NULLIF(COUNT(*), 0), 2)
    INTO total_records, records_with_email, email_percentage
    FROM public.dpdpa_consent_records;
    
    -- Build diagnosis
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '                    DIAGNOSIS SUMMARY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Column Check
    IF columns_exist_count = 2 THEN
        RAISE NOTICE '✅ COLUMNS: Both visitor_email and visitor_email_hash exist';
    ELSIF columns_exist_count = 1 THEN
        RAISE NOTICE '⚠️  COLUMNS: Only 1 of 2 columns exists - MIGRATION NEEDED';
        diagnosis := diagnosis || 'ACTION REQUIRED: Run migration to add missing column' || E'\n';
    ELSE
        RAISE NOTICE '❌ COLUMNS: Email columns do not exist - MIGRATION REQUIRED';
        diagnosis := diagnosis || 'ACTION REQUIRED: Run apply_email_columns_migration.sql' || E'\n';
    END IF;
    
    -- Data Check
    RAISE NOTICE '';
    RAISE NOTICE '📊 DATA STATISTICS:';
    RAISE NOTICE '   Total Records: %', total_records;
    RAISE NOTICE '   Records with Email: % (% percent of total)', records_with_email, email_percentage;
    
    IF columns_exist_count = 2 THEN
        IF records_with_email = 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE '💡 INSIGHT: Columns exist but no emails captured yet';
            RAISE NOTICE '   Possible reasons:';
            RAISE NOTICE '   - Email feature was recently added';
            RAISE NOTICE '   - Users are skipping email verification';
            RAISE NOTICE '   - Widget needs to be updated on website';
        ELSIF email_percentage < 10 THEN
            RAISE NOTICE '';
            RAISE NOTICE '💡 INSIGHT: Low email capture rate (% percent)', email_percentage;
            RAISE NOTICE '   This is normal if feature was recently added';
        ELSE
            RAISE NOTICE '';
            RAISE NOTICE '✅ GOOD: Email capture is working (% percent)', email_percentage;
        END IF;
    END IF;
    
    -- Final Recommendations
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '                      RECOMMENDATIONS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
    IF columns_exist_count < 2 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 IMMEDIATE ACTION:';
        RAISE NOTICE '   1. Run apply_email_columns_migration.sql';
        RAISE NOTICE '   2. Verify migration success by running this script again';
        RAISE NOTICE '   3. Test widget email verification feature';
        RAISE NOTICE '   4. Check dashboard to confirm emails display';
    ELSIF records_with_email = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 TESTING NEEDED:';
        RAISE NOTICE '   1. Visit a page with the DPDPA widget';
        RAISE NOTICE '   2. Give consent (accept or customize)';
        RAISE NOTICE '   3. Complete email verification when prompted';
        RAISE NOTICE '   4. Check dashboard to see if email appears';
        RAISE NOTICE '   5. Click "Show Emails" button to reveal email';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ ALL GOOD:';
        RAISE NOTICE '   - Columns exist';
        RAISE NOTICE '   - Emails are being captured';
        RAISE NOTICE '   - If dashboard not showing emails, check:';
        RAISE NOTICE '     • Browser console for JavaScript errors';
        RAISE NOTICE '     • API response includes visitor_email field';
        RAISE NOTICE '     • "Show Emails" button is clicked';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
END $$;

