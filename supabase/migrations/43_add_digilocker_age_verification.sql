-- Migration: Add DigiLocker Age Verification table
-- Description: Store DigiLocker OAuth tokens and age verification results for users

-- Create the digilocker_verifications table
CREATE TABLE IF NOT EXISTS digilocker_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    digilocker_id VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    dob_raw VARCHAR(8) NOT NULL, -- DDMMYYYY format from DigiLocker
    date_of_birth DATE NOT NULL, -- ISO format 2005-12-31
    age_at_verification INTEGER NOT NULL,
    is_adult BOOLEAN NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'T', 'O')),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consent_valid_till TIMESTAMP WITH TIME ZONE, -- From API (31 days typically)
    reference_key VARCHAR(64),
    eaadhaar_linked BOOLEAN DEFAULT false,
    issuer_id VARCHAR(50) DEFAULT 'in.consently',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_digilocker_user ON digilocker_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_digilocker_adult ON digilocker_verifications(is_adult) WHERE is_adult = true;
CREATE INDEX IF NOT EXISTS idx_digilocker_consent_valid ON digilocker_verifications(consent_valid_till);
CREATE INDEX IF NOT EXISTS idx_digilocker_created_at ON digilocker_verifications(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE digilocker_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own verification records
CREATE POLICY digilocker_verifications_select_own
    ON digilocker_verifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can only insert their own verification records
CREATE POLICY digilocker_verifications_insert_own
    ON digilocker_verifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own verification records
CREATE POLICY digilocker_verifications_update_own
    ON digilocker_verifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can only delete their own verification records
CREATE POLICY digilocker_verifications_delete_own
    ON digilocker_verifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Policy: Service role can perform all operations (for backend processing)
CREATE POLICY digilocker_verifications_service_all
    ON digilocker_verifications
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_digilocker_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_digilocker_verifications_updated_at ON digilocker_verifications;

CREATE TRIGGER trigger_digilocker_verifications_updated_at
    BEFORE UPDATE ON digilocker_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_digilocker_verifications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE digilocker_verifications IS 'Stores DigiLocker OAuth tokens and age verification results for users';
COMMENT ON COLUMN digilocker_verifications.dob_raw IS 'Raw DOB string from DigiLocker in DDMMYYYY format';
COMMENT ON COLUMN digilocker_verifications.age_at_verification IS 'Calculated age at the time of verification';
COMMENT ON COLUMN digilocker_verifications.is_adult IS 'True if age >= 18 at time of verification';
COMMENT ON COLUMN digilocker_verifications.consent_valid_till IS 'DigiLocker consent validity period (typically 31 days)';
COMMENT ON COLUMN digilocker_verifications.eaadhaar_linked IS 'Whether the user has eAadhaar linked in DigiLocker';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added digilocker_verifications table with RLS policies';
END $$;
