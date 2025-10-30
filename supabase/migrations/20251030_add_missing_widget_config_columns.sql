-- Add missing columns to widget_configs table
-- This migration adds all the fields that the frontend expects but are missing from the database schema

-- Add theme configuration as JSONB
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{
  "primaryColor": "#3b82f6",
  "backgroundColor": "#ffffff",
  "textColor": "#1f2937",
  "borderRadius": 12,
  "fontFamily": "system-ui, sans-serif"
}'::jsonb;

-- Add supported languages array
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['en'];

-- Add auto-show settings
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS auto_show BOOLEAN DEFAULT TRUE;

ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS show_after_delay INTEGER DEFAULT 1000;

-- Add position and layout
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'bottom' 
  CHECK (position IN ('top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'));

ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'bar' 
  CHECK (layout IN ('bar', 'box', 'modal', 'banner'));

-- Add banner_template_id if not already added by another migration
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS banner_template_id UUID REFERENCES banner_configs(id) ON DELETE SET NULL;

-- Add banner content as JSONB to store custom text
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS banner_content JSONB DEFAULT '{
  "title": "🍪 We value your privacy",
  "message": "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.",
  "acceptButtonText": "Accept All",
  "rejectButtonText": "Reject All",
  "settingsButtonText": "Cookie Settings"
}'::jsonb;

-- Add name column for better widget identification
ALTER TABLE widget_configs
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'My Cookie Widget';

-- Create index for banner_template_id if not exists
CREATE INDEX IF NOT EXISTS idx_widget_configs_banner_template_id 
ON widget_configs(banner_template_id);

-- Add comments for documentation
COMMENT ON COLUMN widget_configs.theme IS 'JSONB object containing theme customization (colors, fonts, border radius)';
COMMENT ON COLUMN widget_configs.supported_languages IS 'Array of language codes supported by the widget';
COMMENT ON COLUMN widget_configs.auto_show IS 'Whether to automatically show the banner on page load';
COMMENT ON COLUMN widget_configs.show_after_delay IS 'Delay in milliseconds before showing the banner';
COMMENT ON COLUMN widget_configs.position IS 'Position of the banner on the page';
COMMENT ON COLUMN widget_configs.layout IS 'Layout style of the banner';
COMMENT ON COLUMN widget_configs.banner_template_id IS 'Reference to the banner template used for this widget';
COMMENT ON COLUMN widget_configs.banner_content IS 'Custom text content for the banner (title, message, button labels)';
COMMENT ON COLUMN widget_configs.name IS 'Display name for the widget configuration';
