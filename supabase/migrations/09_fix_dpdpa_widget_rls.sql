-- ============================================================================
-- FIX: DPDPA Widget RLS Policy for Anonymous Access
-- ============================================================================
-- Issue: Anonymous users cannot fetch widget configs via /api/dpdpa/widget-public
-- Root Cause: RLS policy not properly allowing anon role to read active widgets
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public API can read active widget configs" ON dpdpa_widget_configs;

-- Recreate the policy with explicit permissions
CREATE POLICY "Public API can read active widget configs"
  ON dpdpa_widget_configs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Verify RLS is enabled
ALTER TABLE dpdpa_widget_configs ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON POLICY "Public API can read active widget configs" ON dpdpa_widget_configs 
IS 'Allows anonymous and authenticated users to read active widget configurations for public widget endpoint';

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this query to verify the policy exists:
-- SELECT * FROM pg_policies WHERE tablename = 'dpdpa_widget_configs';
--
-- Test anonymous access:
-- SELECT * FROM dpdpa_widget_configs WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak' AND is_active = true;
