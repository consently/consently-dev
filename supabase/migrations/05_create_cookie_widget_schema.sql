-- ============================================================================
-- COOKIE WIDGET SCHEMA - Complete Database Structure
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-06
-- Purpose: Create all necessary tables for Cookie Consent Widget module
--
-- This migration creates:
-- 1. widget_configs - Cookie widget configuration
-- 2. banner_configs - Banner template designs
-- 3. consent_records - Consent transactions
-- 4. consent_logs - Detailed consent logging
-- ============================================================================

-- ============================================================================
-- SECTION 1: BANNER CONFIGS (Templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS banner_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Display settings
  position VARCHAR(50) DEFAULT 'bottom' CHECK (position IN ('top', 'bottom', 'center', 'bottom-left', 'bottom-right', 'modal')),
  layout VARCHAR(50) DEFAULT 'bar' CHECK (layout IN ('bar', 'modal', 'box', 'banner')),
  
  -- Theme configuration
  theme JSONB DEFAULT '{
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui, sans-serif",
    "fontSize": 14,
    "borderRadius": 8,
    "boxShadow": true,
    "logoUrl": null
  }'::jsonb,
  
  -- Content
  title VARCHAR(500) DEFAULT 'Cookie Consent',
  message TEXT DEFAULT 'We use cookies to improve your experience on our website. By browsing this website, you agree to our use of cookies.',
  privacy_policy_url TEXT,
  privacy_policy_text VARCHAR(100) DEFAULT 'Privacy Policy',
  cookie_policy_url TEXT,
  cookie_policy_text VARCHAR(100) DEFAULT 'Cookie Policy',
  terms_url TEXT,
  terms_text VARCHAR(100) DEFAULT 'Terms & Conditions',
  
  -- Button configurations
  accept_button JSONB DEFAULT '{
    "text": "Accept All",
    "backgroundColor": "#3b82f6",
    "textColor": "#ffffff",
    "fontSize": 14,
    "fontWeight": "semibold",
    "borderRadius": 8
  }'::jsonb,
  
  reject_button JSONB DEFAULT '{
    "text": "Reject All",
    "backgroundColor": "transparent",
    "textColor": "#3b82f6",
    "borderColor": "#3b82f6",
    "fontSize": 14,
    "fontWeight": "medium",
    "borderRadius": 8
  }'::jsonb,
  
  settings_button JSONB DEFAULT '{
    "text": "Cookie Settings",
    "backgroundColor": "#f3f4f6",
    "textColor": "#1f2937",
    "fontSize": 14,
    "fontWeight": "normal",
    "borderRadius": 8
  }'::jsonb,
  
  -- Behavior settings
  show_reject_button BOOLEAN DEFAULT true,
  show_settings_button BOOLEAN DEFAULT true,
  auto_show BOOLEAN DEFAULT true,
  show_after_delay INTEGER DEFAULT 0 CHECK (show_after_delay >= 0 AND show_after_delay <= 30000),
  respect_dnt BOOLEAN DEFAULT false,
  block_content BOOLEAN DEFAULT false,
  z_index INTEGER DEFAULT 9999,
  
  -- Advanced
  custom_css TEXT,
  custom_js TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments
COMMENT ON TABLE banner_configs IS 'Stores banner template designs for cookie consent widgets';
COMMENT ON COLUMN banner_configs.is_default IS 'Whether this is the default template for the user';

-- ============================================================================
-- SECTION 2: WIDGET CONFIGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership & identification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- Basic configuration
  domain VARCHAR(255) NOT NULL,
  
  -- Cookie categories
  categories TEXT[] DEFAULT ARRAY['necessary', 'preferences', 'analytics', 'marketing']::TEXT[],
  
  -- Behavior settings
  behavior VARCHAR(50) DEFAULT 'explicit' CHECK (behavior IN ('implicit', 'explicit', 'optout')),
  consent_duration INTEGER DEFAULT 365 CHECK (consent_duration >= 1 AND consent_duration <= 730),
  show_branding_link BOOLEAN DEFAULT true,
  block_scripts BOOLEAN DEFAULT true,
  respect_dnt BOOLEAN DEFAULT false,
  gdpr_applies BOOLEAN DEFAULT true,
  auto_block TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Link to banner template (optional)
  banner_template_id UUID REFERENCES banner_configs(id) ON DELETE SET NULL,
  
  -- Position and layout (can override banner template)
  position VARCHAR(50),
  layout VARCHAR(50),
  
  -- Theme (can override banner template)
  theme JSONB,
  
  -- Language settings
  language VARCHAR(10) DEFAULT 'en',
  supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
  
  -- Banner content overrides (JSONB for flexibility)
  banner_content JSONB,
  
  -- Behavior overrides
  auto_show BOOLEAN,
  show_after_delay INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_user_widget UNIQUE (user_id, widget_id),
  CONSTRAINT valid_widget_id CHECK (widget_id ~ '^cnsty_[a-z0-9_]+$')
);

