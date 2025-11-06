-- ============================================================================
-- FIX: Allow Public Access to Processing Activities for Widget Display
-- ============================================================================
-- 
-- Root Cause: RLS policies on processing_activities table were blocking
-- anonymous users from reading activities, even when those activities are
-- explicitly selected in active widget configurations.
--
-- Solution: Create an RLS policy that allows anonymous users to read
-- processing_activities that are referenced in active widget configs.
--
-- ============================================================================

-- First, ensure RLS is enabled on processing_activities
ALTER TABLE processing_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public API can read activities in active widgets" ON processing_activities;

-- Create policy to allow anonymous users to read activities that are:
-- 1. Active (is_active = true)
-- 2. Referenced in at least one active widget config's selected_activities array
CREATE POLICY "Public API can read activities in active widgets"
  ON processing_activities FOR SELECT
  TO anon
  USING (
    is_active = true 
    AND id = ANY(
      SELECT unnest(selected_activities)
      FROM dpdpa_widget_configs
      WHERE is_active = true
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Public API can read activities in active widgets" ON processing_activities 
IS 'Allows anonymous users (public widget API) to read processing activities that are explicitly selected in active widget configurations. This enables the widget to display activities to end users for consent collection.';

-- ============================================================================
-- Fix: Allow Public Access to Activity Purposes
-- ============================================================================

-- Ensure RLS is enabled on activity_purposes
ALTER TABLE activity_purposes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public API can read activity purposes for active widgets" ON activity_purposes;

-- Create policy to allow anonymous users to read activity_purposes for activities
-- that are referenced in active widget configs
CREATE POLICY "Public API can read activity purposes for active widgets"
  ON activity_purposes FOR SELECT
  TO anon
  USING (
    activity_id IN (
      SELECT id
      FROM processing_activities
      WHERE is_active = true 
        AND id = ANY(
          SELECT unnest(selected_activities)
          FROM dpdpa_widget_configs
          WHERE is_active = true
        )
    )
  );

COMMENT ON POLICY "Public API can read activity purposes for active widgets" ON activity_purposes 
IS 'Allows anonymous users to read activity_purposes for activities that are in active widget configs.';

-- ============================================================================
-- Fix: Allow Public Access to Purposes
-- ============================================================================

-- Ensure RLS is enabled on purposes
ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public API can read purposes for active widgets" ON purposes;

-- Create policy to allow anonymous users to read purposes that are referenced
-- in activity_purposes for activities in active widget configs
CREATE POLICY "Public API can read purposes for active widgets"
  ON purposes FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT DISTINCT purpose_id
      FROM activity_purposes
      WHERE activity_id IN (
        SELECT id
        FROM processing_activities
        WHERE is_active = true 
          AND id = ANY(
            SELECT unnest(selected_activities)
            FROM dpdpa_widget_configs
            WHERE is_active = true
          )
      )
    )
  );

COMMENT ON POLICY "Public API can read purposes for active widgets" ON purposes 
IS 'Allows anonymous users to read purposes that are used in activities displayed in active widgets.';

-- ============================================================================
-- Fix: Allow Public Access to Purpose Data Categories
-- ============================================================================

-- Ensure RLS is enabled on purpose_data_categories
ALTER TABLE purpose_data_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public API can read purpose data categories for active widgets" ON purpose_data_categories;

-- Create policy to allow anonymous users to read purpose_data_categories for
-- activity_purposes that are in activities referenced in active widget configs
CREATE POLICY "Public API can read purpose data categories for active widgets"
  ON purpose_data_categories FOR SELECT
  TO anon
  USING (
    activity_purpose_id IN (
      SELECT id
      FROM activity_purposes
      WHERE activity_id IN (
        SELECT id
        FROM processing_activities
        WHERE is_active = true 
          AND id = ANY(
            SELECT unnest(selected_activities)
            FROM dpdpa_widget_configs
            WHERE is_active = true
          )
      )
    )
  );

COMMENT ON POLICY "Public API can read purpose data categories for active widgets" ON purpose_data_categories 
IS 'Allows anonymous users to read data categories for purposes used in activities displayed in active widgets.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify all policies exist:
-- 
-- SELECT policyname, tablename, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('processing_activities', 'activity_purposes', 'purposes', 'purpose_data_categories')
--   AND roles = '{anon}'
-- ORDER BY tablename, policyname;
--
-- Expected result: 4 rows (one for each table) with role = '{anon}' and cmd = 'SELECT'
-- ============================================================================

