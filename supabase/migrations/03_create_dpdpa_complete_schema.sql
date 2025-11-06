-- ============================================================================
-- DPDPA (Digital Personal Data Protection Act 2023) COMPLETE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-01-06
-- Purpose: Complete database schema for DPDPA compliance platform
--
-- This migration creates all necessary tables for:
-- 1. DPDPA Widget Configuration
-- 2. Consent Record Management
-- 3. Grievance/Data Subject Rights Management
-- 4. Analytics and Reporting
-- 
-- Production-ready with:
-- - Proper indexes for performance
-- - Foreign key constraints for data integrity
-- - Row Level Security (RLS) policies
-- - Audit trails with timestamps
-- - Data validation constraints
-- ============================================================================

-- ============================================================================
-- SECTION 1: DPDPA WIDGET CONFIGURATIONS TABLE
-- ============================================================================
-- Stores widget configurations for DPDPA consent collection
CREATE TABLE IF NOT EXISTS dpdpa_widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership & identification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- Basic configuration
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  
  -- Display settings
  position VARCHAR(50) DEFAULT 'modal' CHECK (position IN ('top', 'bottom', 'center', 'bottom-left', 'bottom-right', 'modal')),
  layout VARCHAR(50) DEFAULT 'modal' CHECK (layout IN ('modal', 'slide-in', 'banner')),
  
  -- Theme configuration (JSONB for flexibility)
  theme JSONB DEFAULT '{
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "borderRadius": 12,
    "fontFamily": "system-ui, -apple-system, sans-serif"
  }'::jsonb,
  
  -- Content
  title VARCHAR(500),
  message TEXT,
  accept_button_text VARCHAR(100) DEFAULT 'Accept All',
  reject_button_text VARCHAR(100) DEFAULT 'Reject All',
  customize_button_text VARCHAR(100) DEFAULT 'Manage Preferences',
  
  -- Selected processing activities (array of UUIDs)
  selected_activities UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Behavior settings
  auto_show BOOLEAN DEFAULT true,
  show_after_delay INTEGER DEFAULT 1000 CHECK (show_after_delay >= 0 AND show_after_delay <= 30000),
  consent_duration INTEGER DEFAULT 365 CHECK (consent_duration >= 1 AND consent_duration <= 730),
  respect_dnt BOOLEAN DEFAULT false,
  require_explicit_consent BOOLEAN DEFAULT true,
  show_data_subjects_rights BOOLEAN DEFAULT true,
  
  -- Localization
  language VARCHAR(10) DEFAULT 'en',
  supported_languages TEXT[] DEFAULT ARRAY['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
  custom_translations JSONB DEFAULT '{}'::jsonb,
  
  -- Advanced features
  enable_analytics BOOLEAN DEFAULT true,
  enable_audit_log BOOLEAN DEFAULT true,
  show_branding BOOLEAN DEFAULT true,
  custom_css TEXT,
  
  -- Privacy notice versioning
  privacy_notice_version VARCHAR(50),
  privacy_notice_last_updated TIMESTAMP WITH TIME ZONE,
  requires_reconsent BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_user_widget UNIQUE (user_id, widget_id),
  CONSTRAINT valid_domain CHECK (LENGTH(domain) >= 3 AND domain !~ 'http|www'),
  CONSTRAINT valid_selected_activities CHECK (array_length(selected_activities, 1) IS NULL OR array_length(selected_activities, 1) <= 100)
);

-- Table comments
COMMENT ON TABLE dpdpa_widget_configs IS 'Stores DPDPA widget configurations for external website integration';
COMMENT ON COLUMN dpdpa_widget_configs.widget_id IS 'Unique identifier used in embed code (format: dpdpa_*)';
COMMENT ON COLUMN dpdpa_widget_configs.selected_activities IS 'Array of processing activity UUIDs to display in widget';
COMMENT ON COLUMN dpdpa_widget_configs.consent_duration IS 'Number of days consent is valid before re-consent required';
COMMENT ON COLUMN dpdpa_widget_configs.privacy_notice_version IS 'Version tracking for privacy notice updates';

