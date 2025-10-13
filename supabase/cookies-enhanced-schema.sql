-- Enhanced Cookie Consent Management Schema
-- Production-level tables for comprehensive cookie tracking

-- Create cookies table for managing individual cookies
CREATE TABLE IF NOT EXISTS cookies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('necessary', 'functional', 'analytics', 'advertising', 'social', 'preferences')),
  purpose TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  provider_url TEXT,
  expiry TEXT NOT NULL,
  expiry_days INTEGER,
  type TEXT CHECK (type IN ('http', 'javascript', 'pixel', 'server')),
  is_third_party BOOLEAN DEFAULT FALSE,
  data_collected TEXT[],
  legal_basis TEXT CHECK (legal_basis IN ('consent', 'legitimate_interest', 'contract', 'legal_obligation')),
  dpo_contact TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, domain)
);

-- Create cookie_categories table for managing categories
CREATE TABLE IF NOT EXISTS cookie_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Create consent_logs table for detailed consent tracking
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_id TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cookie', 'dpdpa', 'gdpr')),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected', 'partial', 'revoked', 'updated')),
  categories JSONB DEFAULT '[]',
  cookies_accepted TEXT[],
  cookies_rejected TEXT[],
  device_info JSONB,
  geo_location JSONB,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  language TEXT,
  browser_fingerprint TEXT,
  consent_method TEXT CHECK (consent_method IN ('banner', 'settings_modal', 'api', 'implicit')),
  widget_version TEXT,
  tcf_string TEXT, -- IAB TCF 2.0 consent string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consent_analytics table for aggregated analytics
CREATE TABLE IF NOT EXISTS consent_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_visitors INTEGER DEFAULT 0,
  consents_given INTEGER DEFAULT 0,
  consents_denied INTEGER DEFAULT 0,
  consents_partial INTEGER DEFAULT 0,
  consents_revoked INTEGER DEFAULT 0,
  category_analytics JSONB DEFAULT '{}', -- {category: {accepted: 0, rejected: 0}}
  device_breakdown JSONB DEFAULT '{}', -- {desktop: 0, mobile: 0, tablet: 0}
  geo_breakdown JSONB DEFAULT '{}', -- {country: count}
  browser_breakdown JSONB DEFAULT '{}', -- {chrome: 0, firefox: 0}
  consent_rate DECIMAL(5,2), -- Percentage
  average_time_to_consent INTEGER, -- Seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create widget_translations table for multi-language support
CREATE TABLE IF NOT EXISTS widget_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widget_configs(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  accept_text TEXT DEFAULT 'Accept All',
  reject_text TEXT DEFAULT 'Reject All',
  settings_text TEXT DEFAULT 'Cookie Settings',
  save_text TEXT DEFAULT 'Save Preferences',
  close_text TEXT DEFAULT 'Close',
  category_translations JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(widget_id, language_code)
);

-- Create cookie_scan_history table for tracking scan results
CREATE TABLE IF NOT EXISTS cookie_scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_id TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  scan_status TEXT CHECK (scan_status IN ('pending', 'running', 'completed', 'failed')),
  scan_depth TEXT CHECK (scan_depth IN ('shallow', 'medium', 'deep')),
  pages_scanned INTEGER DEFAULT 0,
  cookies_found INTEGER DEFAULT 0,
  new_cookies INTEGER DEFAULT 0,
  changed_cookies INTEGER DEFAULT 0,
  removed_cookies INTEGER DEFAULT 0,
  scan_duration INTEGER, -- Seconds
  error_message TEXT,
  cookies_data JSONB DEFAULT '[]',
  classification JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consent_receipts table for GDPR/DPDPA compliance
CREATE TABLE IF NOT EXISTS consent_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_id TEXT NOT NULL UNIQUE,
  visitor_email TEXT,
  receipt_number TEXT NOT NULL UNIQUE,
  consent_data JSONB NOT NULL,
  receipt_html TEXT,
  receipt_pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cookie_compliance_checks table for automated compliance validation
CREATE TABLE IF NOT EXISTS cookie_compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL UNIQUE,
  check_type TEXT CHECK (check_type IN ('gdpr', 'dpdpa', 'ccpa', 'eprivacy')),
  check_status TEXT CHECK (check_status IN ('pass', 'fail', 'warning', 'info')),
  issues_found JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create widget_performance_metrics table for monitoring
