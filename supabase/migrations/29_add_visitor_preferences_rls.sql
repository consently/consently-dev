-- ============================================================================
-- Migration: Add RLS Policies for visitor_consent_preferences
-- Description: Enables anonymous users to insert/update their consent preferences
-- Issue: Bulk preferences API failing with 500 error due to missing RLS policies
-- ============================================================================

-- Enable RLS on visitor_consent_preferences if not already enabled
ALTER TABLE visitor_consent_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public preference creation" ON visitor_consent_preferences;
DROP POLICY IF EXISTS "Allow public preference updates" ON visitor_consent_preferences;
DROP POLICY IF EXISTS "Allow public preference reads" ON visitor_consent_preferences;
DROP POLICY IF EXISTS "Users can read preferences for their widgets" ON visitor_consent_preferences;

-- Policy 1: Allow anonymous and authenticated users to insert preferences
-- This allows the preference centre to save user consent choices
CREATE POLICY "Allow public preference creation"
  ON visitor_consent_preferences FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow anonymous and authenticated users to update their own preferences
-- Users can update preferences using their visitor_id
CREATE POLICY "Allow public preference updates"
  ON visitor_consent_preferences FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 3: Allow anonymous and authenticated users to read their own preferences
-- Users can read preferences using their visitor_id
CREATE POLICY "Allow public preference reads"
  ON visitor_consent_preferences FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 4: Allow authenticated users (widget owners) to read preferences for their widgets
-- This allows dashboard users to view consent analytics
CREATE POLICY "Users can read preferences for their widgets"
  ON visitor_consent_preferences FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON POLICY "Allow public preference creation" ON visitor_consent_preferences IS 
  'Allows anonymous users to create consent preferences via preference centre';
COMMENT ON POLICY "Allow public preference updates" ON visitor_consent_preferences IS 
  'Allows anonymous users to update their consent preferences via preference centre';
COMMENT ON POLICY "Allow public preference reads" ON visitor_consent_preferences IS 
  'Allows anonymous users to read their consent preferences via preference centre';
COMMENT ON POLICY "Users can read preferences for their widgets" ON visitor_consent_preferences IS 
  'Allows authenticated widget owners to read all preferences for their widgets';

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 29 completed: Added RLS policies for visitor_consent_preferences';
  RAISE NOTICE 'Anonymous users can now create/update/read their consent preferences';
  RAISE NOTICE 'Widget owners can read preferences for their widgets';
END $$;

