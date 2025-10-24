-- Add supported_languages column to dpdpa_widget_configs table
ALTER TABLE dpdpa_widget_configs
ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['en', 'hi', 'pa', 'te', 'ta'];

-- Add comment for documentation
COMMENT ON COLUMN dpdpa_widget_configs.supported_languages IS 'List of language codes supported by the widget';
