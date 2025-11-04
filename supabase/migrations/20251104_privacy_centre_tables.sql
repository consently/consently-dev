-- ============================================================================
-- Privacy Centre Database Schema Migration
-- Date: 2025-11-04
-- Description: Creates tables for Privacy Centre functionality including:
--   - visitor_consent_preferences (granular consent management)
--   - dpdp_rights_requests (DPDP Act rights request tracking)
--   - consent_history (audit trail for consent changes)
-- ============================================================================

-- ============================================================================
-- Table 1: visitor_consent_preferences
-- Purpose: Store individual visitor consent preferences by activity
-- ============================================================================

CREATE TABLE IF NOT EXISTS visitor_consent_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Visitor identification
  visitor_id TEXT NOT NULL, -- Generated on frontend, stored in localStorage
  visitor_email TEXT, -- Optional, provided by visitor
  visitor_email_hash TEXT, -- SHA-256 hash for privacy
  
  -- Widget and activity context
  widget_id TEXT NOT NULL,
  activity_id UUID NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_status TEXT NOT NULL CHECK (consent_status IN ('accepted', 'rejected', 'withdrawn')),
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet', 'Unknown')),
  language TEXT,
  
  -- Timestamps
  consent_given_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Based on widget consent_duration
  
  -- Versioning
  consent_version TEXT DEFAULT '1.0',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one preference per visitor per activity
  UNIQUE(visitor_id, widget_id, activity_id)
);

