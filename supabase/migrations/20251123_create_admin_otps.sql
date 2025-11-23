-- Create admin OTP table for secure actions (like exporting data)
CREATE TABLE IF NOT EXISTS admin_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_otps_user_id ON admin_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_otps_expires_at ON admin_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_otps_verified ON admin_otps(verified);

-- RLS Policies
ALTER TABLE admin_otps ENABLE ROW LEVEL SECURITY;

-- Users can insert their own OTPs (via server function usually, but good to have policy)
CREATE POLICY "Users can insert their own OTPs" ON admin_otps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own OTPs
CREATE POLICY "Users can view their own OTPs" ON admin_otps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own OTPs (for verification attempts)
CREATE POLICY "Users can update their own OTPs" ON admin_otps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE admin_otps IS 'Stores OTP codes for authenticated admin actions like data export';
