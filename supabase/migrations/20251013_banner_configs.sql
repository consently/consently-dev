-- Banner Configurations and Version History Tables
-- Production-level schema for comprehensive banner template management

-- Create banner_configs table for storing banner templates and configurations
CREATE TABLE IF NOT EXISTS banner_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Position and Layout
  position TEXT NOT NULL CHECK (position IN ('top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'center-modal')),
  layout TEXT NOT NULL CHECK (layout IN ('bar', 'box', 'modal', 'popup', 'inline', 'floating')),
  
  -- Theme Configuration (stored as JSONB for flexibility)
  theme JSONB NOT NULL DEFAULT '{
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui, sans-serif",
    "fontSize": 14,
    "borderRadius": 8,
    "boxShadow": true
  }'::jsonb,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  privacy_policy_url TEXT,
  privacy_policy_text TEXT DEFAULT 'Privacy Policy',
  
  -- Button Configurations (stored as JSONB)
  accept_button JSONB NOT NULL DEFAULT '{
    "text": "Accept All",
    "backgroundColor": "#3b82f6",
    "textColor": "#ffffff",
    "borderRadius": 6,
    "fontSize": 14,
    "fontWeight": "semibold"
  }'::jsonb,
  
  reject_button JSONB DEFAULT '{
    "text": "Reject All",
    "backgroundColor": "#ffffff",
    "textColor": "#3b82f6",
    "borderColor": "#3b82f6",
    "borderRadius": 6,
    "fontSize": 14,
    "fontWeight": "medium"
  }'::jsonb,
  
  settings_button JSONB DEFAULT '{
    "text": "Cookie Settings",
    "backgroundColor": "#f3f4f6",
    "textColor": "#1f2937",
    "borderRadius": 6,
    "fontSize": 14,
    "fontWeight": "normal"
  }'::jsonb,
  
  -- Behavior Settings
  show_reject_button BOOLEAN DEFAULT TRUE,
  show_settings_button BOOLEAN DEFAULT TRUE,
  auto_show BOOLEAN DEFAULT TRUE,
  show_after_delay INTEGER DEFAULT 0 CHECK (show_after_delay >= 0 AND show_after_delay <= 60000),
  respect_dnt BOOLEAN DEFAULT FALSE,
  block_content BOOLEAN DEFAULT FALSE,
  
  -- Advanced Customization
  custom_css TEXT,
  custom_js TEXT,
  z_index INTEGER DEFAULT 9999 CHECK (z_index >= 1 AND z_index <= 999999),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one default banner per user
  CONSTRAINT unique_default_banner UNIQUE NULLS NOT DISTINCT (user_id, is_default) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Create banner_versions table for version history tracking
CREATE TABLE IF NOT EXISTS banner_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_id UUID NOT NULL REFERENCES banner_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL, -- Complete snapshot of banner configuration
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique version numbers per banner
  UNIQUE(banner_id, version)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_banner_configs_user_id ON banner_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_configs_is_active ON banner_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_banner_configs_is_default ON banner_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_banner_configs_created_at ON banner_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_versions_banner_id ON banner_versions(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_versions_user_id ON banner_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_versions_version ON banner_versions(version DESC);

-- Apply updated_at trigger to banner_configs
CREATE TRIGGER update_banner_configs_updated_at
  BEFORE UPDATE ON banner_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE banner_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banner_configs table
CREATE POLICY "Users can view own banner configs" ON banner_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banner configs" ON banner_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banner configs" ON banner_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own banner configs" ON banner_configs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for banner_versions table
CREATE POLICY "Users can view own banner versions" ON banner_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banner versions" ON banner_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create version on banner update
CREATE OR REPLACE FUNCTION create_banner_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version INTEGER;
  v_config JSONB;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_version
  FROM banner_versions
  WHERE banner_id = NEW.id;
  
  -- Build config snapshot
  v_config := jsonb_build_object(
    'name', NEW.name,
    'description', NEW.description,
    'position', NEW.position,
    'layout', NEW.layout,
    'theme', NEW.theme,
    'title', NEW.title,
    'message', NEW.message,
    'privacy_policy_url', NEW.privacy_policy_url,
    'privacy_policy_text', NEW.privacy_policy_text,
    'accept_button', NEW.accept_button,
    'reject_button', NEW.reject_button,
    'settings_button', NEW.settings_button,
    'show_reject_button', NEW.show_reject_button,
    'show_settings_button', NEW.show_settings_button,
    'auto_show', NEW.auto_show,
    'show_after_delay', NEW.show_after_delay,
    'respect_dnt', NEW.respect_dnt,
    'block_content', NEW.block_content,
    'custom_css', NEW.custom_css,
    'custom_js', NEW.custom_js,
    'z_index', NEW.z_index,
    'is_active', NEW.is_active,
    'is_default', NEW.is_default
  );
  
  -- Insert version record
  INSERT INTO banner_versions (banner_id, user_id, version, config, change_description)
  VALUES (NEW.id, NEW.user_id, v_version, v_config, 'Configuration updated');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-version on updates
CREATE TRIGGER banner_config_versioning
  AFTER INSERT OR UPDATE ON banner_configs
  FOR EACH ROW
  EXECUTE FUNCTION create_banner_version();

-- Comments for documentation
COMMENT ON TABLE banner_configs IS 'Stores cookie banner templates and configurations';
COMMENT ON TABLE banner_versions IS 'Version history for banner configurations';
COMMENT ON COLUMN banner_configs.theme IS 'JSONB object containing theme customization settings';
COMMENT ON COLUMN banner_configs.accept_button IS 'JSONB object containing accept button configuration';
COMMENT ON COLUMN banner_configs.reject_button IS 'JSONB object containing reject button configuration';
COMMENT ON COLUMN banner_configs.settings_button IS 'JSONB object containing settings button configuration';
COMMENT ON COLUMN banner_versions.config IS 'Complete snapshot of banner configuration at this version';
