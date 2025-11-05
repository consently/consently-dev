-- ============================================================================
-- ROLLBACK MIGRATION: Clean up old purposes implementation
-- ============================================================================
-- Date: 2025-01-05
-- Purpose: Remove old purposes table and start fresh
-- 
-- IMPORTANT: Only run this if you need to reset the purposes table.
-- This will delete all custom purposes created by users!
-- ============================================================================

-- Step 1: Drop all RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to delete custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to update custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to insert custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to create custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to read purposes" ON purposes;

-- Step 2: Drop all indexes
DROP INDEX IF EXISTS idx_purposes_is_predefined;
DROP INDEX IF EXISTS idx_purposes_purpose_name;
DROP INDEX IF EXISTS idx_purposes_data_category;
DROP INDEX IF EXISTS idx_purposes_name;

-- Step 3: Drop the purposes table
-- WARNING: This will cascade delete all references in activity_purposes
DROP TABLE IF EXISTS purposes CASCADE;

-- Step 4: Verify cleanup
-- Run this after migration to ensure clean state:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE '%purpose%';