CREATE TABLE IF NOT EXISTS widget_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widget_configs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  load_time_avg INTEGER, -- Milliseconds
  load_time_p95 INTEGER,
  error_count INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(widget_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cookies_user_id ON cookies(user_id);
CREATE INDEX IF NOT EXISTS idx_cookies_category ON cookies(category);
CREATE INDEX IF NOT EXISTS idx_cookies_domain ON cookies(domain);
CREATE INDEX IF NOT EXISTS idx_cookie_categories_user_id ON cookie_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_id ON consent_logs(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_visitor_token ON consent_logs(visitor_token);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_analytics_user_id ON consent_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_analytics_date ON consent_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_widget_translations_user_id ON widget_translations(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_translations_widget_id ON widget_translations(widget_id);
CREATE INDEX IF NOT EXISTS idx_cookie_scan_history_user_id ON cookie_scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_scan_history_scan_status ON cookie_scan_history(scan_status);
CREATE INDEX IF NOT EXISTS idx_consent_receipts_user_id ON consent_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_receipts_consent_id ON consent_receipts(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_receipts_receipt_number ON consent_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_cookie_compliance_checks_user_id ON cookie_compliance_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_performance_metrics_widget_id ON widget_performance_metrics(widget_id);

-- Apply updated_at triggers
CREATE TRIGGER update_cookies_updated_at
  BEFORE UPDATE ON cookies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_categories_updated_at
  BEFORE UPDATE ON cookie_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_analytics_updated_at
  BEFORE UPDATE ON consent_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_translations_updated_at
  BEFORE UPDATE ON widget_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cookies table
CREATE POLICY "Users can view own cookies" ON cookies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookies" ON cookies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookies" ON cookies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookies" ON cookies
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cookie_categories table
CREATE POLICY "Users can view own cookie categories" ON cookie_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookie categories" ON cookie_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookie categories" ON cookie_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookie categories" ON cookie_categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for consent_logs table
CREATE POLICY "Users can view own consent logs" ON consent_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent logs" ON consent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consent_analytics table
CREATE POLICY "Users can view own consent analytics" ON consent_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent analytics" ON consent_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent analytics" ON consent_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for widget_translations table
CREATE POLICY "Users can view own widget translations" ON widget_translations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget translations" ON widget_translations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widget translations" ON widget_translations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widget translations" ON widget_translations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cookie_scan_history table
CREATE POLICY "Users can view own scan history" ON cookie_scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history" ON cookie_scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan history" ON cookie_scan_history
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for consent_receipts table
CREATE POLICY "Users can view own consent receipts" ON consent_receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent receipts" ON consent_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cookie_compliance_checks table
CREATE POLICY "Users can view own compliance checks" ON cookie_compliance_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance checks" ON cookie_compliance_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for widget_performance_metrics table
CREATE POLICY "Users can view own widget metrics" ON widget_performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget metrics" ON widget_performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default cookie categories
INSERT INTO cookie_categories (user_id, category_id, name, description, is_required, display_order)
SELECT 
  id as user_id,
  'necessary' as category_id,
  'Necessary' as name,
  'Essential cookies required for website functionality' as description,
  true as is_required,
  1 as display_order
FROM users
ON CONFLICT (user_id, category_id) DO NOTHING;

-- Create function to aggregate daily consent analytics
CREATE OR REPLACE FUNCTION aggregate_consent_analytics(p_user_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
  v_total_visitors INTEGER;
  v_consents_given INTEGER;
  v_consents_denied INTEGER;
  v_consents_partial INTEGER;
  v_consents_revoked INTEGER;
  v_consent_rate DECIMAL(5,2);
BEGIN
  -- Count consent activities for the day
  SELECT 
    COUNT(DISTINCT visitor_token),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'partial'),
    COUNT(*) FILTER (WHERE status = 'revoked')
  INTO 
    v_total_visitors,
    v_consents_given,
    v_consents_denied,
    v_consents_partial,
    v_consents_revoked
  FROM consent_logs
  WHERE user_id = p_user_id
    AND DATE(created_at) = p_date;
  
  -- Calculate consent rate
  IF v_total_visitors > 0 THEN
    v_consent_rate := ROUND((v_consents_given::DECIMAL / v_total_visitors) * 100, 2);
  ELSE
    v_consent_rate := 0;
  END IF;
  
  -- Insert or update analytics
  INSERT INTO consent_analytics (
    user_id,
    date,
    total_visitors,
    consents_given,
    consents_denied,
    consents_partial,
    consents_revoked,
    consent_rate
  ) VALUES (
    p_user_id,
    p_date,
    v_total_visitors,
    v_consents_given,
    v_consents_denied,
    v_consents_partial,
    v_consents_revoked,
    v_consent_rate
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_visitors = EXCLUDED.total_visitors,
    consents_given = EXCLUDED.consents_given,
    consents_denied = EXCLUDED.consents_denied,
    consents_partial = EXCLUDED.consents_partial,
    consents_revoked = EXCLUDED.consents_revoked,
    consent_rate = EXCLUDED.consent_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate consent receipt
CREATE OR REPLACE FUNCTION generate_consent_receipt(p_consent_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_receipt_number TEXT;
BEGIN
  v_receipt_number := 'CR-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                      UPPER(substring(md5(random()::text), 1, 8));
  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE cookies IS 'Stores individual cookies tracked by the user';
COMMENT ON TABLE cookie_categories IS 'Custom cookie categories defined by users';
COMMENT ON TABLE consent_logs IS 'Detailed logs of all consent activities';
COMMENT ON TABLE consent_analytics IS 'Aggregated daily analytics for consent patterns';
COMMENT ON TABLE widget_translations IS 'Multi-language translations for cookie widgets';
COMMENT ON TABLE cookie_scan_history IS 'History of cookie scans performed';
COMMENT ON TABLE consent_receipts IS 'GDPR/DPDPA compliant consent receipts';
COMMENT ON TABLE cookie_compliance_checks IS 'Automated compliance validation results';
COMMENT ON TABLE widget_performance_metrics IS 'Performance metrics for widget monitoring';
