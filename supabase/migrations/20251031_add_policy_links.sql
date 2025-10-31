-- Add cookie policy URL and terms URL fields to banner_configs table
-- This allows customers to link to their cookie policy, privacy policy, and terms pages

ALTER TABLE banner_configs 
ADD COLUMN IF NOT EXISTS cookie_policy_url TEXT,
ADD COLUMN IF NOT EXISTS cookie_policy_text TEXT DEFAULT 'Cookie Policy',
ADD COLUMN IF NOT EXISTS terms_url TEXT,
ADD COLUMN IF NOT EXISTS terms_text TEXT DEFAULT 'Terms & Conditions';

-- Update the banner version function to include new fields
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
  
  -- Build config snapshot with new fields
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
    'cookie_policy_url', NEW.cookie_policy_url,
    'cookie_policy_text', NEW.cookie_policy_text,
    'terms_url', NEW.terms_url,
    'terms_text', NEW.terms_text,
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

-- Comments for documentation
COMMENT ON COLUMN banner_configs.cookie_policy_url IS 'URL to the cookie policy page';
COMMENT ON COLUMN banner_configs.cookie_policy_text IS 'Link text for cookie policy (default: Cookie Policy)';
COMMENT ON COLUMN banner_configs.terms_url IS 'URL to the terms and conditions page';
COMMENT ON COLUMN banner_configs.terms_text IS 'Link text for terms (default: Terms & Conditions)';
