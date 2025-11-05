-- ============================================================================
-- UNIFIED PURPOSES MIGRATION
-- ============================================================================
-- Date: 2025-01-05
-- Purpose: Create a clean, unified purposes system for DPDPA compliance
--
-- This migration creates a single purposes table that handles both:
-- 1. Predefined purposes (is_predefined = true)
-- 2. Custom purposes created by users (is_predefined = false)
-- ============================================================================

-- ============================================================================
-- Step 1: Create purposes table
-- ============================================================================
CREATE TABLE IF NOT EXISTS purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  purpose_name VARCHAR(255) NOT NULL UNIQUE,  -- Unique identifier (enforced)
  name VARCHAR(255) NOT NULL,                  -- Display name
  description TEXT,                            -- Detailed description
  
  -- Optional metadata fields (used for storing data sources/recipients in API)
  data_category VARCHAR(255),                  -- Optional: can store data sources
  retention_period VARCHAR(255),               -- Optional: can store data recipients
  
  -- Type flag
  is_predefined BOOLEAN DEFAULT false NOT NULL, -- false = custom, true = predefined
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- Step 2: Add column comments
-- ============================================================================
COMMENT ON TABLE purposes IS 'Unified purposes table for both predefined and custom purposes';
COMMENT ON COLUMN purposes.purpose_name IS 'Unique identifier name for the purpose (case-insensitive unique)';
COMMENT ON COLUMN purposes.name IS 'Display name shown in the UI';
COMMENT ON COLUMN purposes.description IS 'Detailed description of what this purpose is used for';
COMMENT ON COLUMN purposes.data_category IS 'Optional metadata field - can store data sources as CSV';
COMMENT ON COLUMN purposes.retention_period IS 'Optional metadata field - can store data recipients as CSV';
COMMENT ON COLUMN purposes.is_predefined IS 'TRUE for system-defined purposes, FALSE for user-created custom purposes';

-- ============================================================================
-- Step 3: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_purposes_purpose_name ON purposes(purpose_name);
CREATE INDEX IF NOT EXISTS idx_purposes_name ON purposes(name);
CREATE INDEX IF NOT EXISTS idx_purposes_is_predefined ON purposes(is_predefined);
CREATE INDEX IF NOT EXISTS idx_purposes_data_category ON purposes(data_category);
CREATE INDEX IF NOT EXISTS idx_purposes_created_at ON purposes(created_at DESC);

-- ============================================================================
-- Step 4: Enable Row Level Security
-- ============================================================================
ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 5: Create RLS Policies
-- ============================================================================

-- Policy 1: All authenticated users can read all purposes (predefined + custom)
CREATE POLICY "Allow authenticated users to read purposes"
  ON purposes FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Authenticated users can create ONLY custom purposes
CREATE POLICY "Allow authenticated users to create custom purposes"
  ON purposes FOR INSERT
  TO authenticated
  WITH CHECK (is_predefined = false);

-- Policy 3: Authenticated users can update ONLY their custom purposes
CREATE POLICY "Allow authenticated users to update custom purposes"
  ON purposes FOR UPDATE
  TO authenticated
  USING (is_predefined = false)
  WITH CHECK (is_predefined = false);

-- Policy 4: Authenticated users can delete ONLY their custom purposes
CREATE POLICY "Allow authenticated users to delete custom purposes"
  ON purposes FOR DELETE
  TO authenticated
  USING (is_predefined = false);

-- ============================================================================
-- Step 6: Insert predefined purposes
-- ============================================================================
-- These are the 10 standard purposes available to all users
-- Uses ON CONFLICT to safely run migration multiple times

INSERT INTO purposes (purpose_name, name, description, is_predefined)
VALUES
  (
    'Marketing and Advertising',
    'Marketing and Advertising',
    'Use of personal data for promotional campaigns, targeted advertising, and marketing communications',
    true
  ),
  (
    'Analytics and Research',
    'Analytics and Research',
    'Analysis of user behavior, usage patterns, and data for research purposes to improve services',
    true
  ),
  (
    'Customer Support',
    'Customer Support',
    'Providing customer service, technical support, and responding to user inquiries',
    true
  ),
  (
    'Transaction Processing',
    'Transaction Processing',
    'Processing payments, managing financial transactions, and order fulfillment',
    true
  ),
  (
    'Account Management',
    'Account Management',
    'Managing user accounts, authentication, user profiles, and account settings',
    true
  ),
  (
    'Legal Compliance',
    'Legal Compliance',
    'Meeting legal and regulatory obligations, including tax, audit, and compliance requirements',
    true
  ),
  (
    'Security and Fraud Prevention',
    'Security and Fraud Prevention',
    'Protecting systems, detecting and preventing fraudulent activities, and ensuring platform security',
    true
  ),
  (
    'Product Improvement',
    'Product Improvement',
    'Enhancing and developing products, services, and user experience',
    true
  ),
  (
    'Communication',
    'Communication',
    'Sending notifications, updates, newsletters, and other communications to users',
    true
  ),
  (
    'Personalization',
    'Personalization',
    'Customizing user experience based on preferences, behavior, and user settings',
    true
  )
ON CONFLICT (purpose_name) DO UPDATE SET
  description = EXCLUDED.description,
  name = EXCLUDED.name,
  updated_at = timezone('utc'::text, now());

-- ============================================================================
-- Step 7: Create updated_at trigger
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to purposes table
DROP TRIGGER IF EXISTS update_purposes_updated_at ON purposes;
CREATE TRIGGER update_purposes_updated_at
  BEFORE UPDATE ON purposes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- To verify the migration was successful, run:
-- 
-- SELECT 
--   COUNT(*) as total_purposes,
--   COUNT(*) FILTER (WHERE is_predefined = true) as predefined_count,
--   COUNT(*) FILTER (WHERE is_predefined = false) as custom_count
-- FROM purposes;
-- 
-- Expected result:
-- - total_purposes: 10 (or more if custom purposes exist)
-- - predefined_count: 10
-- - custom_count: 0 (or more if users created custom purposes)
-- ============================================================================

