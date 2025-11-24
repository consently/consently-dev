-- Add smart pre-fill configuration fields to widget_configs table
-- Migration: add_smart_prefill_config.sql

-- Add new columns
ALTER TABLE widget_configs 
ADD COLUMN IF NOT EXISTS enable_smart_prefill BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_field_selectors TEXT DEFAULT 'input[type="email"], input[name*="email" i]';

-- Update existing widgets to enable smart pre-fill by default (backward compatibility)
UPDATE widget_configs 
SET enable_smart_prefill = true 
WHERE enable_smart_prefill IS NULL;

-- Add column comments for documentation
COMMENT ON COLUMN widget_configs.enable_smart_prefill IS 'Enable automatic email extraction from forms for pre-filling consent verification';
COMMENT ON COLUMN widget_configs.email_field_selectors IS 'CSS selectors for finding email fields in forms (comma-separated, e.g., "input[type=email"], #email")';

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'widget_configs' 
  AND column_name IN ('enable_smart_prefill', 'email_field_selectors');
