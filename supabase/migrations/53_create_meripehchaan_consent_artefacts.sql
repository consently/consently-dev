-- ============================================================================
-- MERIPEHCHAAN CONSENT ARTEFACTS
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-31
-- Purpose: Store consent artefact postbacks from MeriPehchaan consent service
--          Part of MeriPehchaan-based age verification for DPDPA 2023 compliance
--
-- Consent Partner Config (API Setu):
--   Client ID: UK0F7C1979
--   Postback URL: https://www.consently.in/api/meri-pehchaan/consent/postback
--   Token Auth: Static JWKS (RS256)
--   Consent Validity: 1 day
-- ============================================================================

-- ============================================================================
-- SECTION 1: CONSENT ARTEFACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meripehchaan_consent_artefacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Consent identification
  acknowledgement_id VARCHAR(500) NOT NULL UNIQUE,  -- MeriPehchaan acknowledgement/consent ID
  subject_id VARCHAR(500) NOT NULL,                  -- MeriPehchaan user/subject identifier

  -- Consent status
  status VARCHAR(50) NOT NULL DEFAULT 'granted'
    CHECK (status IN ('granted', 'denied', 'revoked', 'expired')),

  -- Consent timing
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,  -- When consent was actioned by user
  valid_until TIMESTAMP WITH TIME ZONE,                  -- Consent validity expiry

  -- Consent scope and data categories
  scopes TEXT[],                -- Array of scopes (e.g., 'age_verification')
  data_categories TEXT[],       -- Array of data categories (e.g., 'age_band')

  -- Raw artefact for audit (SECURITY: JWT is stored for non-repudiation)
  raw_jwt TEXT NOT NULL,        -- Complete signed JWT for verification replay
  claims JSONB NOT NULL,        -- Decoded JWT claims for queryability

  -- Link to age verification session (if applicable)
  age_verification_session_id UUID REFERENCES age_verification_sessions(id) ON DELETE SET NULL,

  -- Request metadata
  ip_address VARCHAR(45),       -- IPv6 compatible
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 2: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mp_consent_acknowledgement_id
  ON meripehchaan_consent_artefacts(acknowledgement_id);

CREATE INDEX IF NOT EXISTS idx_mp_consent_subject_id
  ON meripehchaan_consent_artefacts(subject_id);

CREATE INDEX IF NOT EXISTS idx_mp_consent_status
  ON meripehchaan_consent_artefacts(status);

CREATE INDEX IF NOT EXISTS idx_mp_consent_timestamp
  ON meripehchaan_consent_artefacts(consent_timestamp);

CREATE INDEX IF NOT EXISTS idx_mp_consent_valid_until
  ON meripehchaan_consent_artefacts(valid_until)
  WHERE valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mp_consent_age_verification
  ON meripehchaan_consent_artefacts(age_verification_session_id)
  WHERE age_verification_session_id IS NOT NULL;

-- GIN index on claims JSONB for flexible querying
CREATE INDEX IF NOT EXISTS idx_mp_consent_claims
  ON meripehchaan_consent_artefacts USING gin(claims);

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE meripehchaan_consent_artefacts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (postback handler runs with service role)
-- No anon insert — postbacks are server-to-server via service role client

-- Authenticated users can read artefacts linked to their widgets
CREATE POLICY "Users can read consent artefacts for their widgets"
  ON meripehchaan_consent_artefacts
  FOR SELECT
  TO authenticated
  USING (
    age_verification_session_id IN (
      SELECT avs.id FROM age_verification_sessions avs
      JOIN dpdpa_widget_configs dwc ON avs.widget_id = dwc.widget_id
      WHERE dwc.user_id = auth.uid()
    )
  );

-- Service role bypasses RLS, so the postback handler (which uses service role)
-- can insert/update without explicit anon policies.

-- ============================================================================
-- SECTION 4: AUTO-UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mp_consent_artefacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mp_consent_artefacts_updated_at ON meripehchaan_consent_artefacts;
CREATE TRIGGER update_mp_consent_artefacts_updated_at
  BEFORE UPDATE ON meripehchaan_consent_artefacts
  FOR EACH ROW
  EXECUTE FUNCTION update_mp_consent_artefacts_updated_at();

-- ============================================================================
-- SECTION 5: COMMENTS
-- ============================================================================

COMMENT ON TABLE meripehchaan_consent_artefacts IS
  'Stores consent artefact JWTs received from MeriPehchaan consent postback service. Part of DPDPA 2023 age verification compliance.';

COMMENT ON COLUMN meripehchaan_consent_artefacts.acknowledgement_id IS
  'Unique consent acknowledgement ID from MeriPehchaan. Used for idempotent processing and cross-referencing.';

COMMENT ON COLUMN meripehchaan_consent_artefacts.subject_id IS
  'MeriPehchaan user/subject identifier. Not the same as Consently visitor_id.';

COMMENT ON COLUMN meripehchaan_consent_artefacts.raw_jwt IS
  'Complete signed JWT stored for non-repudiation and audit replay.';

COMMENT ON COLUMN meripehchaan_consent_artefacts.claims IS
  'Decoded JWT claims stored as JSONB for queryability without re-parsing JWT.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Table created: meripehchaan_consent_artefacts
-- Stores consent postback artefacts with:
--   - Idempotent processing via unique acknowledgement_id
--   - Full JWT stored for non-repudiation audit
--   - JSONB claims for flexible querying
--   - Link to age_verification_sessions for traceability
--   - RLS: authenticated users can read artefacts for their widgets
--   - Service role: full access for postback handler
-- ============================================================================
