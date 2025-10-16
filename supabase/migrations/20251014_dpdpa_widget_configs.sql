-- Create DPDPA widget configurations table
CREATE TABLE IF NOT EXISTS dpdpa_widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Widget appearance
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('top', 'bottom', 'center', 'bottom-left', 'bottom-right', 'modal')),
  layout TEXT DEFAULT 'modal' CHECK (layout IN ('modal', 'slide-in', 'banner')),
  
  -- Theme customization
  theme JSONB DEFAULT '{
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui, sans-serif",
    "fontSize": 14,
    "borderRadius": 12,
    "boxShadow": true
  }'::jsonb,
  
  -- Content
  title TEXT DEFAULT 'Your Data Privacy Rights',
  message TEXT DEFAULT 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
  accept_button_text TEXT DEFAULT 'Accept All',
  reject_button_text TEXT DEFAULT 'Reject All',
  customize_button_text TEXT DEFAULT 'Manage Preferences',
  
  -- Selected processing activities (references to processing_activities.id)
  selected_activities UUID[] DEFAULT '{}',
  
  -- Behavior settings
  auto_show BOOLEAN DEFAULT TRUE,
  show_after_delay INTEGER DEFAULT 1000, -- milliseconds
  consent_duration INTEGER DEFAULT 365, -- days
  respect_dnt BOOLEAN DEFAULT FALSE,
  require_explicit_consent BOOLEAN DEFAULT TRUE,
  show_data_subjects_rights BOOLEAN DEFAULT TRUE,
  
  -- Language and localization
  language TEXT DEFAULT 'en',
  custom_translations JSONB DEFAULT '{}'::jsonb,
  
  -- Advanced features
  enable_analytics BOOLEAN DEFAULT TRUE,
  enable_audit_log BOOLEAN DEFAULT TRUE,
  show_branding BOOLEAN DEFAULT TRUE,
  custom_css TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_user_id ON dpdpa_widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_widget_id ON dpdpa_widget_configs(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_domain ON dpdpa_widget_configs(domain);

-- Create updated_at trigger
CREATE TRIGGER update_dpdpa_widget_configs_updated_at
  BEFORE UPDATE ON dpdpa_widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE dpdpa_widget_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own DPDPA widget configs" ON dpdpa_widget_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own DPDPA widget configs" ON dpdpa_widget_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own DPDPA widget configs" ON dpdpa_widget_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own DPDPA widget configs" ON dpdpa_widget_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Create DPDPA consent records table (separate from cookie consent)
CREATE TABLE IF NOT EXISTS dpdpa_consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id TEXT NOT NULL,
  
  -- Visitor identification (anonymized)
  visitor_id TEXT NOT NULL, -- Generated on frontend, persistent
  visitor_email TEXT, -- Optional if provided
  visitor_email_hash TEXT, -- SHA-256 hash for privacy
  
  -- Consent details
  consent_status TEXT NOT NULL CHECK (consent_status IN ('accepted', 'rejected', 'partial')),
  accepted_activities UUID[] DEFAULT '{}', -- Array of activity IDs
  rejected_activities UUID[] DEFAULT '{}',
  
  -- Activity-specific consents (detailed breakdown)
  activity_consents JSONB DEFAULT '{}'::jsonb,
  -- Example: {"activity-uuid-1": {"status": "accepted", "timestamp": "2024-01-01T00:00:00Z"}}
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet', 'Unknown')),
  browser TEXT,
  os TEXT,
  country TEXT,
  language TEXT,
  referrer TEXT,
  
  -- Timestamps
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Versioning
  consent_version TEXT DEFAULT '1.0',
  widget_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_id ON dpdpa_consent_records(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_id ON dpdpa_consent_records(visitor_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_email_hash ON dpdpa_consent_records(visitor_email_hash);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_timestamp ON dpdpa_consent_records(consent_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_status ON dpdpa_consent_records(consent_status);

-- Public access policy for consent recording (no auth required)
ALTER TABLE dpdpa_consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public consent recording" ON dpdpa_consent_records
  FOR INSERT WITH CHECK (true);

-- Only widget owners can view consent records
CREATE POLICY "Widget owners can view consent records" ON dpdpa_consent_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = dpdpa_consent_records.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );
