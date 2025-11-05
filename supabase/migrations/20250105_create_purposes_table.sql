-- Migration: Create purposes table if it doesn't exist
-- Date: 2025-01-05
-- Purpose: Ensure purposes table exists with all required fields for DPDPA compliance

-- Create purposes table if it doesn't exist
CREATE TABLE IF NOT EXISTS purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  name VARCHAR(255),
  data_category VARCHAR(255),
  retention_period VARCHAR(255),
  is_predefined BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update existing records to have a name (use purpose_name as fallback)
UPDATE purposes
SET name = purpose_name
WHERE name IS NULL;

-- Add comments to clarify column usage
COMMENT ON COLUMN purposes.purpose_name IS 'Unique identifier name for the purpose';
COMMENT ON COLUMN purposes.name IS 'Display name for the purpose';
COMMENT ON COLUMN purposes.description IS 'Detailed description of the purpose';
COMMENT ON COLUMN purposes.data_category IS 'Category of data processed for this purpose';
COMMENT ON COLUMN purposes.retention_period IS 'How long data is retained for this purpose';
COMMENT ON COLUMN purposes.is_predefined IS 'Whether this is a predefined purpose or custom';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purposes_name ON purposes(name);
CREATE INDEX IF NOT EXISTS idx_purposes_data_category ON purposes(data_category);
CREATE INDEX IF NOT EXISTS idx_purposes_purpose_name ON purposes(purpose_name);
CREATE INDEX IF NOT EXISTS idx_purposes_is_predefined ON purposes(is_predefined);

-- Add RLS policies
ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read purposes
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read purposes"
  ON purposes FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create custom purposes
CREATE POLICY IF NOT EXISTS "Allow authenticated users to create custom purposes"
  ON purposes FOR INSERT
  TO authenticated
  WITH CHECK (is_predefined = false);

-- Insert predefined purposes if they don't exist
INSERT INTO purposes (purpose_name, name, description, is_predefined)
VALUES
  ('Marketing and Advertising', 'Marketing and Advertising', 'Use of personal data for promotional campaigns and targeted advertising', true),
  ('Analytics and Research', 'Analytics and Research', 'Analysis of user behavior and data for research purposes', true),
  ('Customer Support', 'Customer Support', 'Providing customer service and technical support', true),
  ('Transaction Processing', 'Transaction Processing', 'Processing payments and managing financial transactions', true),
  ('Account Management', 'Account Management', 'Managing user accounts and authentication', true),
  ('Legal Compliance', 'Legal Compliance', 'Meeting legal and regulatory obligations', true),
  ('Security and Fraud Prevention', 'Security and Fraud Prevention', 'Protecting systems and preventing fraudulent activities', true),
  ('Product Improvement', 'Product Improvement', 'Enhancing and developing products and services', true),
  ('Communication', 'Communication', 'Sending notifications, updates, and other communications', true),
  ('Personalization', 'Personalization', 'Customizing user experience based on preferences', true)
ON CONFLICT (purpose_name) DO NOTHING;