-- ============================================================================
-- SECTION 2: DPDPA CONSENT RECORDS TABLE
-- ============================================================================
-- Stores granular consent records from widget interactions
CREATE TABLE IF NOT EXISTS dpdpa_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Widget association
  widget_id VARCHAR(100) NOT NULL,
  
  -- Visitor identification (anonymous tracking)
  visitor_id VARCHAR(255) NOT NULL,
  consent_id VARCHAR(255) NOT NULL UNIQUE,
  
  -- Consent details
  consent_status VARCHAR(50) NOT NULL CHECK (consent_status IN ('accepted', 'rejected', 'partial', 'revoked')),
  consented_activities UUID[] DEFAULT ARRAY[]::UUID[],
  rejected_activities UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Activity-specific consent details (JSONB for flexibility)
  consent_details JSONB DEFAULT '{}'::jsonb,
  
  -- Technical metadata
  user_agent TEXT,
  ip_address VARCHAR(45), -- IPv6 compatible
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  language VARCHAR(10),
  
  -- Location data (optional, for compliance reporting)
  country_code VARCHAR(3),
  region VARCHAR(100),
  
  -- Consent lifecycle
  consent_given_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  consent_expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  
  -- Privacy notice version tracking
  privacy_notice_version VARCHAR(50),
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_consent_activities CHECK (
    (consent_status = 'accepted' AND array_length(consented_activities, 1) > 0) OR
    (consent_status = 'rejected' AND array_length(rejected_activities, 1) > 0) OR
    (consent_status = 'partial' AND array_length(consented_activities, 1) > 0 AND array_length(rejected_activities, 1) > 0) OR
    (consent_status = 'revoked')
  )
);

-- Table comments
COMMENT ON TABLE dpdpa_consent_records IS 'Stores detailed consent records from DPDPA widget interactions';
COMMENT ON COLUMN dpdpa_consent_records.visitor_id IS 'Anonymous visitor identifier (UUID stored in cookie)';
COMMENT ON COLUMN dpdpa_consent_records.consent_id IS 'Unique consent transaction ID';
COMMENT ON COLUMN dpdpa_consent_records.consent_details IS 'Detailed consent data including specific purposes and data categories';
COMMENT ON COLUMN dpdpa_consent_records.consent_expires_at IS 'When consent expires and re-consent is required';

-- ============================================================================
-- SECTION 3: DPDPA GRIEVANCES / DATA SUBJECT RIGHTS REQUESTS TABLE
-- ============================================================================
-- Manages data subject rights requests (access, correction, erasure, etc.)
CREATE TABLE IF NOT EXISTS dpdpa_grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Association
  widget_id VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(255),
  
  -- Contact information
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Request details
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'access',           -- Right to access personal data
    'correction',       -- Right to correct inaccurate data
    'erasure',          -- Right to erasure (right to be forgotten)
    'withdrawal',       -- Right to withdraw consent
    'portability',      -- Right to data portability
    'grievance',        -- General grievance/complaint
    'other'
  )),
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected', 'escalated')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Response tracking (DPDPA requires response within 72 hours)
  response_due_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Internal tracking
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Compliance metadata
  compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'overdue', 'breached')),
  escalation_reason TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table comments
COMMENT ON TABLE dpdpa_grievances IS 'Manages data subject rights requests and grievances under DPDPA 2023';
COMMENT ON COLUMN dpdpa_grievances.request_type IS 'Type of DPDPA data subject right being exercised';
COMMENT ON COLUMN dpdpa_grievances.response_due_at IS 'DPDPA requires response within 72 hours of receipt';
COMMENT ON COLUMN dpdpa_grievances.compliance_status IS 'Tracks compliance with DPDPA response time requirements';

