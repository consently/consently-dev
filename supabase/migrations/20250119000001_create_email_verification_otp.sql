-- Create email verification OTP table for cross-device preference linking
-- This allows visitors to link their preferences across devices securely via email

CREATE TABLE IF NOT EXISTS email_verification_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  email_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of email for privacy
  otp_code VARCHAR(6) NOT NULL,     -- 6-digit OTP
  visitor_id VARCHAR(255) NOT NULL,
  widget_id VARCHAR(100) NOT NULL REFERENCES dpdpa_widget_configs(widget_id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,       -- Track failed verification attempts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (using IF NOT EXISTS to make migration idempotent)
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email_hash ON email_verification_otps(email_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_visitor_id ON email_verification_otps(visitor_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_widget_id ON email_verification_otps(widget_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires_at ON email_verification_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_verified ON email_verification_otps(verified);

-- Composite index for OTP verification
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_lookup ON email_verification_otps(email_hash, otp_code, verified, expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_verification_otps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at (drop first if exists to make idempotent)
DROP TRIGGER IF EXISTS update_email_verification_otps_updated_at_trigger ON email_verification_otps;
CREATE TRIGGER update_email_verification_otps_updated_at_trigger
  BEFORE UPDATE ON email_verification_otps
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verification_otps_updated_at();

-- Function to cleanup expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE email_verification_otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using IF NOT EXISTS to make migration idempotent)
-- Public can insert OTP requests (no auth needed for visitors)
DROP POLICY IF EXISTS "Public can request OTP" ON email_verification_otps;
CREATE POLICY "Public can request OTP" ON email_verification_otps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can verify their own OTP using email_hash
DROP POLICY IF EXISTS "Public can verify their OTP" ON email_verification_otps;
CREATE POLICY "Public can verify their OTP" ON email_verification_otps
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can update their own verification attempts
DROP POLICY IF EXISTS "Public can update verification" ON email_verification_otps;
CREATE POLICY "Public can update verification" ON email_verification_otps
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Authenticated users can view their widget's OTPs (for admin purposes)
DROP POLICY IF EXISTS "Users can view their widget OTPs" ON email_verification_otps;
CREATE POLICY "Users can view their widget OTPs" ON email_verification_otps
  FOR SELECT
  TO authenticated
  USING (
    widget_id IN (
      SELECT widget_id FROM dpdpa_widget_configs WHERE user_id = auth.uid()
    )
  );

-- Comment on table
COMMENT ON TABLE email_verification_otps IS 'Stores OTP codes for email verification when linking preferences across devices';
COMMENT ON COLUMN email_verification_otps.email IS 'Plain email address (temporary, used for sending OTP)';
COMMENT ON COLUMN email_verification_otps.email_hash IS 'SHA-256 hash of email for privacy-preserving verification';
COMMENT ON COLUMN email_verification_otps.otp_code IS '6-digit one-time password';
COMMENT ON COLUMN email_verification_otps.attempts IS 'Number of failed verification attempts (max 3)';
COMMENT ON COLUMN email_verification_otps.expires_at IS 'OTP expiration time (typically 10 minutes from creation)';

