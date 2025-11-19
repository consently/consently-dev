-- ============================================================================
-- Migration: Add Optional Email Linking for Cross-Device Consent Management
-- Description: Adds optional visitor_email_hash field to consent records
--              for privacy-preserving cross-device consent management
-- ============================================================================

-- ============================================================================
-- PART 1: Add visitor_email_hash to consent tables
-- ============================================================================

-- Add visitor_email_hash to dpdpa_consent_records (optional)
ALTER TABLE dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64) NULL;

-- Add visitor_email_hash to visitor_consent_preferences (optional)
ALTER TABLE visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64) NULL;

-- ============================================================================
-- PART 2: Add indexes for email-based lookups
-- ============================================================================

-- Index for email-based consent lookups (when email provided)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_email_hash 
ON dpdpa_consent_records(visitor_email_hash)
WHERE visitor_email_hash IS NOT NULL;

-- Composite index for email + widget lookups
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_email_widget 
ON dpdpa_consent_records(visitor_email_hash, widget_id)
WHERE visitor_email_hash IS NOT NULL;

-- Index for visitor preferences by email
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_email_hash 
ON visitor_consent_preferences(visitor_email_hash)
WHERE visitor_email_hash IS NOT NULL;

-- Composite index for email + widget in preferences
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_email_widget 
ON visitor_consent_preferences(visitor_email_hash, widget_id)
WHERE visitor_email_hash IS NOT NULL;

-- ============================================================================
-- PART 3: Add helper function for email validation
-- ============================================================================

-- Function to validate email hash format (SHA-256 produces 64 hex characters)
CREATE OR REPLACE FUNCTION is_valid_email_hash(hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- SHA-256 hash is exactly 64 hexadecimal characters
  RETURN hash ~ '^[a-f0-9]{64}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 4: Add comments explaining the privacy-first approach
-- ============================================================================

COMMENT ON COLUMN dpdpa_consent_records.visitor_email_hash IS 
  'Optional SHA-256 hash of visitor email (lowercase, trimmed). Allows cross-device consent management when user voluntarily provides email. Never stores actual email address.';

COMMENT ON COLUMN visitor_consent_preferences.visitor_email_hash IS 
  'Optional SHA-256 hash of visitor email. Links consent preferences across devices when email provided voluntarily.';

-- ============================================================================
-- PART 5: Security & Privacy Notes
-- ============================================================================

-- This implementation follows privacy-first principles:
-- 1. Email linking is OPTIONAL - users must explicitly provide email
-- 2. Only stores SHA-256 hash - actual email never stored in consent records
-- 3. Email collection requires explicit consent/disclosure
-- 4. Allows anonymous consent via Consent ID (existing functionality)
-- 5. Enables cross-device revocation when email provided
-- 6. Compatible with GDPR, DPDPA, and other privacy regulations

-- Log migration completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 26 completed: Optional email linking added to consent system';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  (a) Remain anonymous using Consent ID only';
  RAISE NOTICE '  (b) Optionally link consents via email for cross-device management';
  RAISE NOTICE 'All email data is hashed (SHA-256) for privacy';
END $$;

