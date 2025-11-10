-- Migration: Add analytics tables for rule matches and consent events
-- This enables tracking rule performance and consent rates

-- Table for rule match events
CREATE TABLE IF NOT EXISTS dpdpa_rule_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  url_pattern TEXT NOT NULL,
  page_url TEXT NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('onPageLoad', 'onClick', 'onFormSubmit', 'onScroll')),
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet', 'Unknown')),
  country TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key to widget configs
  CONSTRAINT fk_widget FOREIGN KEY (widget_id) REFERENCES dpdpa_widget_configs(widget_id) ON DELETE CASCADE
);

-- Index for widget_id and matched_at (for analytics queries)
CREATE INDEX IF NOT EXISTS idx_rule_match_events_widget_matched 
ON dpdpa_rule_match_events(widget_id, matched_at DESC);

-- Index for rule_id (for rule performance queries)
CREATE INDEX IF NOT EXISTS idx_rule_match_events_rule_id 
ON dpdpa_rule_match_events(rule_id);

-- Index for visitor_id (for visitor tracking)
CREATE INDEX IF NOT EXISTS idx_rule_match_events_visitor_id 
ON dpdpa_rule_match_events(visitor_id);

-- Table for consent events (analytics)
CREATE TABLE IF NOT EXISTS dpdpa_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  rule_id TEXT,
  rule_name TEXT,
  consent_status TEXT NOT NULL CHECK (consent_status IN ('accepted', 'rejected', 'partial')),
  accepted_activities TEXT[] DEFAULT '{}',
  rejected_activities TEXT[] DEFAULT '{}',
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet', 'Unknown')),
  country TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key to widget configs
  CONSTRAINT fk_widget FOREIGN KEY (widget_id) REFERENCES dpdpa_widget_configs(widget_id) ON DELETE CASCADE,
  
  -- Link to consent record if available
  consent_record_id UUID REFERENCES dpdpa_consent_records(id) ON DELETE SET NULL
);

-- Index for widget_id and consented_at (for analytics queries)
CREATE INDEX IF NOT EXISTS idx_consent_events_widget_consented 
ON dpdpa_consent_events(widget_id, consented_at DESC);

-- Index for rule_id (for rule performance queries)
CREATE INDEX IF NOT EXISTS idx_consent_events_rule_id 
ON dpdpa_consent_events(rule_id) WHERE rule_id IS NOT NULL;

-- Index for visitor_id (for visitor tracking)
CREATE INDEX IF NOT EXISTS idx_consent_events_visitor_id 
ON dpdpa_consent_events(visitor_id);

-- Index for consent_status (for filtering)
CREATE INDEX IF NOT EXISTS idx_consent_events_status 
ON dpdpa_consent_events(consent_status);

-- Composite index for rule performance analytics
CREATE INDEX IF NOT EXISTS idx_consent_events_rule_status 
ON dpdpa_consent_events(rule_id, consent_status) WHERE rule_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE dpdpa_rule_match_events IS 'Tracks when display rules are matched (for analytics)';
COMMENT ON TABLE dpdpa_consent_events IS 'Tracks consent events for analytics (separate from consent records for performance)';

-- Enable Row Level Security (RLS)
ALTER TABLE dpdpa_rule_match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdpa_consent_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see analytics for their own widgets
CREATE POLICY "Users can view rule match events for their widgets"
  ON dpdpa_rule_match_events
  FOR SELECT
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view consent events for their widgets"
  ON dpdpa_consent_events
  FOR SELECT
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow public inserts (from widget SDK)
CREATE POLICY "Public can insert rule match events"
  ON dpdpa_rule_match_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can insert consent events"
  ON dpdpa_consent_events
  FOR INSERT
  WITH CHECK (true);

-- Function to clean up old analytics data (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM dpdpa_rule_match_events 
  WHERE matched_at < NOW() - INTERVAL '1 year';
  
  DELETE FROM dpdpa_consent_events 
  WHERE consented_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-old-analytics', '0 0 * * 0', 'SELECT cleanup_old_analytics()');

