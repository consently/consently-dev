-- ============================================================================
-- Migration: Add Visitor Email for Admin Dashboard Identification
-- Description: Adds optional visitor_email field to consent records
--              to identify verified users in the admin dashboard.
-- ============================================================================

-- Add visitor_email to dpdpa_consent_records
ALTER TABLE dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email TEXT NULL;

-- Add visitor_email to visitor_consent_preferences
ALTER TABLE visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email TEXT NULL;

-- Add comments
COMMENT ON COLUMN dpdpa_consent_records.visitor_email IS 
  'Optional verified email of the visitor. Used to identify users in the admin dashboard.';

COMMENT ON COLUMN visitor_consent_preferences.visitor_email IS 
  'Optional verified email of the visitor. Used to identify users in the admin dashboard.';
