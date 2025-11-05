-- Migration: Add name, description, data_category, and retention_period to purposes table
-- Date: 2025-01-05
-- Purpose: Extend purposes table to support additional metadata for DPDPA compliance

-- Add new columns to purposes table if they don't exist
ALTER TABLE purposes 
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS data_category VARCHAR(255),
  ADD COLUMN IF NOT EXISTS retention_period VARCHAR(255);

-- Update existing records to have a name (use purpose_name as fallback)
UPDATE purposes
SET name = purpose_name
WHERE name IS NULL;

-- Add comment to clarify column usage
COMMENT ON COLUMN purposes.name IS 'Display name for the purpose';
COMMENT ON COLUMN purposes.description IS 'Detailed description of the purpose';
COMMENT ON COLUMN purposes.data_category IS 'Category of data processed for this purpose';
COMMENT ON COLUMN purposes.retention_period IS 'How long data is retained for this purpose';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purposes_name ON purposes(name);
CREATE INDEX IF NOT EXISTS idx_purposes_data_category ON purposes(data_category);
