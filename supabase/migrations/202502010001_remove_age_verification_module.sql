-- Migration: Remove Age Verification, DigiLocker, and API Setu Module
-- Description: Removes all tables, columns, and constraints related to age verification
-- Created: 2026-02-01

BEGIN;

-- 1. Drop foreign key constraints first (to avoid dependency issues)
ALTER TABLE IF EXISTS public.dpdpa_consent_records 
    DROP CONSTRAINT IF EXISTS fk_consent_age_verification;

ALTER TABLE IF EXISTS public.meripehchaan_consent_artefacts 
    DROP CONSTRAINT IF EXISTS meripehchaan_consent_artefacts_age_verification_session_id_fkey;

-- 2. Drop columns from dpdpa_consent_records
ALTER TABLE IF EXISTS public.dpdpa_consent_records 
    DROP COLUMN IF EXISTS age_verification_id;

-- 3. Drop columns from dpdpa_widget_configs (age verification related)
ALTER TABLE IF EXISTS public.dpdpa_widget_configs 
    DROP COLUMN IF EXISTS enable_age_gate,
    DROP COLUMN IF EXISTS age_gate_threshold,
    DROP COLUMN IF EXISTS age_gate_minor_message,
    DROP COLUMN IF EXISTS require_age_verification,
    DROP COLUMN IF EXISTS age_verification_threshold,
    DROP COLUMN IF EXISTS age_verification_provider,
    DROP COLUMN IF EXISTS minor_handling,
    DROP COLUMN IF EXISTS minor_guardian_message,
    DROP COLUMN IF EXISTS verification_validity_days;

-- 4. Drop the check constraint for age_verification_provider if it exists
ALTER TABLE IF EXISTS public.dpdpa_widget_configs 
    DROP CONSTRAINT IF EXISTS dpdpa_widget_configs_age_verification_provider_check;

-- 5. Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.meripehchaan_consent_artefacts;
DROP TABLE IF EXISTS public.age_verification_sessions;

-- 6. Clean up any related indexes (they will be dropped with tables, but just in case)
DROP INDEX IF EXISTS idx_age_verification_sessions_widget_id;
DROP INDEX IF EXISTS idx_age_verification_sessions_session_id;
DROP INDEX IF EXISTS idx_age_verification_sessions_state_token;
DROP INDEX IF EXISTS idx_age_verification_sessions_status;
DROP INDEX IF EXISTS idx_meripehchaan_consent_artefacts_acknowledgement_id;
DROP INDEX IF EXISTS idx_meripehchaan_consent_artefacts_session_id;

COMMIT;

-- Verification queries (run manually to confirm cleanup)
-- Uncomment to verify:

-- Check if tables are removed
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('age_verification_sessions', 'meripehchaan_consent_artefacts');

-- Check if columns are removed from dpdpa_widget_configs
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'dpdpa_widget_configs' 
-- AND column_name LIKE '%age%';

-- Check if age_verification_id column is removed from dpdpa_consent_records
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'dpdpa_consent_records' 
-- AND column_name = 'age_verification_id';
