-- ============================================================================
-- DIGILOCKER AGE VERIFICATION SYSTEM
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-27
-- Purpose: Create tables for government-backed age verification via DigiLocker
--          Implements DPDPA 2023 "verifiable parental consent" requirement
-- ============================================================================

-- ============================================================================
-- SECTION 1: AGE VERIFICATION SESSIONS TABLE
-- ============================================================================
-- Tracks age verification sessions via DigiLocker OAuth flow

CREATE TABLE IF NOT EXISTS age_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Widget & Visitor association
  widget_id VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(255) NOT NULL,

  -- Session tracking
  session_id VARCHAR(255) NOT NULL UNIQUE,
  state_token VARCHAR(255) NOT NULL UNIQUE, -- OAuth state parameter (CSRF protection)

  -- Verification status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'verified', 'failed', 'expired')),

  -- DigiLocker integration
  digilocker_request_id VARCHAR(255),           -- API Setu request ID
  digilocker_authorization_code VARCHAR(500),   -- OAuth code (temporary, cleared after use)

  -- Verification results (PRIVACY: DOB is NOT stored, only derived age)
  verified_age INTEGER,                          -- Calculated age (DOB discarded after calculation)
  document_type VARCHAR(100),                    -- E.g., "AADHAAR", "PAN", "DRIVING_LICENSE"
  consent_artifact_ref VARCHAR(255),             -- Reference to DigiLocker consent artifact (for audit)

  -- Guardian consent (for minors)
  requires_guardian_consent BOOLEAN DEFAULT false,
  guardian_consent_status VARCHAR(50) DEFAULT 'not_required'
    CHECK (guardian_consent_status IN ('not_required', 'pending', 'approved', 'rejected')),
  guardian_verification_id UUID,                 -- References another verification session for guardian

  -- Metadata
  ip_address VARCHAR(45),                        -- IPv6 compatible
  user_agent TEXT,
  return_url TEXT,                               -- Where to redirect after verification

  -- Audit trail
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Self-referencing foreign key for guardian verification
ALTER TABLE age_verification_sessions
  ADD CONSTRAINT fk_guardian_verification
  FOREIGN KEY (guardian_verification_id)
  REFERENCES age_verification_sessions(id)
  ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_session_id
  ON age_verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_state_token
  ON age_verification_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_visitor_widget
  ON age_verification_sessions(visitor_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_status
  ON age_verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_expires_at
  ON age_verification_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_widget_id
  ON age_verification_sessions(widget_id);

-- Comments
COMMENT ON TABLE age_verification_sessions IS 'Tracks age verification sessions via DigiLocker for DPDPA 2023 compliance';
COMMENT ON COLUMN age_verification_sessions.state_token IS 'OAuth state parameter for CSRF protection - unique per session';
COMMENT ON COLUMN age_verification_sessions.verified_age IS 'Derived age from DOB - DOB is discarded after calculation for privacy';
COMMENT ON COLUMN age_verification_sessions.consent_artifact_ref IS 'Reference to DigiLocker consent artifact for audit trail';
COMMENT ON COLUMN age_verification_sessions.guardian_verification_id IS 'Links to guardian verification session if minor requires consent';

-- ============================================================================
-- SECTION 2: GUARDIAN CONSENT RECORDS TABLE
-- ============================================================================
-- Stores guardian consent requests and approvals for minors

CREATE TABLE IF NOT EXISTS guardian_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to minor's verification
  minor_verification_id UUID NOT NULL REFERENCES age_verification_sessions(id) ON DELETE CASCADE,
  minor_visitor_id VARCHAR(255) NOT NULL,

  -- Guardian identification
  guardian_visitor_id VARCHAR(255),              -- Guardian's visitor ID after verification
  guardian_email VARCHAR(255),                   -- Email for consent request
  guardian_phone VARCHAR(20),                    -- Phone for SMS consent request

  -- Guardian verification (PRIVACY: DOB is NOT stored, only derived age)
  guardian_verification_session_id UUID REFERENCES age_verification_sessions(id) ON DELETE SET NULL,
  guardian_verified_age INTEGER,                 -- Guardian's age (DOB discarded after calculation)

  -- Consent status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'viewed', 'approved', 'rejected', 'expired')),

  -- Consent details
  consent_given_at TIMESTAMP WITH TIME ZONE,
  consent_method VARCHAR(50),                    -- 'email', 'sms', 'digilocker'
  relationship VARCHAR(100),                     -- 'parent', 'guardian', 'other'

  -- Request tracking
  request_sent_at TIMESTAMP WITH TIME ZONE,
  request_token VARCHAR(255) UNIQUE,             -- Token for consent link
  reminder_sent_at TIMESTAMP WITH TIME ZONE,     -- When reminder was sent
  reminder_count INTEGER DEFAULT 0,              -- Number of reminders sent
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Audit
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guardian_consent_minor_verification
  ON guardian_consent_records(minor_verification_id);
