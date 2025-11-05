-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS FOR PURPOSES SYSTEM
-- ============================================================================
-- Date: 2025-01-05
-- Purpose: Add missing foreign key relationships to fix the API query issue
--
-- This migration adds proper foreign key constraints to link:
-- 1. activity_purposes -> purposes
-- 2. purpose_data_categories -> activity_purposes
--
-- ISSUE: The API was failing with "Could not find a relationship between
-- 'activity_purposes' and 'purposes' in the schema cache" because the
-- foreign key constraint was missing.
-- ============================================================================

-- ============================================================================
-- Step 1: Clean up orphaned data in activity_purposes
-- ============================================================================
-- First, identify and remove any activity_purposes records that reference 
-- non-existent purposes
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Delete activity_purposes with invalid purpose_id
  WITH deleted AS (
    DELETE FROM activity_purposes ap
    WHERE NOT EXISTS (
      SELECT 1 FROM purposes p WHERE p.id = ap.purpose_id
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO orphaned_count FROM deleted;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Cleaned up % orphaned activity_purposes records', orphaned_count;
  ELSE
    RAISE NOTICE 'No orphaned activity_purposes records found';
  END IF;
END $$;

-- ============================================================================
-- Step 2: Add Foreign Key from activity_purposes to purposes
-- ============================================================================
DO $$ 
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_purposes_purpose_id_fkey'
      AND table_name = 'activity_purposes'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE activity_purposes
      ADD CONSTRAINT activity_purposes_purpose_id_fkey
      FOREIGN KEY (purpose_id)
      REFERENCES purposes(id)
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint: activity_purposes -> purposes';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: activity_purposes -> purposes';
  END IF;
END $$;

-- ============================================================================
-- Step 3: Clean up orphaned data in purpose_data_categories
-- ============================================================================
-- Remove any purpose_data_categories records that reference non-existent 
-- activity_purposes
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Delete purpose_data_categories with invalid activity_purpose_id
  WITH deleted AS (
    DELETE FROM purpose_data_categories pdc
    WHERE NOT EXISTS (
      SELECT 1 FROM activity_purposes ap WHERE ap.id = pdc.activity_purpose_id
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO orphaned_count FROM deleted;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Cleaned up % orphaned purpose_data_categories records', orphaned_count;
  ELSE
    RAISE NOTICE 'No orphaned purpose_data_categories records found';
  END IF;
END $$;

-- ============================================================================
-- Step 4: Add Foreign Key from purpose_data_categories to activity_purposes
-- ============================================================================
DO $$ 
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'purpose_data_categories_activity_purpose_id_fkey'
      AND table_name = 'purpose_data_categories'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE purpose_data_categories
      ADD CONSTRAINT purpose_data_categories_activity_purpose_id_fkey
      FOREIGN KEY (activity_purpose_id)
      REFERENCES activity_purposes(id)
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint: purpose_data_categories -> activity_purposes';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: purpose_data_categories -> activity_purposes';
  END IF;
END $$;

-- ============================================================================
-- Step 5: Clean up orphaned activity_purposes with invalid activity_id
-- ============================================================================
-- Remove any activity_purposes records that reference non-existent 
-- processing_activities
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Delete activity_purposes with invalid activity_id
  WITH deleted AS (
    DELETE FROM activity_purposes ap
    WHERE NOT EXISTS (
      SELECT 1 FROM processing_activities pa WHERE pa.id = ap.activity_id
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO orphaned_count FROM deleted;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Cleaned up % orphaned activity_purposes records (invalid activity_id)', orphaned_count;
  ELSE
    RAISE NOTICE 'No orphaned activity_purposes records found (invalid activity_id)';
  END IF;
END $$;

-- ============================================================================
-- Step 6: Add Foreign Key from activity_purposes to processing_activities
-- ============================================================================
DO $$ 
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_purposes_activity_id_fkey'
      AND table_name = 'activity_purposes'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE activity_purposes
      ADD CONSTRAINT activity_purposes_activity_id_fkey
      FOREIGN KEY (activity_id)
      REFERENCES processing_activities(id)
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint: activity_purposes -> processing_activities';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: activity_purposes -> processing_activities';
  END IF;
END $$;

-- ============================================================================
-- Step 7: Verify Foreign Keys
-- ============================================================================
-- You can verify the foreign keys were created by running:
-- 
-- SELECT
--   tc.table_name, 
--   tc.constraint_name, 
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name IN ('activity_purposes', 'purpose_data_categories')
--   AND tc.constraint_type = 'FOREIGN KEY';
-- 
-- Expected output:
-- - activity_purposes.purpose_id -> purposes.id
-- - activity_purposes.activity_id -> processing_activities.id
-- - purpose_data_categories.activity_purpose_id -> activity_purposes.id
-- ============================================================================

-- ============================================================================
-- Step 8: Refresh Supabase Schema Cache
-- ============================================================================
-- After running this migration, you may need to refresh the Supabase schema
-- cache for PostgREST to recognize the new relationships:
-- 
-- In Supabase Dashboard:
-- 1. Go to Settings > Database
-- 2. Click "Reload schema cache" or restart the PostgREST service
-- 
-- Or use SQL:
-- NOTIFY pgrst, 'reload schema';
-- ============================================================================

-- Send notification to reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Migration Complete
-- ============================================================================

