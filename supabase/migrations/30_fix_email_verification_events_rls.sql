-- Migration: Fix RLS policy for email_verification_events to allow anonymous inserts
-- Issue: API endpoint uses anonymous key but RLS only allows service_role
-- Solution: Allow anonymous users to insert events for tracking

-- Drop the existing insert policy
DROP POLICY IF EXISTS email_verification_events_insert_policy ON email_verification_events;

-- Create new policy that allows both anonymous and authenticated users to insert
-- This is needed because the API endpoint uses the anonymous key
CREATE POLICY email_verification_events_insert_policy ON email_verification_events
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY email_verification_events_insert_policy ON email_verification_events IS 
  'Allows anonymous and authenticated users to insert email verification events for tracking';

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 30 completed: Fixed RLS policy for email_verification_events';
  RAISE NOTICE 'Anonymous users can now insert events for email verification tracking';
END $$;