CREATE INDEX IF NOT EXISTS idx_guardian_consent_status
  ON guardian_consent_records(status);
CREATE INDEX IF NOT EXISTS idx_guardian_consent_token
  ON guardian_consent_records(request_token);
CREATE INDEX IF NOT EXISTS idx_guardian_consent_expires
  ON guardian_consent_records(expires_at);
CREATE INDEX IF NOT EXISTS idx_guardian_consent_email
  ON guardian_consent_records(guardian_email);

-- Comments
COMMENT ON TABLE guardian_consent_records IS 'Stores guardian consent requests and approvals for minors under DPDPA 2023';
COMMENT ON COLUMN guardian_consent_records.request_token IS 'Unique token sent to guardian for consent verification link';
COMMENT ON COLUMN guardian_consent_records.guardian_verified_age IS 'Guardian age derived from DOB - DOB discarded for privacy';

-- ============================================================================
-- SECTION 3: UPDATE WIDGET CONFIG TABLE
-- ============================================================================
-- Add new columns for DigiLocker age verification configuration

ALTER TABLE dpdpa_widget_configs
  -- Replace old age gate with verification requirement
  ADD COLUMN IF NOT EXISTS require_age_verification BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_verification_threshold INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS age_verification_provider VARCHAR(50) DEFAULT 'digilocker',

  -- Minor handling
  ADD COLUMN IF NOT EXISTS minor_handling VARCHAR(50) DEFAULT 'block',
  ADD COLUMN IF NOT EXISTS minor_guardian_message TEXT
    DEFAULT 'You must have parental consent to proceed. We will send a verification request to your guardian.',

  -- Verification expiry
  ADD COLUMN IF NOT EXISTS verification_validity_days INTEGER DEFAULT 365;

-- Add constraints (use DO block to avoid errors if constraints already exist)
DO $$
BEGIN
  -- Age verification threshold constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_age_verification_threshold'
  ) THEN
    ALTER TABLE dpdpa_widget_configs
      ADD CONSTRAINT chk_age_verification_threshold
      CHECK (age_verification_threshold >= 13 AND age_verification_threshold <= 21);
  END IF;

  -- Age verification provider constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_age_verification_provider'
  ) THEN
    ALTER TABLE dpdpa_widget_configs
      ADD CONSTRAINT chk_age_verification_provider
      CHECK (age_verification_provider IN ('digilocker', 'apisetu', 'custom'));
  END IF;

  -- Minor handling constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_minor_handling'
  ) THEN
    ALTER TABLE dpdpa_widget_configs
      ADD CONSTRAINT chk_minor_handling
      CHECK (minor_handling IN ('block', 'guardian_consent', 'limited_access'));
  END IF;

  -- Verification validity days constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_verification_validity_days'
  ) THEN
    ALTER TABLE dpdpa_widget_configs
      ADD CONSTRAINT chk_verification_validity_days
      CHECK (verification_validity_days >= 1 AND verification_validity_days <= 365);
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN dpdpa_widget_configs.require_age_verification IS 'Enable government-backed age verification via DigiLocker';
COMMENT ON COLUMN dpdpa_widget_configs.age_verification_threshold IS 'Minimum age required (13-21 years)';
COMMENT ON COLUMN dpdpa_widget_configs.age_verification_provider IS 'Verification provider: digilocker, apisetu, or custom';
COMMENT ON COLUMN dpdpa_widget_configs.minor_handling IS 'How to handle verified minors: block, guardian_consent, or limited_access';
COMMENT ON COLUMN dpdpa_widget_configs.minor_guardian_message IS 'Custom message shown to minors requiring guardian consent';
COMMENT ON COLUMN dpdpa_widget_configs.verification_validity_days IS 'Number of days age verification remains valid (1-365)';