-- Indexes for visitor_consent_preferences
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_visitor_id 
  ON visitor_consent_preferences(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_widget_id 
  ON visitor_consent_preferences(widget_id);
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_activity_id 
  ON visitor_consent_preferences(activity_id);
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_visitor_widget 
  ON visitor_consent_preferences(visitor_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_email_hash 
  ON visitor_consent_preferences(visitor_email_hash) WHERE visitor_email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_status 
  ON visitor_consent_preferences(consent_status);
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_timestamp 
  ON visitor_consent_preferences(consent_given_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_visitor_consent_preferences_updated_at
  BEFORE UPDATE ON visitor_consent_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE visitor_consent_preferences IS 'Stores individual visitor consent preferences for each processing activity';
COMMENT ON COLUMN visitor_consent_preferences.visitor_id IS 'Unique identifier for visitor, stored in browser localStorage';
COMMENT ON COLUMN visitor_consent_preferences.consent_status IS 'Current consent status: accepted, rejected, or withdrawn';
COMMENT ON COLUMN visitor_consent_preferences.activity_id IS 'Processing activity this consent applies to';

-- ============================================================================
-- Table 2: dpdp_rights_requests
-- Purpose: Track DPDP Act 2023 data subject rights requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpdp_rights_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Visitor identification
  visitor_id TEXT NOT NULL,
  visitor_email TEXT NOT NULL, -- Required for rights requests
  visitor_email_hash TEXT NOT NULL, -- SHA-256 hash
  visitor_name TEXT,
  visitor_phone TEXT,
  
  -- Widget context
  widget_id TEXT NOT NULL,
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',           -- Right to Access (Section 11)
    'correction',       -- Right to Correction (Section 11)
    'erasure',          -- Right to Erasure/Deletion (Section 11)
    'grievance',        -- Right to Grievance Redressal (Section 14)
    'nomination'        -- Right to Nominate (Section 15)
  )),
  
  request_title TEXT NOT NULL,
  request_description TEXT NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Submitted, awaiting review
    'under_review',     -- Being processed by data fiduciary
    'in_progress',      -- Action being taken
    'completed',        -- Request fulfilled
    'rejected',         -- Request denied with reason
    'cancelled'         -- Cancelled by requester
  )),
  
  -- Response and resolution
  admin_notes TEXT,
  response_message TEXT,
  rejection_reason TEXT,
  
  -- Attachments (stored as JSON array of file URLs/paths)
  attachments JSONB DEFAULT '[]'::jsonb,
  response_attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_code TEXT, -- OTP for email verification
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  language TEXT DEFAULT 'en',
  
  -- SLA tracking (DPDP Act requires response within reasonable time)
  due_date TIMESTAMPTZ, -- Typically 30 days from submission
  completed_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who resolved
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dpdp_rights_requests
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_visitor_id 
  ON dpdp_rights_requests(visitor_id);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_widget_id 
  ON dpdp_rights_requests(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_email_hash 
  ON dpdp_rights_requests(visitor_email_hash);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_status 
  ON dpdp_rights_requests(status);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_request_type 
  ON dpdp_rights_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_created_at 
  ON dpdp_rights_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_verification_token 
  ON dpdp_rights_requests(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dpdp_rights_requests_due_date 
  ON dpdp_rights_requests(due_date) WHERE status NOT IN ('completed', 'rejected', 'cancelled');

-- Updated_at trigger
CREATE TRIGGER update_dpdp_rights_requests_updated_at
  BEFORE UPDATE ON dpdp_rights_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set due_date trigger (30 days from creation)
CREATE OR REPLACE FUNCTION set_dpdp_rights_request_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date IS NULL THEN
    NEW.due_date := NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dpdp_rights_request_due_date_trigger
  BEFORE INSERT ON dpdp_rights_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_dpdp_rights_request_due_date();

-- Comments
COMMENT ON TABLE dpdp_rights_requests IS 'Tracks DPDP Act 2023 data subject rights requests (access, correction, erasure, grievance, nomination)';
COMMENT ON COLUMN dpdp_rights_requests.request_type IS 'Type of DPDP Act right: access, correction, erasure, grievance, or nomination';
COMMENT ON COLUMN dpdp_rights_requests.status IS 'Request status: pending, under_review, in_progress, completed, rejected, or cancelled';
COMMENT ON COLUMN dpdp_rights_requests.due_date IS 'Expected response date (typically 30 days per DPDP Act)';

-- ============================================================================
-- Table 3: consent_history
-- Purpose: Audit trail for all consent changes (immutable log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Visitor and context
  visitor_id TEXT NOT NULL,
  widget_id TEXT NOT NULL,
  activity_id UUID NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  
  -- Change details
  previous_status TEXT CHECK (previous_status IN ('accepted', 'rejected', 'withdrawn', NULL)),
  new_status TEXT NOT NULL CHECK (new_status IN ('accepted', 'rejected', 'withdrawn')),
  
  -- Change reason and context
  change_reason TEXT, -- e.g., "User updated preferences", "Consent expired", "Initial consent"
  change_source TEXT DEFAULT 'privacy_centre' CHECK (change_source IN (
    'privacy_centre',   -- Changed via Privacy Centre
    'widget',           -- Changed via consent widget
    'admin',            -- Changed by admin (rare)
    'system'            -- System-triggered (e.g., expiration)
  )),
  
  -- Metadata at time of change
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  language TEXT,
  
  -- Versioning
  consent_version TEXT DEFAULT '1.0',
  
  -- Timestamp (immutable)
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consent_history
CREATE INDEX IF NOT EXISTS idx_consent_history_visitor_id 
  ON consent_history(visitor_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_widget_id 
  ON consent_history(widget_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_activity_id 
  ON consent_history(activity_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_visitor_widget 
  ON consent_history(visitor_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_changed_at 
  ON consent_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_history_new_status 
  ON consent_history(new_status);

-- Prevent updates/deletes (immutable audit log)
CREATE OR REPLACE FUNCTION prevent_consent_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'consent_history is immutable - modifications are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_consent_history_update
  BEFORE UPDATE ON consent_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_consent_history_modification();

CREATE TRIGGER prevent_consent_history_delete
  BEFORE DELETE ON consent_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_consent_history_modification();

-- Comments
COMMENT ON TABLE consent_history IS 'Immutable audit trail of all consent changes for compliance and transparency';
COMMENT ON COLUMN consent_history.change_source IS 'Source of change: privacy_centre, widget, admin, or system';
COMMENT ON COLUMN consent_history.previous_status IS 'Status before change (NULL for initial consent)';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE visitor_consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdp_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: visitor_consent_preferences
-- ============================================================================

-- Public can insert (when recording consent)
CREATE POLICY "Allow public to record consent preferences" 
  ON visitor_consent_preferences
  FOR INSERT WITH CHECK (true);

-- Public can update their own preferences (by visitor_id)
CREATE POLICY "Allow visitors to update own preferences" 
  ON visitor_consent_preferences
  FOR UPDATE USING (true);

-- Public can view their own preferences (by visitor_id - checked in app logic)
CREATE POLICY "Allow public to view consent preferences" 
  ON visitor_consent_preferences
  FOR SELECT USING (true);

-- Widget owners can view all preferences for their widgets
CREATE POLICY "Widget owners can view all preferences" 
  ON visitor_consent_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = visitor_consent_preferences.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies: dpdp_rights_requests
-- ============================================================================

-- Public can submit rights requests (no auth required)
CREATE POLICY "Allow public to submit rights requests" 
  ON dpdp_rights_requests
  FOR INSERT WITH CHECK (true);

-- Public can view their own requests (checked by visitor_id in app logic)
CREATE POLICY "Allow public to view own requests" 
  ON dpdp_rights_requests
  FOR SELECT USING (true);

-- Widget owners can view and manage requests for their widgets
CREATE POLICY "Widget owners can view requests" 
  ON dpdp_rights_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = dpdp_rights_requests.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Widget owners can update requests" 
  ON dpdp_rights_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = dpdp_rights_requests.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies: consent_history
-- ============================================================================

-- Public can insert history records (via app logic, not directly)
CREATE POLICY "Allow public to create history records" 
  ON consent_history
  FOR INSERT WITH CHECK (true);

-- Public can view their own history (checked by visitor_id in app logic)
CREATE POLICY "Allow public to view own history" 
  ON consent_history
  FOR SELECT USING (true);

-- Widget owners can view all history for their widgets
CREATE POLICY "Widget owners can view all history" 
  ON consent_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = consent_history.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to log consent changes automatically
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log on update (not insert)
  IF TG_OP = 'UPDATE' AND OLD.consent_status != NEW.consent_status THEN
    INSERT INTO consent_history (
      visitor_id,
      widget_id,
      activity_id,
      previous_status,
      new_status,
      change_reason,
      change_source,
      ip_address,
      user_agent,
      device_type,
      language,
      consent_version
    ) VALUES (
      NEW.visitor_id,
      NEW.widget_id,
      NEW.activity_id,
      OLD.consent_status,
      NEW.consent_status,
      'User updated preferences',
      'privacy_centre',
      NEW.ip_address,
      NEW.user_agent,
      NEW.device_type,
      NEW.language,
      NEW.consent_version
    );
  END IF;
  
  -- Log initial consent on insert
  IF TG_OP = 'INSERT' THEN
    INSERT INTO consent_history (
      visitor_id,
      widget_id,
      activity_id,
      previous_status,
      new_status,
      change_reason,
      change_source,
      ip_address,
      user_agent,
      device_type,
      language,
      consent_version
    ) VALUES (
      NEW.visitor_id,
      NEW.widget_id,
      NEW.activity_id,
      NULL,
      NEW.consent_status,
      'Initial consent',
      'widget',
      NEW.ip_address,
      NEW.user_agent,
      NEW.device_type,
      NEW.language,
      NEW.consent_version
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-log consent changes
CREATE TRIGGER auto_log_consent_changes
  AFTER INSERT OR UPDATE ON visitor_consent_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- ============================================================================
-- Seed Data: DPDP Act Rights Information
-- ============================================================================

-- This could be stored in a separate reference table if needed
COMMENT ON TABLE dpdp_rights_requests IS 
'DPDP Act 2023 Rights:
1. Right to Access (Section 11) - Obtain summary of personal data processing
2. Right to Correction (Section 11) - Correct inaccurate or misleading data
3. Right to Erasure (Section 11) - Request deletion of personal data
4. Right to Grievance Redressal (Section 14) - File complaints about data processing
5. Right to Nominate (Section 15) - Appoint representative for exercising rights';

-- ============================================================================
-- Migration Complete
-- ============================================================================
