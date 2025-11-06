-- ============================================================================
-- DATABASE SCHEMA VERIFICATION SCRIPT
-- ============================================================================
-- Purpose: Verify that all tables, columns, constraints, indexes, and RLS
--          policies are correctly configured for both DPDPA and Cookie widgets
-- ============================================================================

-- Header
SELECT 'CONSENTLY DATABASE SCHEMA VERIFICATION' as section, '' as check_type, '' as status, '' as details;

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ============================================================================
SELECT 
  '1. TABLE EXISTENCE' as section,
  'DPDPA Tables' as check_type,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  CASE 
    WHEN COUNT(*) = 3 THEN 'All 3 tables exist'
    ELSE 'Missing ' || (3 - COUNT(*))::text || ' table(s)'
  END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('dpdpa_widget_configs', 'dpdpa_consent_records', 'dpdpa_grievances')

UNION ALL

SELECT 
  '1. TABLE EXISTENCE' as section,
  'Cookie Tables' as check_type,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  CASE 
    WHEN COUNT(*) = 4 THEN 'All 4 tables exist'
    ELSE 'Missing ' || (4 - COUNT(*))::text || ' table(s)'
  END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('banner_configs', 'widget_configs', 'consent_records', 'consent_logs');

-- ============================================================================
-- SECTION 2: DPDPA WIDGET CONFIGS - COLUMN VALIDATION
-- ============================================================================
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'user_id', 'widget_id', 'name', 'domain', 'position', 'layout',
    'theme', 'title', 'message', 'accept_button_text', 'reject_button_text',
    'customize_button_text', 'selected_activities', 'auto_show', 'show_after_delay',
    'consent_duration', 'respect_dnt', 'require_explicit_consent',
    'show_data_subjects_rights', 'language', 'supported_languages',
    'custom_translations', 'enable_analytics', 'enable_audit_log',
    'show_branding', 'custom_css', 'privacy_notice_version',
    'privacy_notice_last_updated', 'requires_reconsent', 'is_active',
    'created_at', 'updated_at'
  ]) AS column_name
),
actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'dpdpa_widget_configs'
),
missing_columns AS (
  SELECT column_name
  FROM expected_columns
  WHERE column_name NOT IN (SELECT column_name FROM actual_columns)
),
extra_columns AS (
  SELECT column_name
  FROM actual_columns
  WHERE column_name NOT IN (SELECT column_name FROM expected_columns)
)
SELECT 
  '2. DPDPA WIDGET CONFIGS COLUMNS' as section,
  'Missing Columns' as check_type,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'All expected columns present'
    ELSE 'Missing: ' || string_agg(column_name, ', ')
  END as details
FROM missing_columns

UNION ALL

SELECT 
  '2. DPDPA WIDGET CONFIGS COLUMNS' as section,
  'Extra Columns' as check_type,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '⚠️  WARN' END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'No unexpected columns'
    ELSE 'Extra: ' || string_agg(column_name, ', ')
  END as details
FROM extra_columns;

-- ============================================================================
-- SECTION 3: DPDPA CONSENT RECORDS - COLUMN VALIDATION
-- ============================================================================
SELECT 
  '3. DPDPA CONSENT RECORDS COLUMNS' as section,
  'Column Count' as check_type,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  'Found ' || COUNT(*)::text || ' columns (expected >= 20)' as details
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'dpdpa_consent_records';

-- ============================================================================
-- SECTION 4: COOKIE WIDGET CONFIGS - COLUMN VALIDATION
-- ============================================================================
SELECT 
  '4. COOKIE WIDGET CONFIGS COLUMNS' as section,
  'Column Count' as check_type,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  'Found ' || COUNT(*)::text || ' columns (expected >= 20)' as details
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'widget_configs';

-- ============================================================================
-- SECTION 5: INDEXES VALIDATION
-- ============================================================================
SELECT 
  '5. INDEXES' as section,
  'DPDPA Widget Configs' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  COUNT(*)::text || ' indexes found' as details
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'dpdpa_widget_configs'