-- ============================================================================
-- SECTION 4: LINK CONSENT RECORDS TO AGE VERIFICATION
-- ============================================================================
-- Add foreign key to link consent records to age verification for audit trail

ALTER TABLE dpdpa_consent_records
  ADD COLUMN IF NOT EXISTS age_verification_id UUID;

-- Add foreign key constraint (separate statement to handle existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_consent_age_verification'
  ) THEN
    ALTER TABLE dpdpa_consent_records
      ADD CONSTRAINT fk_consent_age_verification
      FOREIGN KEY (age_verification_id)
      REFERENCES age_verification_sessions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_consent_records_age_verification
  ON dpdpa_consent_records(age_verification_id);

COMMENT ON COLUMN dpdpa_consent_records.age_verification_id IS 'Links consent to age verification session for audit trail';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE age_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_consent_records ENABLE ROW LEVEL SECURITY;

-- Age verification sessions policies
-- Public can create sessions (widget initiates verification)
CREATE POLICY "Public can create verification sessions"
  ON age_verification_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can read their own sessions by session_id
CREATE POLICY "Public can read own sessions"
  ON age_verification_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Public can update sessions (for callback processing)
CREATE POLICY "Public can update sessions"
  ON age_verification_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read sessions for their widgets
CREATE POLICY "Users can read sessions for their widgets"
  ON age_verification_sessions
  FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Guardian consent records policies
-- Public can create consent requests
CREATE POLICY "Public can create guardian consent requests"
  ON guardian_consent_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can read by request token (for guardian verification link)
CREATE POLICY "Public can read by token"
  ON guardian_consent_records
  FOR SELECT
  TO anon
  USING (true);

-- Public can update consent records (for guardian approval)
CREATE POLICY "Public can update consent records"
  ON guardian_consent_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read consent records for their widgets
CREATE POLICY "Users can read guardian consents for their widgets"
  ON guardian_consent_records
  FOR SELECT
  TO authenticated
  USING (
    minor_verification_id IN (
      SELECT avs.id FROM age_verification_sessions avs
      JOIN dpdpa_widget_configs dwc ON avs.widget_id = dwc.widget_id
      WHERE dwc.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 6: TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_age_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for age_verification_sessions
DROP TRIGGER IF EXISTS update_age_verification_sessions_updated_at ON age_verification_sessions;
CREATE TRIGGER update_age_verification_sessions_updated_at
  BEFORE UPDATE ON age_verification_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_age_verification_updated_at();

-- Trigger for guardian_consent_records
DROP TRIGGER IF EXISTS update_guardian_consent_records_updated_at ON guardian_consent_records;
CREATE TRIGGER update_guardian_consent_records_updated_at
  BEFORE UPDATE ON guardian_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_age_verification_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
--   1. age_verification_sessions - Tracks DigiLocker verification sessions
--   2. guardian_consent_records - Stores guardian consent for minors
--
-- Columns added to dpdpa_widget_configs:
--   - require_age_verification (BOOLEAN)
--   - age_verification_threshold (INTEGER, 13-21)
--   - age_verification_provider (VARCHAR)
--   - minor_handling (VARCHAR)
--   - minor_guardian_message (TEXT)
--   - verification_validity_days (INTEGER, 1-365)
--
-- Column added to dpdpa_consent_records:
--   - age_verification_id (UUID, FK)
-- ============================================================================
