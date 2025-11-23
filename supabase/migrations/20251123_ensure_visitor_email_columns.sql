-- ============================================================================
-- Migration: Ensure Visitor Email Columns Exist
-- Description: Adds visitor_email and visitor_email_hash columns if they don't exist
--              This migration is idempotent and safe to run multiple times
-- Date: 2025-11-23
-- ============================================================================

-- Add visitor_email_hash to dpdpa_consent_records (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email_hash'
    ) THEN
        ALTER TABLE public.dpdpa_consent_records 
        ADD COLUMN visitor_email_hash VARCHAR(64) NULL;
        
        -- Add index for performance
        CREATE INDEX idx_dpdpa_consent_records_email_hash 
        ON public.dpdpa_consent_records(visitor_email_hash) 
        WHERE visitor_email_hash IS NOT NULL;
        
        -- Add comment
        COMMENT ON COLUMN public.dpdpa_consent_records.visitor_email_hash IS 
          'SHA-256 hash of visitor email for cross-device consent management. Used to link consent across devices.';
    END IF;
END $$;

-- Add visitor_email to dpdpa_consent_records (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email'
    ) THEN
        ALTER TABLE public.dpdpa_consent_records 
        ADD COLUMN visitor_email TEXT NULL;
        
        -- Add comment
        COMMENT ON COLUMN public.dpdpa_consent_records.visitor_email IS 
          'Optional verified email of the visitor. Used to identify users in the admin dashboard. Only shown when admin clicks Show Emails button.';
    END IF;
END $$;

-- Add visitor_email_hash to visitor_consent_preferences (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email_hash'
    ) THEN
        ALTER TABLE public.visitor_consent_preferences 
        ADD COLUMN visitor_email_hash VARCHAR(64) NULL;
        
        -- Add index for performance
        CREATE INDEX idx_visitor_preferences_email_hash 
        ON public.visitor_consent_preferences(visitor_email_hash) 
        WHERE visitor_email_hash IS NOT NULL;
        
        -- Add comment
        COMMENT ON COLUMN public.visitor_consent_preferences.visitor_email_hash IS 
          'SHA-256 hash of visitor email for cross-device consent management.';
    END IF;
END $$;

-- Add visitor_email to visitor_consent_preferences (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email'
    ) THEN
        ALTER TABLE public.visitor_consent_preferences 
        ADD COLUMN visitor_email TEXT NULL;
        
        -- Add comment
        COMMENT ON COLUMN public.visitor_consent_preferences.visitor_email IS 
          'Optional verified email of the visitor. Used to identify users in the admin dashboard.';
    END IF;
END $$;

-- Verification query to confirm columns exist
DO $$
DECLARE
    consent_records_email_hash_exists BOOLEAN;
    consent_records_email_exists BOOLEAN;
    preferences_email_hash_exists BOOLEAN;
    preferences_email_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email_hash'
    ) INTO consent_records_email_hash_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email'
    ) INTO consent_records_email_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email_hash'
    ) INTO preferences_email_hash_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email'
    ) INTO preferences_email_exists;
    
    RAISE NOTICE '✅ Migration verification:';
    RAISE NOTICE '   dpdpa_consent_records.visitor_email_hash: %', consent_records_email_hash_exists;
    RAISE NOTICE '   dpdpa_consent_records.visitor_email: %', consent_records_email_exists;
    RAISE NOTICE '   visitor_consent_preferences.visitor_email_hash: %', preferences_email_hash_exists;
    RAISE NOTICE '   visitor_consent_preferences.visitor_email: %', preferences_email_exists;
    
    IF consent_records_email_hash_exists AND consent_records_email_exists AND 
       preferences_email_hash_exists AND preferences_email_exists THEN
        RAISE NOTICE '✅ All visitor email columns exist and migration is complete!';
    ELSE
        RAISE EXCEPTION '❌ Some columns are still missing. Please review the migration.';
    END IF;
END $$;

