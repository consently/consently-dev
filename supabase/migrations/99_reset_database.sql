-- =====================================================
-- DATABASE RESET SCRIPT
-- WARNING: This will delete ALL data from all tables
-- Use this only for development/testing purposes
-- =====================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Delete all data from tables (in correct order to avoid FK constraints)
-- Start with tables that have no dependencies

-- Email and audit logs
TRUNCATE TABLE public.email_logs CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;

-- Widget performance and analytics
TRUNCATE TABLE public.widget_performance_metrics CASCADE;
TRUNCATE TABLE public.consent_analytics CASCADE;

-- Consent-related tables
TRUNCATE TABLE public.consent_history CASCADE;
TRUNCATE TABLE public.consent_receipts CASCADE;
TRUNCATE TABLE public.consent_records CASCADE;
TRUNCATE TABLE public.consent_logs CASCADE;
TRUNCATE TABLE public.visitor_consent_preferences CASCADE;
TRUNCATE TABLE public.dpdpa_consent_records CASCADE;

-- DPDPA-specific tables
TRUNCATE TABLE public.dpdp_rights_requests CASCADE;
TRUNCATE TABLE public.dpdpa_grievances CASCADE;
TRUNCATE TABLE public.dpdpa_widget_configs CASCADE;

-- Widget configurations and translations
TRUNCATE TABLE public.widget_translations CASCADE;
TRUNCATE TABLE public.widget_configs CASCADE;

-- Cookie-related tables
TRUNCATE TABLE public.cookie_compliance_checks CASCADE;
TRUNCATE TABLE public.cookie_scan_history CASCADE;
TRUNCATE TABLE public.cookie_policies CASCADE;
TRUNCATE TABLE public.cookie_scans CASCADE;
TRUNCATE TABLE public.cookies CASCADE;
TRUNCATE TABLE public.cookie_categories CASCADE;
TRUNCATE TABLE public.cookie_banners CASCADE;

-- Banner configurations
TRUNCATE TABLE public.banner_versions CASCADE;
TRUNCATE TABLE public.banner_configs CASCADE;

-- Processing activities and related tables
TRUNCATE TABLE public.data_recipients CASCADE;
TRUNCATE TABLE public.data_sources CASCADE;
TRUNCATE TABLE public.purpose_data_categories CASCADE;
TRUNCATE TABLE public.activity_purposes CASCADE;
TRUNCATE TABLE public.processing_activities CASCADE;

-- Purposes (only if not predefined)
DELETE FROM public.purposes WHERE is_predefined = false;

-- Subscriptions
TRUNCATE TABLE public.subscriptions CASCADE;

-- Users table (be careful - this will remove user data but not auth.users)
-- Comment this out if you want to keep user accounts
-- TRUNCATE TABLE public.users CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- =====================================================
-- Optional: Reset sequences (uncomment if needed)
-- =====================================================
-- This will reset auto-increment counters if you use any

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this after the reset to verify tables are empty:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
-- FROM (
--   SELECT 
--     table_schema as schemaname,
--     table_name as tablename,
--     query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', table_schema, table_name), false, true, '') as xml_count
--   FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_type = 'BASE TABLE'
-- ) t
-- ORDER BY row_count DESC, tablename;

-- =====================================================
-- Post-Reset: Insert Essential Predefined Data
-- =====================================================

-- Ensure predefined purposes exist (if they don't already)
INSERT INTO public.purposes (purpose_name, name, description, is_predefined, created_at, updated_at)
VALUES 
  ('account-management', 'Account Management', 'Managing user accounts and authentication', true, NOW(), NOW()),
  ('service-delivery', 'Service Delivery', 'Providing core services to users', true, NOW(), NOW()),
  ('analytics', 'Analytics', 'Analyzing usage patterns and improving services', true, NOW(), NOW()),
  ('marketing', 'Marketing', 'Marketing communications and promotions', true, NOW(), NOW()),
  ('customer-support', 'Customer Support', 'Providing customer support and assistance', true, NOW(), NOW()),
  ('security', 'Security', 'Ensuring platform security and preventing fraud', true, NOW(), NOW()),
  ('legal-compliance', 'Legal Compliance', 'Meeting legal and regulatory requirements', true, NOW(), NOW())
ON CONFLICT (purpose_name) DO NOTHING;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database reset completed successfully!';
  RAISE NOTICE '📝 All user data has been cleared.';
  RAISE NOTICE '🔄 Predefined purposes have been preserved/restored.';
  RAISE NOTICE '⚠️  You can now create new accounts and configurations.';
END $$;
