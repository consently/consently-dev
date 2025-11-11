-- Migration: Add missing consent_details column to dpdpa_consent_records
-- This column was defined in 03_create_dpdpa_complete_schema.sql but may not exist
-- in databases that were created before that migration.
-- 
-- The consent_details column stores:
-- - Activity-specific consent details
-- - Purpose-level consent (activityPurposeConsents)
-- - Rule context (which display rule triggered the consent)
-- - Metadata (referrer, currentUrl, pageTitle, etc.)

-- Add consent_details column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consent_details'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN consent_details JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Added consent_details column to dpdpa_consent_records';
  ELSE
    RAISE NOTICE 'consent_details column already exists';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN dpdpa_consent_records.consent_details IS 'Detailed consent data including activity consents, purpose-level consent, rule context, and metadata';

-- Create GIN index for efficient JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_details 
ON dpdpa_consent_records USING GIN(consent_details);

COMMENT ON INDEX idx_dpdpa_consent_records_consent_details IS 'GIN index for efficient JSONB queries on consent_details';
