-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  website TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google', 'twitter', 'apple')),
  subscription_plan TEXT CHECK (subscription_plan IN ('small', 'medium', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consent_records table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_id TEXT NOT NULL UNIQUE,
  visitor_email TEXT NOT NULL,
  tokenized_email TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cookie', 'dpdpa')),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected', 'partial', 'revoked')),
  categories JSONB DEFAULT '{}',
  device_type TEXT NOT NULL CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet')),
  ip_address TEXT,
  user_agent TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cookie_scans table
CREATE TABLE IF NOT EXISTS cookie_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  scan_date TIMESTAMPTZ DEFAULT NOW(),
  cookies_found JSONB DEFAULT '[]',
  classification JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create processing_activities table
CREATE TABLE IF NOT EXISTS processing_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  data_attributes TEXT[] NOT NULL DEFAULT '{}',
  purpose TEXT NOT NULL,
  retention_period TEXT NOT NULL,
  data_processors JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('small', 'medium', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  payment_provider TEXT DEFAULT 'razorpay' CHECK (payment_provider IN ('razorpay', 'stripe')),
  payment_id TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_id ON consent_records(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_status ON consent_records(status);
CREATE INDEX IF NOT EXISTS idx_consent_records_created_at ON consent_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cookie_scans_user_id ON cookie_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_activities_user_id ON processing_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_activities_updated_at
  BEFORE UPDATE ON processing_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for consent_records table
CREATE POLICY "Users can view own consent records" ON consent_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent records" ON consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent records" ON consent_records
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cookie_scans table
CREATE POLICY "Users can view own cookie scans" ON cookie_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookie scans" ON cookie_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for processing_activities table
CREATE POLICY "Users can view own processing activities" ON processing_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing activities" ON processing_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing activities" ON processing_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processing activities" ON processing_activities
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create cookie_banners table
CREATE TABLE IF NOT EXISTS cookie_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  banner_style TEXT NOT NULL CHECK (banner_style IN ('minimal', 'detailed', 'floating', 'sidebar')),
  position TEXT DEFAULT 'bottom' CHECK (position IN ('top', 'bottom', 'center', 'bottom-left', 'bottom-right')),
  primary_color TEXT DEFAULT '#3b82f6',
  text_color TEXT DEFAULT '#1f2937',
  background_color TEXT DEFAULT '#ffffff',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  accept_text TEXT DEFAULT 'Accept All',
  reject_text TEXT DEFAULT 'Reject All',
  settings_text TEXT DEFAULT 'Cookie Settings',
  language TEXT DEFAULT 'en',
  categories JSONB DEFAULT '["necessary"]',
  industry TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create widget_configs table
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  categories TEXT[] DEFAULT '{"necessary"}',
  behavior TEXT DEFAULT 'explicit' CHECK (behavior IN ('implicit', 'explicit', 'optout')),
  consent_duration INTEGER DEFAULT 365,
  show_branding_link BOOLEAN DEFAULT TRUE,
  block_scripts BOOLEAN DEFAULT TRUE,
  respect_dnt BOOLEAN DEFAULT FALSE,
  gdpr_applies BOOLEAN DEFAULT TRUE,
  auto_block TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_cookie_banners_user_id ON cookie_banners(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_user_id ON widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_widget_id ON widget_configs(widget_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_cookie_banners_updated_at
  BEFORE UPDATE ON cookie_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_configs_updated_at
  BEFORE UPDATE ON widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE cookie_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cookie_banners table
CREATE POLICY "Users can view own cookie banners" ON cookie_banners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookie banners" ON cookie_banners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookie banners" ON cookie_banners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookie banners" ON cookie_banners
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for widget_configs table
CREATE POLICY "Users can view own widget configs" ON widget_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget configs" ON widget_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widget configs" ON widget_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widget configs" ON widget_configs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_templates table (admin only)
CREATE POLICY "Anyone can read email templates" ON email_templates
  FOR SELECT USING (true);

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for email_logs table
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert default email templates
INSERT INTO email_templates (template_name, subject, body, variables, description) VALUES
(
  'welcome',
  'Welcome to Consently!',
  '<h1>Welcome to Consently, {{name}}!</h1><p>Thank you for signing up. Your account is now active.</p><p>Get started by configuring your cookie consent banner.</p><p><a href="{{dashboard_url}}">Go to Dashboard</a></p>',
  '["name", "dashboard_url"]',
  'Welcome email sent after user registration'
),
(
  'password_reset',
  'Reset Your Password',
  '<h1>Reset Your Password</h1><p>You requested to reset your password. Click the link below to create a new password:</p><p><a href="{{reset_url}}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn''t request this, please ignore this email.</p>',
  '["reset_url"]',
  'Password reset email'
),
(
  'subscription_confirmation',
  'Subscription Confirmed - Consently',
  '<h1>Subscription Confirmed!</h1><p>Your {{plan}} subscription is now active.</p><p><strong>Details:</strong></p><ul><li>Plan: {{plan}}</li><li>Amount: ₹{{amount}}</li><li>Billing Cycle: {{billing_cycle}}</li><li>Start Date: {{start_date}}</li><li>End Date: {{end_date}}</li></ul><p><a href="{{dashboard_url}}">Manage Subscription</a></p>',
  '["plan", "amount", "billing_cycle", "start_date", "end_date", "dashboard_url"]',
  'Subscription confirmation email'
),
(
  'consent_receipt',
  'Your Consent Record - {{website}}',
  '<h1>Consent Record</h1><p>This email confirms your consent preferences for {{website}}.</p><p><strong>Consent Details:</strong></p><ul><li>Status: {{status}}</li><li>Categories: {{categories}}</li><li>Date: {{date}}</li><li>Consent ID: {{consent_id}}</li></ul><p>You can update your preferences anytime by visiting the website.</p>',
  '["website", "status", "categories", "date", "consent_id"]',
  'Consent receipt email sent to visitors'
)
ON CONFLICT (template_name) DO NOTHING;