UNION ALL

SELECT 
  '5. INDEXES' as section,
  'DPDPA Consent Records' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  COUNT(*)::text || ' indexes found' as details
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'dpdpa_consent_records'

UNION ALL

SELECT 
  '5. INDEXES' as section,
  'Cookie Widget Configs' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  COUNT(*)::text || ' indexes found' as details
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'widget_configs'

UNION ALL

SELECT 
  '5. INDEXES' as section,
  'Banner Configs' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS'
    ELSE '⚠️  WARN'
  END as status,
  COUNT(*)::text || ' indexes found' as details
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'banner_configs';

-- ============================================================================
-- SECTION 6: FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT 
  '6. FOREIGN KEY CONSTRAINTS' as section,
  conrelid::regclass::text as check_type,
  '✅' as status,
  'References ' || confrelid::regclass::text as details
FROM pg_constraint 
WHERE contype = 'f' 
  AND conrelid::regclass::text IN (
    'dpdpa_widget_configs', 
    'dpdpa_consent_records',
    'dpdpa_grievances',
    'widget_configs',
    'banner_configs',
    'consent_records',
    'consent_logs'
  )
ORDER BY conrelid::regclass::text, conname;

-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) STATUS
-- ============================================================================
SELECT 
  '7. ROW LEVEL SECURITY' as section,
  tablename as check_type,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status,
  '' as details
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records', 
    'dpdpa_grievances',
    'widget_configs',
    'banner_configs',
    'consent_records',
    'consent_logs'
  )
ORDER BY tablename;

-- ============================================================================
-- SECTION 8: RLS POLICIES
-- ============================================================================
SELECT 
  '8. RLS POLICIES' as section,
  tablename || ' - ' || policyname as check_type,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ SELECT'
    WHEN cmd = 'INSERT' THEN '✅ INSERT'
    WHEN cmd = 'UPDATE' THEN '✅ UPDATE'
    WHEN cmd = 'DELETE' THEN '✅ DELETE'
    ELSE cmd
  END as status,
  CASE 
    WHEN roles::text LIKE '%anon%' THEN '🌐 Public'
    WHEN roles::text LIKE '%authenticated%' THEN '🔒 Auth'
    ELSE roles::text
  END as details
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records',
    'dpdpa_grievances',
    'widget_configs',
    'banner_configs',
    'consent_records',
    'consent_logs'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 9: DATA TYPE VALIDATION
-- ============================================================================
SELECT 
  '9. DATA TYPES' as section,
  table_name || '.' || column_name as check_type,
  CASE 
    WHEN data_type = 'text' OR data_type = 'character varying' THEN '✅'
    ELSE '❌'
  END as status,
  data_type as details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'dpdpa_widget_configs' AND column_name = 'widget_id')
    OR (table_name = 'widget_configs' AND column_name = 'widget_id'))

UNION ALL

SELECT 
  '9. DATA TYPES' as section,
  'dpdpa_widget_configs.selected_activities' as check_type,
  CASE 
    WHEN data_type = 'ARRAY' AND udt_name = '_uuid' THEN '✅ UUID[]'
    ELSE '⚠️  ' || data_type
  END as status,
  udt_name as details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dpdpa_widget_configs'
  AND column_name = 'selected_activities';

-- ============================================================================
-- SECTION 10: UNIQUE CONSTRAINTS
-- ============================================================================
SELECT 
  '10. UNIQUE CONSTRAINTS' as section,
  tc.table_name as check_type,
  '✅' as status,
  kcu.column_name || ' (constraint: ' || tc.constraint_name || ')' as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name 
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records',
    'widget_configs',
    'consent_records'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SECTION 11: CHECK CONSTRAINTS
