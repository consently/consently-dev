-- ============================================================================
-- DPDPA SCHEMA UPDATE - Add Missing Columns to Existing Tables
-- ============================================================================
-- Version: 1.0.1
-- Date: 2025-01-06
-- Purpose: Update existing DPDPA tables with missing columns
--
-- This migration safely adds missing columns to existing DPDPA tables
-- ============================================================================

-- ============================================================================
-- UPDATE dpdpa_widget_configs table
-- ============================================================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Privacy notice version tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'privacy_notice_version') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN privacy_notice_version VARCHAR(50);
    RAISE NOTICE 'Added column: privacy_notice_version';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'privacy_notice_last_updated') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN privacy_notice_last_updated TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added column: privacy_notice_last_updated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'requires_reconsent') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN requires_reconsent BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: requires_reconsent';
  END IF;

  -- Custom translations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'custom_translations') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN custom_translations JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added column: custom_translations';
  END IF;

  -- Enable analytics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'enable_analytics') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN enable_analytics BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: enable_analytics';
  END IF;

  -- Enable audit log
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'enable_audit_log') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN enable_audit_log BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: enable_audit_log';
  END IF;

  -- Custom CSS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_widget_configs' 
                 AND column_name = 'custom_css') THEN
    ALTER TABLE dpdpa_widget_configs 
    ADD COLUMN custom_css TEXT;
    RAISE NOTICE 'Added column: custom_css';
  END IF;

END $$;

-- ============================================================================
-- UPDATE dpdpa_consent_records table
-- ============================================================================

DO $$ 
BEGIN
  -- Browser and OS info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'browser') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN browser VARCHAR(100);
    RAISE NOTICE 'Added column: browser';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'os') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN os VARCHAR(100);
    RAISE NOTICE 'Added column: os';
  END IF;

  -- Location data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'country_code') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN country_code VARCHAR(3);
    RAISE NOTICE 'Added column: country_code';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'region') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN region VARCHAR(100);
    RAISE NOTICE 'Added column: region';
  END IF;

  -- Revocation tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'revoked_at') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added column: revoked_at';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'revocation_reason') THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN revocation_reason TEXT;
    RAISE NOTICE 'Added column: revocation_reason';
  END IF;

END $$;

-- ============================================================================
-- UPDATE dpdpa_grievances table  
-- ============================================================================

DO $$ 
BEGIN
  -- Response tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_grievances' 
                 AND column_name = 'first_response_at') THEN
    ALTER TABLE dpdpa_grievances 
    ADD COLUMN first_response_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added column: first_response_at';
  END IF;

  -- Internal tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_grievances' 
                 AND column_name = 'internal_notes') THEN
    ALTER TABLE dpdpa_grievances 
    ADD COLUMN internal_notes TEXT;
    RAISE NOTICE 'Added column: internal_notes';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_grievances' 
                 AND column_name = 'attachments') THEN
    ALTER TABLE dpdpa_grievances 
    ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added column: attachments';
  END IF;

  -- Compliance tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_grievances' 
                 AND column_name = 'compliance_status') THEN
    ALTER TABLE dpdpa_grievances 
    ADD COLUMN compliance_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (compliance_status IN ('pending', 'compliant', 'overdue', 'breached'));
    RAISE NOTICE 'Added column: compliance_status';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_grievances' 
                 AND column_name = 'escalation_reason') THEN
    ALTER TABLE dpdpa_grievances 
    ADD COLUMN escalation_reason TEXT;
    RAISE NOTICE 'Added column: escalation_reason';
  END IF;

END $$;

-- ============================================================================
-- Add missing indexes
-- ============================================================================

-- Widget Configs Indexes (with column existence checks)
DO $$
BEGIN
  -- user_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_user_id ON dpdpa_widget_configs(user_id);
  END IF;

  -- widget_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'widget_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_widget_id ON dpdpa_widget_configs(widget_id);
  END IF;

  -- domain index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'domain') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_domain ON dpdpa_widget_configs(domain);
  END IF;

  -- is_active index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_is_active ON dpdpa_widget_configs(is_active);
  END IF;

  -- created_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_created_at ON dpdpa_widget_configs(created_at DESC);
  END IF;
END $$;

-- Consent Records Indexes (with column existence checks)
DO $$
BEGIN
  -- widget_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'widget_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_id ON dpdpa_consent_records(widget_id);
  END IF;

  -- visitor_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'visitor_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_id ON dpdpa_consent_records(visitor_id);
  END IF;

  -- consent_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'consent_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_id ON dpdpa_consent_records(consent_id);
  END IF;

  -- consent_status index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'consent_status') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_status ON dpdpa_consent_records(consent_status);
  END IF;

  -- created_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_created_at ON dpdpa_consent_records(created_at DESC);
  END IF;

  -- consent_given_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'consent_given_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_given_at ON dpdpa_consent_records(consent_given_at DESC);
  END IF;

  -- consent_expires_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'consent_expires_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_expires_at ON dpdpa_consent_records(consent_expires_at);
  END IF;

  -- Composite widget_id + visitor_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'widget_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dpdpa_consent_records' 
                 AND column_name = 'visitor_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_visitor ON dpdpa_consent_records(widget_id, visitor_id);
  END IF;
END $$;

-- GIN indexes for array columns (if they exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'consented_activities') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consented_activities 
    ON dpdpa_consent_records USING GIN(consented_activities);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'rejected_activities') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_rejected_activities 
    ON dpdpa_consent_records USING GIN(rejected_activities);
  END IF;
END $$;

-- Grievances Indexes (with column existence checks)
DO $$
BEGIN
  -- widget_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'widget_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_widget_id ON dpdpa_grievances(widget_id);
  END IF;

  -- visitor_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'visitor_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_visitor_id ON dpdpa_grievances(visitor_id);
  END IF;

  -- email index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_email ON dpdpa_grievances(email);
  END IF;

  -- status index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_status ON dpdpa_grievances(status);
  END IF;

  -- request_type index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'request_type') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_request_type ON dpdpa_grievances(request_type);
  END IF;

  -- priority index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'priority') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_priority ON dpdpa_grievances(priority);
  END IF;

  -- compliance_status index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'compliance_status') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_compliance_status ON dpdpa_grievances(compliance_status);
  END IF;

  -- response_due_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'response_due_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_response_due_at ON dpdpa_grievances(response_due_at);
  END IF;

  -- created_at index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_created_at ON dpdpa_grievances(created_at DESC);
  END IF;

  -- assigned_to index
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_grievances' 
             AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_assigned_to ON dpdpa_grievances(assigned_to);
  END IF;
END $$;

-- ============================================================================
-- Add column comments
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_widget_configs' 
             AND column_name = 'privacy_notice_version') THEN
    COMMENT ON COLUMN dpdpa_widget_configs.privacy_notice_version IS 'Version tracking for privacy notice updates';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dpdpa_consent_records' 
             AND column_name = 'browser') THEN
    COMMENT ON COLUMN dpdpa_consent_records.browser IS 'Browser name extracted from user agent';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ DPDPA schema update completed successfully!';
  RAISE NOTICE 'Run these queries to verify:';
  RAISE NOTICE '  SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ''dpdpa_widget_configs'';';
  RAISE NOTICE '  SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ''dpdpa_consent_records'';';
  RAISE NOTICE '  SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ''dpdpa_grievances'';';
END $$;