-- ============================================================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Widget Configs Indexes
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_user_id ON dpdpa_widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_widget_id ON dpdpa_widget_configs(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_domain ON dpdpa_widget_configs(domain);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_is_active ON dpdpa_widget_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_created_at ON dpdpa_widget_configs(created_at DESC);

-- Consent Records Indexes
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_id ON dpdpa_consent_records(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_id ON dpdpa_consent_records(visitor_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_id ON dpdpa_consent_records(consent_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_status ON dpdpa_consent_records(consent_status);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_created_at ON dpdpa_consent_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_given_at ON dpdpa_consent_records(consent_given_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_expires_at ON dpdpa_consent_records(consent_expires_at);

-- Composite index for widget + visitor lookups (common query pattern)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_visitor ON dpdpa_consent_records(widget_id, visitor_id);

-- GIN index for array searches (consented_activities, rejected_activities)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consented_activities ON dpdpa_consent_records USING GIN(consented_activities);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_rejected_activities ON dpdpa_consent_records USING GIN(rejected_activities);

-- Grievances Indexes
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_widget_id ON dpdpa_grievances(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_visitor_id ON dpdpa_grievances(visitor_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_email ON dpdpa_grievances(email);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_status ON dpdpa_grievances(status);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_request_type ON dpdpa_grievances(request_type);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_priority ON dpdpa_grievances(priority);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_compliance_status ON dpdpa_grievances(compliance_status);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_response_due_at ON dpdpa_grievances(response_due_at);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_created_at ON dpdpa_grievances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_assigned_to ON dpdpa_grievances(assigned_to);

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE dpdpa_widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdpa_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdpa_grievances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Widget Configs RLS Policies
-- ============================================================================

-- Users can read their own widget configs
CREATE POLICY "Users can read own widget configs"
  ON dpdpa_widget_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own widget configs
CREATE POLICY "Users can create own widget configs"
  ON dpdpa_widget_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own widget configs
CREATE POLICY "Users can update own widget configs"
  ON dpdpa_widget_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own widget configs
CREATE POLICY "Users can delete own widget configs"
  ON dpdpa_widget_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public API can read active widget configs (for public widget endpoint)
CREATE POLICY "Public API can read active widget configs"
  ON dpdpa_widget_configs FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================================
-- Consent Records RLS Policies
-- ============================================================================

-- Authenticated users can read consent records for their widgets
CREATE POLICY "Users can read consent records for their widgets"
  ON dpdpa_consent_records FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Anonymous users can create consent records (public widget)
CREATE POLICY "Allow public consent record creation"
  ON dpdpa_consent_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can update consent records for their widgets (for revocations, etc.)
CREATE POLICY "Users can update consent records for their widgets"
  ON dpdpa_consent_records FOR UPDATE
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Grievances RLS Policies
-- ============================================================================

-- Users can read grievances for their widgets
CREATE POLICY "Users can read grievances for their widgets"
  ON dpdpa_grievances FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Anonymous users can create grievances (public form submission)
CREATE POLICY "Allow public grievance creation"
  ON dpdpa_grievances FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can update grievances for their widgets
CREATE POLICY "Users can update grievances for their widgets"
  ON dpdpa_grievances FOR UPDATE
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 6: TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Apply updated_at trigger to widget configs
DROP TRIGGER IF EXISTS update_dpdpa_widget_configs_updated_at ON dpdpa_widget_configs;
CREATE TRIGGER update_dpdpa_widget_configs_updated_at
  BEFORE UPDATE ON dpdpa_widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to consent records
DROP TRIGGER IF EXISTS update_dpdpa_consent_records_updated_at ON dpdpa_consent_records;
CREATE TRIGGER update_dpdpa_consent_records_updated_at
  BEFORE UPDATE ON dpdpa_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to grievances
DROP TRIGGER IF EXISTS update_dpdpa_grievances_updated_at ON dpdpa_grievances;
CREATE TRIGGER update_dpdpa_grievances_updated_at
  BEFORE UPDATE ON dpdpa_grievances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: AUTO-CALCULATE RESPONSE DUE DATE FOR GRIEVANCES
-- ============================================================================

CREATE OR REPLACE FUNCTION set_grievance_response_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- DPDPA 2023 requires response within 72 hours (3 days)
  IF NEW.response_due_at IS NULL THEN
    NEW.response_due_at := NEW.created_at + INTERVAL '72 hours';
  END IF;
  
  -- Update compliance status based on response time
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NOT NULL THEN
    IF NEW.resolved_at <= NEW.response_due_at THEN
      NEW.compliance_status := 'compliant';
    ELSE
      NEW.compliance_status := 'breached';
    END IF;
  ELSIF NOW() > NEW.response_due_at AND NEW.status != 'resolved' THEN
    NEW.compliance_status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_grievance_response_due ON dpdpa_grievances;
CREATE TRIGGER set_grievance_response_due
  BEFORE INSERT OR UPDATE ON dpdpa_grievances
  FOR EACH ROW
  EXECUTE FUNCTION set_grievance_response_due_date();

-- ============================================================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================================================

-- Function to get widget statistics
CREATE OR REPLACE FUNCTION get_dpdpa_widget_stats(p_widget_id VARCHAR)
RETURNS TABLE (
  total_consents BIGINT,
  accepted_count BIGINT,
  rejected_count BIGINT,
  partial_count BIGINT,
  acceptance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_consents,
    COUNT(*) FILTER (WHERE consent_status = 'accepted') as accepted_count,
    COUNT(*) FILTER (WHERE consent_status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE consent_status = 'partial') as partial_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE consent_status = 'accepted')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as acceptance_rate
  FROM dpdpa_consent_records
  WHERE widget_id = p_widget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check overdue grievances
CREATE OR REPLACE FUNCTION get_overdue_grievances(p_widget_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  widget_id VARCHAR,
  email VARCHAR,
  request_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  response_due_at TIMESTAMP WITH TIME ZONE,
  hours_overdue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.widget_id,
    g.email,
    g.request_type,
    g.created_at,
    g.response_due_at,
    EXTRACT(EPOCH FROM (NOW() - g.response_due_at)) / 3600 as hours_overdue
  FROM dpdpa_grievances g
  WHERE 
    g.status != 'resolved' 
    AND g.response_due_at < NOW()
    AND (p_widget_id IS NULL OR g.widget_id = p_widget_id)
  ORDER BY g.response_due_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 9: DATA VALIDATION
-- ============================================================================

-- Ensure processing_activities table exists (should be created already)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'processing_activities') THEN
    RAISE NOTICE 'Warning: processing_activities table does not exist. Please create it first.';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (run these to verify migration success):
-- 
-- 1. Check all tables were created:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_name LIKE 'dpdpa_%' ORDER BY table_name;
--
-- 2. Check all indexes:
--    SELECT indexname FROM pg_indexes 
--    WHERE indexname LIKE 'idx_dpdpa_%' ORDER BY indexname;
--
-- 3. Check RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables 
--    WHERE tablename LIKE 'dpdpa_%';
--
-- 4. Check policies:
--    SELECT policyname, tablename FROM pg_policies 
--    WHERE tablename LIKE 'dpdpa_%' ORDER BY tablename, policyname;
--
-- 5. Test helper functions:
--    SELECT * FROM get_dpdpa_widget_stats('test_widget_id');
--    SELECT * FROM get_overdue_grievances();

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================
--
-- 1. BACKUPS: Ensure you have a backup before running this migration
-- 2. MONITORING: Monitor query performance after deployment
-- 3. INDEXES: May need additional indexes based on actual query patterns
-- 4. RETENTION: Consider implementing data retention policies
-- 5. ARCHIVAL: Plan for archiving old consent records (DPDPA compliance)
-- 6. GDPR: If operating in EU, ensure GDPR compliance alongside DPDPA
--
-- ============================================================================
