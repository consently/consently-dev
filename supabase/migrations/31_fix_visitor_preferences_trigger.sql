-- ============================================================================
-- Migration: Fix Visitor Consent Preferences Triggers
-- Description: Drops incorrect triggers that reference non-existent 'updated_at' column
--              and ensures correct 'last_updated' trigger is in place.
-- Issue: Preference updates fail with 'record "new" has no field "updated_at"'
-- ============================================================================

-- 1. Drop potential incorrect triggers that might be causing the error
DROP TRIGGER IF EXISTS update_visitor_consent_preferences_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS set_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS handle_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS update_updated_at_column ON visitor_consent_preferences;

-- 2. Ensure the correct function exists (from migration 25)
CREATE OR REPLACE FUNCTION update_visitor_consent_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure the correct trigger exists (from migration 25)
DROP TRIGGER IF EXISTS trigger_update_visitor_consent_preferences_timestamp 
ON visitor_consent_preferences;

CREATE TRIGGER trigger_update_visitor_consent_preferences_timestamp
BEFORE UPDATE ON visitor_consent_preferences
FOR EACH ROW
EXECUTE FUNCTION update_visitor_consent_preferences_timestamp();

-- 4. Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 31 completed: Fixed visitor_consent_preferences triggers';
END $$;