-- ============================================================================
SELECT 
  '11. CHECK CONSTRAINTS' as section,
  conrelid::regclass::text as check_type,
  '✅' as status,
  pg_get_constraintdef(oid) as details
FROM pg_constraint 
WHERE contype = 'c' 
  AND conrelid::regclass::text IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records',
    'widget_configs'
  )
ORDER BY conrelid::regclass::text, conname;

-- ============================================================================
-- SECTION 12: TRIGGERS
-- ============================================================================
SELECT 
  '12. TRIGGERS' as section,
  event_object_table as check_type,
  '✅' as status,
  trigger_name || ' (' || event_manipulation || ' ' || action_timing || ')' as details
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records',
    'dpdpa_grievances',
    'widget_configs',
    'banner_configs',
    'consent_records',
    'consent_logs'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 13: SAMPLE DATA VALIDATION
-- ============================================================================
SELECT 
  '13. DATA STATISTICS' as section,
  'dpdpa_widget_configs' as check_type,
  '✅' as status,
  COUNT(*)::text || ' records, ' || 
  COUNT(DISTINCT user_id)::text || ' users, ' ||
  COUNT(DISTINCT widget_id)::text || ' widgets' as details
FROM dpdpa_widget_configs

UNION ALL

SELECT 
  '13. DATA STATISTICS' as section,
  'dpdpa_consent_records' as check_type,
  '✅' as status,
  COUNT(*)::text || ' records, ' || 
  COUNT(DISTINCT widget_id)::text || ' widgets, ' ||
  COUNT(DISTINCT visitor_id)::text || ' visitors' as details
FROM dpdpa_consent_records

UNION ALL

SELECT 
  '13. DATA STATISTICS' as section,
  'widget_configs' as check_type,
  '✅' as status,
  COUNT(*)::text || ' records, ' || 
  COUNT(DISTINCT user_id)::text || ' users, ' ||
  COUNT(DISTINCT widget_id)::text || ' widgets' as details
FROM widget_configs

UNION ALL

SELECT 
  '13. DATA STATISTICS' as section,
  'banner_configs' as check_type,
  '✅' as status,
  COUNT(*)::text || ' records, ' || 
  COUNT(DISTINCT user_id)::text || ' users' as details
FROM banner_configs;

-- ============================================================================
-- SECTION 14: REFERENTIAL INTEGRITY CHECK
-- ============================================================================
SELECT 
  '14. REFERENTIAL INTEGRITY' as section,
  'DPDPA Consent Records' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'No orphaned records'
    ELSE COUNT(*)::text || ' orphaned records found'
  END as details
FROM dpdpa_consent_records dcr
LEFT JOIN dpdpa_widget_configs dwc ON dcr.widget_id = dwc.widget_id
WHERE dwc.widget_id IS NULL

UNION ALL

SELECT 
  '14. REFERENTIAL INTEGRITY' as section,
  'Cookie Consent Records' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'No orphaned records'
    ELSE COUNT(*)::text || ' orphaned records found'
  END as details
FROM consent_records cr
WHERE cr.widget_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM widget_configs wc WHERE wc.widget_id = cr.widget_id
  );

-- ============================================================================
-- SECTION 15: PERFORMANCE ANALYSIS
-- ============================================================================
SELECT 
  '15. TABLE SIZES' as section,
  tablename as check_type,
  '✅' as status,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) || 
  ' total (' || 
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) || 
  ' table, ' ||
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) ||
  ' indexes)' as details
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'dpdpa_widget_configs',
    'dpdpa_consent_records',
    'dpdpa_grievances',
    'widget_configs',
    'banner_configs',
    'consent_records',
    'consent_logs'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Footer
SELECT 'VERIFICATION COMPLETE' as section, '' as check_type, '' as status, '' as details;
SELECT 'Legend: ✅ = Pass, ❌ = Fail, ⚠️ = Warning, 🔒 = Auth, 🌐 = Public' as section, '' as check_type, '' as status, '' as details;
