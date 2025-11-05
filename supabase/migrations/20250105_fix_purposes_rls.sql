-- Fix RLS policies for purposes table
-- This allows authenticated users to create custom purposes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to create custom purposes" ON purposes;

-- Recreate policies with correct permissions
CREATE POLICY "Allow authenticated users to read purposes"
  ON purposes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert custom purposes"
  ON purposes FOR INSERT
  TO authenticated
  WITH CHECK (is_predefined = false);

-- Also allow updating custom purposes (in case needed later)
CREATE POLICY "Allow authenticated users to update custom purposes"
  ON purposes FOR UPDATE
  TO authenticated
  USING (is_predefined = false)
  WITH CHECK (is_predefined = false);

-- Allow deleting custom purposes
CREATE POLICY "Allow authenticated users to delete custom purposes"
  ON purposes FOR DELETE
  TO authenticated
  USING (is_predefined = false);
