-- Cookie Policies Table
-- Stores customizable cookie policy documents for users

CREATE TABLE IF NOT EXISTS cookie_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Company Information
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  company_address TEXT,
  
  -- Policy Configuration (JSONB for flexibility)
  policy_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Link to scan that generated this policy
  scan_id UUID REFERENCES cookie_scans(id) ON DELETE SET NULL,
  
  -- Versioning
  version TEXT DEFAULT '1.0',
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  published_url TEXT, -- URL where policy is published
  
  -- Custom sections (allow users to add custom content)
  custom_sections JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cookie_policies_user_id ON cookie_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_policies_scan_id ON cookie_policies(scan_id);
CREATE INDEX IF NOT EXISTS idx_cookie_policies_is_published ON cookie_policies(is_published);
CREATE INDEX IF NOT EXISTS idx_cookie_policies_created_at ON cookie_policies(created_at DESC);

-- Apply updated_at trigger
CREATE TRIGGER update_cookie_policies_updated_at
  BEFORE UPDATE ON cookie_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cookie_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cookie policies" ON cookie_policies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookie policies" ON cookie_policies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookie policies" ON cookie_policies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookie policies" ON cookie_policies
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE cookie_policies IS 'Stores customizable cookie policy documents generated for users';
COMMENT ON COLUMN cookie_policies.policy_data IS 'JSONB object containing policy configuration and content';
COMMENT ON COLUMN cookie_policies.custom_sections IS 'Array of custom sections added by user';
COMMENT ON COLUMN cookie_policies.published_url IS 'URL where the policy is publicly accessible';
