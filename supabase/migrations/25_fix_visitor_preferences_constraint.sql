-- ============================================================================
-- Migration: Fix Visitor Consent Preferences Unique Constraint
-- Description: Adds missing UNIQUE constraint for proper upsert functionality
-- Issue: Privacy center toggles not saving because upsert fails without constraint
-- ============================================================================

-- First, remove any duplicate rows that might exist
-- Keep only the most recent preference for each visitor/widget/activity combination
DELETE FROM visitor_consent_preferences a
USING visitor_consent_preferences b
WHERE a.id < b.id
  AND a.visitor_id = b.visitor_id
  AND a.widget_id = b.widget_id
  AND a.activity_id = b.activity_id;

-- Add the missing UNIQUE constraint
ALTER TABLE visitor_consent_preferences
ADD CONSTRAINT unique_visitor_widget_activity 
UNIQUE (visitor_id, widget_id, activity_id);

-- Add trigger to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_visitor_consent_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visitor_consent_preferences_timestamp 
ON visitor_consent_preferences;

CREATE TRIGGER trigger_update_visitor_consent_preferences_timestamp
BEFORE UPDATE ON visitor_consent_preferences
FOR EACH ROW
EXECUTE FUNCTION update_visitor_consent_preferences_timestamp();

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_visitor_widget_activity ON visitor_consent_preferences IS 
  'Ensures one preference record per visitor/widget/activity combination for proper upsert';

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 25 completed: Added unique constraint to visitor_consent_preferences';
  RAISE NOTICE 'Privacy center preference updates will now work correctly';
END $$;

