-- Add language column to widget_configs table for cookie consent
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN widget_configs.language IS 'Language code for the widget (e.g., en, es, fr)';
