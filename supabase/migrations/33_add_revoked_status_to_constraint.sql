-- Migration: Add 'revoked' status to dpdpa_consent_records constraint
-- Date: 2025-11-22
-- Description: Updates the consent_status CHECK constraint to include 'revoked' status

-- First, drop the existing constraint
ALTER TABLE dpdpa_consent_records 
  DROP CONSTRAINT IF EXISTS dpdpa_consent_records_consent_status_check;

-- Add the new constraint with 'revoked' included
ALTER TABLE dpdpa_consent_records 
  ADD CONSTRAINT dpdpa_consent_records_consent_status_check 
  CHECK (consent_status = ANY (ARRAY['accepted'::text, 'rejected'::text, 'partial'::text, 'revoked'::text]));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT dpdpa_consent_records_consent_status_check ON dpdpa_consent_records IS 
  'Ensures consent_status is one of: accepted, rejected, partial, or revoked';
