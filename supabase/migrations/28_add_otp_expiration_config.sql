-- Migration: Add configurable OTP expiration to widget configs
-- This allows each widget to have its own OTP expiration time
-- Default: 10 minutes (matching current hardcoded value)

-- Add otp_expiration_minutes column to dpdpa_widget_configs
ALTER TABLE dpdpa_widget_configs
ADD COLUMN IF NOT EXISTS otp_expiration_minutes INTEGER DEFAULT 10;

-- Add comment
COMMENT ON COLUMN dpdpa_widget_configs.otp_expiration_minutes IS 'OTP expiration time in minutes for email verification (default: 10 minutes)';

-- Add check constraint to ensure reasonable values (1-60 minutes)
ALTER TABLE dpdpa_widget_configs
ADD CONSTRAINT otp_expiration_minutes_range CHECK (otp_expiration_minutes >= 1 AND otp_expiration_minutes <= 60);

-- Update existing widgets to have the default value
UPDATE dpdpa_widget_configs
SET otp_expiration_minutes = 10
WHERE otp_expiration_minutes IS NULL;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_widget_created 
ON email_verification_otps(widget_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_otps_verified 
ON email_verification_otps(verified, created_at DESC);

-- Create analytics tracking table for email verification events
CREATE TABLE IF NOT EXISTS email_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('otp_sent', 'otp_verified', 'otp_failed', 'otp_skipped', 'rate_limited')),
  email_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to widget
  CONSTRAINT fk_email_verification_events_widget
    FOREIGN KEY (widget_id)
    REFERENCES dpdpa_widget_configs(widget_id)
    ON DELETE CASCADE
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_email_verification_events_widget_created 
ON email_verification_events(widget_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_events_type_created 
ON email_verification_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_events_visitor 
ON email_verification_events(visitor_id, created_at DESC);

-- Add comment
COMMENT ON TABLE email_verification_events IS 'Tracks email verification events for analytics and monitoring';
COMMENT ON COLUMN email_verification_events.event_type IS 'Type of event: otp_sent, otp_verified, otp_failed, otp_skipped, rate_limited';
COMMENT ON COLUMN email_verification_events.metadata IS 'Additional event metadata (e.g., error messages, attempt count, device info)';

-- Enable RLS on the new table
ALTER TABLE email_verification_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users with access to the widget can view events
CREATE POLICY email_verification_events_select_policy ON email_verification_events
  FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert events
CREATE POLICY email_verification_events_insert_policy ON email_verification_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);
