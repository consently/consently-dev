-- Create DPDPA grievances table for user data rights requests
CREATE TABLE IF NOT EXISTS dpdpa_grievances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id TEXT NOT NULL,
  
  -- User information (optional)
  email TEXT,
  name TEXT,
  
  -- Grievance details
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('access', 'correction', 'deletion', 'withdrawal', 'general', 'complaint')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  
  -- Admin notes and resolution
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_widget_id ON dpdpa_grievances(widget_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_status ON dpdpa_grievances(status);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_created_at ON dpdpa_grievances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpdpa_grievances_email ON dpdpa_grievances(email) WHERE email IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER update_dpdpa_grievances_updated_at
  BEFORE UPDATE ON dpdpa_grievances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE dpdpa_grievances ENABLE ROW LEVEL SECURITY;

-- Public policy: Anyone can submit a grievance (no auth required)
CREATE POLICY "Allow public grievance submission" ON dpdpa_grievances
  FOR INSERT WITH CHECK (true);

-- Widget owners can view and manage grievances for their widgets
CREATE POLICY "Widget owners can view grievances" ON dpdpa_grievances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = dpdpa_grievances.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Widget owners can update grievances" ON dpdpa_grievances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM dpdpa_widget_configs 
      WHERE dpdpa_widget_configs.widget_id = dpdpa_grievances.widget_id 
      AND dpdpa_widget_configs.user_id = auth.uid()
    )
  );

-- Comments on table and columns for documentation
COMMENT ON TABLE dpdpa_grievances IS 'Stores user data rights requests and grievances submitted through DPDPA consent widgets';
COMMENT ON COLUMN dpdpa_grievances.type IS 'Type of grievance: access, correction, deletion, withdrawal, general, or complaint';
COMMENT ON COLUMN dpdpa_grievances.status IS 'Current status: open, in-progress, resolved, or closed';
COMMENT ON COLUMN dpdpa_grievances.message IS 'User-submitted grievance description or request';
