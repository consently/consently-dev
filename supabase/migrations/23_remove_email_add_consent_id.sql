-- ============================================================================
-- Migration: Remove Email Infrastructure & Implement Consent ID System
-- Description: Removes email-based cross-device sync and implements 
--              user-visible Consent ID system for privacy-first consent management
-- ============================================================================

-- ============================================================================
-- PART 1: Remove Email-Related Infrastructure
-- ============================================================================

-- Drop visitor_principal_links table (no longer needed)
DROP TABLE IF EXISTS visitor_principal_links CASCADE;

-- Remove email-related columns from dpdpa_consent_records
ALTER TABLE dpdpa_consent_records 
  DROP COLUMN IF EXISTS principal_id,
  DROP COLUMN IF EXISTS visitor_email,
  DROP COLUMN IF EXISTS visitor_email_hash;

-- Remove email-related columns from visitor_consent_preferences
ALTER TABLE visitor_consent_preferences 
  DROP COLUMN IF EXISTS visitor_email,
  DROP COLUMN IF EXISTS visitor_email_hash;

-- Drop email-related indexes from dpdpa_consent_records (if they exist)
DROP INDEX IF EXISTS idx_dpdpa_consent_records_principal_id;
DROP INDEX IF EXISTS idx_dpdpa_consent_records_visitor_principal;

-- ============================================================================
-- PART 2: Optimize for Consent ID System
-- ============================================================================

-- visitor_id will now store user-visible Consent IDs
-- Format: CNST-XXXX-XXXX-XXXX (e.g., CNST-4F7A-2K9E-8P3L)

-- Ensure visitor_id index exists for fast lookups
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_widget 
ON dpdpa_consent_records(visitor_id, widget_id);

-- Add index for consent_id lookups (for verification)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_id 
ON dpdpa_consent_records(consent_id);

-- Optimize visitor_consent_preferences for Consent ID lookups
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_visitor_widget 
ON visitor_consent_preferences(visitor_id, widget_id);

-- ============================================================================
-- PART 3: Add Helper Functions (Optional)
-- ============================================================================

-- Function to validate Consent ID format
CREATE OR REPLACE FUNCTION is_valid_consent_id(consent_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check format: CNST-XXXX-XXXX-XXXX
  -- Where X is A-Z or 2-9 (no ambiguous characters)
  RETURN consent_id ~ '^CNST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment explaining the new system
COMMENT ON COLUMN dpdpa_consent_records.visitor_id IS 
  'User-visible Consent ID for cross-device sync (Format: CNST-XXXX-XXXX-XXXX). This ID is shown to users and can be used to retrieve consent preferences on any device.';

COMMENT ON COLUMN visitor_consent_preferences.visitor_id IS 
  'User-visible Consent ID matching dpdpa_consent_records.visitor_id';

-- ============================================================================
-- PART 4: Data Migration (if needed)
-- ============================================================================

-- Note: Existing visitor_ids (format: vis_xxxxx) will continue to work
-- New consents will use the new CNST-XXXX-XXXX-XXXX format
-- This ensures backward compatibility during transition

-- Log migration completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 23 completed: Email infrastructure removed, Consent ID system ready';
  RAISE NOTICE 'Old visitor_ids (vis_xxx format) will continue to work';
  RAISE NOTICE 'New consents will use CNST-XXXX-XXXX-XXXX format';
END $$;