-- Comments
COMMENT ON TABLE widget_configs IS 'Stores cookie consent widget configurations for external websites';
COMMENT ON COLUMN widget_configs.widget_id IS 'Unique identifier used in embed code (format: cnsty_*)';
COMMENT ON COLUMN widget_configs.banner_template_id IS 'Optional link to banner template - provides default design';
COMMENT ON COLUMN widget_configs.banner_content IS 'JSONB override for banner content (title, message, button text)';
COMMENT ON COLUMN widget_configs.theme IS 'JSONB override for theme (colors, fonts, logo) - takes precedence over banner template';

-- ============================================================================
-- SECTION 3: CONSENT RECORDS (Main consent table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent identification
  consent_id VARCHAR(255) NOT NULL UNIQUE,
  
  -- Consent details
  consent_type VARCHAR(50) DEFAULT 'cookie' CHECK (consent_type IN ('cookie', 'dpdpa', 'gdpr')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('accepted', 'rejected', 'partial', 'revoked')),
  categories TEXT[] DEFAULT ARRAY['necessary']::TEXT[],
  
  -- Device & browser info
  device_type VARCHAR(50),
  ip_address VARCHAR(45), -- IPv6 compatible
  user_agent TEXT,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments
COMMENT ON TABLE consent_records IS 'Stores consent records for backwards compatibility';
COMMENT ON COLUMN consent_records.consent_id IS 'Unique consent transaction identifier from widget';

-- ============================================================================
-- SECTION 4: CONSENT LOGS (Detailed logging for dashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent identification
  consent_id VARCHAR(255) NOT NULL,
  visitor_token VARCHAR(255),
  
  -- Consent details
  consent_type VARCHAR(50) DEFAULT 'cookie' CHECK (consent_type IN ('cookie', 'dpdpa', 'gdpr')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('accepted', 'rejected', 'partial', 'revoked')),
  categories TEXT[] DEFAULT ARRAY['necessary']::TEXT[],
  
  -- Device & browser info
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45), -- IPv6 compatible
  user_agent TEXT,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Consent method
  consent_method VARCHAR(50) DEFAULT 'banner' CHECK (consent_method IN ('banner', 'privacy_centre', 'api', 'admin')),
  widget_version VARCHAR(50),
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments
COMMENT ON TABLE consent_logs IS 'Detailed consent logs for dashboard analytics and reporting';
COMMENT ON COLUMN consent_logs.visitor_token IS 'Tokenized visitor identifier for privacy';
COMMENT ON COLUMN consent_logs.device_info IS 'JSONB containing device details (type, browser, OS)';

-- ============================================================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Banner Configs Indexes
CREATE INDEX IF NOT EXISTS idx_banner_configs_user_id ON banner_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_configs_is_active ON banner_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_banner_configs_is_default ON banner_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_banner_configs_created_at ON banner_configs(created_at DESC);

-- Widget Configs Indexes
CREATE INDEX IF NOT EXISTS idx_widget_configs_user_id ON widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_widget_id ON widget_configs(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_domain ON widget_configs(domain);
CREATE INDEX IF NOT EXISTS idx_widget_configs_banner_template_id ON widget_configs(banner_template_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_is_active ON widget_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_widget_configs_created_at ON widget_configs(created_at DESC);

-- Consent Records Indexes
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_id ON consent_records(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_status ON consent_records(status);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_created_at ON consent_records(created_at DESC);

-- Consent Logs Indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_id ON consent_logs(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_visitor_token ON consent_logs(visitor_token);
CREATE INDEX IF NOT EXISTS idx_consent_logs_status ON consent_logs(status);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_type ON consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at DESC);

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE banner_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Banner Configs RLS Policies
CREATE POLICY "Users can read own banner configs"
  ON banner_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own banner configs"
  ON banner_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banner configs"
  ON banner_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own banner configs"
  ON banner_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Widget Configs RLS Policies
CREATE POLICY "Users can read own widget configs"
  ON widget_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own widget configs"
  ON widget_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widget configs"
  ON widget_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own widget configs"
  ON widget_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public API can read active widget configs (for public widget endpoint)
CREATE POLICY "Public API can read active widget configs"
  ON widget_configs FOR SELECT
  TO anon
  USING (is_active = true);

-- Consent Records RLS Policies
CREATE POLICY "Users can read own consent records"
  ON consent_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous users can create consent records (public widget)
CREATE POLICY "Allow public consent record creation"
  ON consent_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Consent Logs RLS Policies
CREATE POLICY "Users can read own consent logs"
  ON consent_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous users can create consent logs (public widget)
CREATE POLICY "Allow public consent log creation"
  ON consent_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- SECTION 7: TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_banner_configs_updated_at ON banner_configs;
CREATE TRIGGER update_banner_configs_updated_at
  BEFORE UPDATE ON banner_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_widget_configs_updated_at ON widget_configs;
CREATE TRIGGER update_widget_configs_updated_at
  BEFORE UPDATE ON widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consent_records_updated_at ON consent_records;
CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consent_logs_updated_at ON consent_logs;
CREATE TRIGGER update_consent_logs_updated_at
  BEFORE UPDATE ON consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cookie widget schema created successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - banner_configs';
  RAISE NOTICE '  - widget_configs';
  RAISE NOTICE '  - consent_records';
  RAISE NOTICE '  - consent_logs';
END $$;
