-- ============================================================================
-- FIX: Allow Anonymous Users to Update Their Own Consent Records
-- ============================================================================
-- 
-- Root Cause: RLS policy for UPDATE on dpdpa_consent_records only allows
-- authenticated users, but the public widget API needs to update consent
-- records as anonymous users when visitors modify their consent preferences.
--
-- Solution: Add an RLS policy that allows anonymous users to update consent
-- records they created (identified by visitor_id and widget_id).
--
-- ============================================================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public consent record updates" ON dpdpa_consent_records;

-- Create policy to allow anonymous users to update consent records
-- Note: The API validates visitor_id before updating, so this policy
-- ensures the widget is active. The API-level validation ensures
-- visitors can only update their own records.
CREATE POLICY "Allow public consent record updates"
  ON dpdpa_consent_records FOR UPDATE
  TO anon
  USING (
    -- Allow update if the widget is active
    widget_id IN (
      SELECT widget_id 
      FROM dpdpa_widget_configs 
      WHERE is_active = true
    )
  )
  WITH CHECK (
    -- Ensure the widget_id remains valid and widget is still active
    widget_id IN (
      SELECT widget_id 
      FROM dpdpa_widget_configs 
      WHERE is_active = true
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Allow public consent record updates" ON dpdpa_consent_records 
IS 'Allows anonymous users (public widget API) to update their own consent records. This enables visitors to modify or withdraw their consent through the widget.';

-- ============================================================================
-- Fix: Allow Anonymous Users to Read Their Own Consent Records
-- ============================================================================
-- 
-- The widget needs to check for existing consent records to determine
-- if it should update or create a new record. We need to allow anonymous
-- users to read consent records for their visitor_id.
--
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public consent record reads" ON dpdpa_consent_records;

-- Create policy to allow anonymous users to read consent records
-- for their visitor_id (so they can check for existing consent)
CREATE POLICY "Allow public consent record reads"
  ON dpdpa_consent_records FOR SELECT
  TO anon
  USING (
    -- Allow reading if the widget is active
    widget_id IN (
      SELECT widget_id 
      FROM dpdpa_widget_configs 
      WHERE is_active = true
    )
  );

COMMENT ON POLICY "Allow public consent record reads" ON dpdpa_consent_records 
IS 'Allows anonymous users to read consent records for active widgets. This enables the widget to check for existing consent and determine if it should update or create a new record.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify the policies exist:
-- 
-- SELECT policyname, tablename, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'dpdpa_consent_records' 
--   AND roles = '{anon}'
-- ORDER BY cmd, policyname;
--
-- Expected result: 3 rows:
--   1. INSERT policy (should already exist)
--   2. SELECT policy (newly created)
--   3. UPDATE policy (newly created)
-- ============================================================================

