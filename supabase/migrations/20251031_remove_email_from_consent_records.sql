-- Migration: Remove email fields from consent_records table
-- Date: 2025-10-31
-- Description: Drop visitor_email and tokenized_email columns from consent_records
--              as they are no longer needed for privacy compliance

-- Drop the email columns from consent_records table
ALTER TABLE consent_records 
  DROP COLUMN IF EXISTS visitor_email,
  DROP COLUMN IF EXISTS tokenized_email;

-- Add a comment to the table documenting this change
COMMENT ON TABLE consent_records IS 'Stores consent records without personal email information for enhanced privacy. Email fields removed on 2025-10-31.';
