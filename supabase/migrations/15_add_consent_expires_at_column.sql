-- Migration: Fix column name mismatches in dpdpa_consent_records
-- The code expects certain column names that may not match the actual database schema
-- This migration ensures all required columns exist with the correct names

-- 1. Fix consent_expires_at column (rename expires_at if it exists, or add new)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consent_expires_at'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'dpdpa_consent_records' 
      AND column_name = 'expires_at'
    ) THEN
      ALTER TABLE dpdpa_consent_records 
      RENAME COLUMN expires_at TO consent_expires_at;
      RAISE NOTICE 'Renamed expires_at to consent_expires_at';
    ELSE
      ALTER TABLE dpdpa_consent_records 
      ADD COLUMN consent_expires_at TIMESTAMP WITH TIME ZONE;
      RAISE NOTICE 'Added consent_expires_at column';
    END IF;
  END IF;
END $$;

-- 2. Fix consented_activities column (rename accepted_activities if it exists, or add new)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consented_activities'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'dpdpa_consent_records' 
      AND column_name = 'accepted_activities'
    ) THEN
      ALTER TABLE dpdpa_consent_records 
      RENAME COLUMN accepted_activities TO consented_activities;
      RAISE NOTICE 'Renamed accepted_activities to consented_activities';
    ELSE
      ALTER TABLE dpdpa_consent_records 
      ADD COLUMN consented_activities UUID[] DEFAULT ARRAY[]::UUID[];
      RAISE NOTICE 'Added consented_activities column';
    END IF;
  END IF;
END $$;

-- 3. Fix consent_given_at column (rename consent_timestamp if it exists, or add new)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consent_given_at'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'dpdpa_consent_records' 
      AND column_name = 'consent_timestamp'
    ) THEN
      ALTER TABLE dpdpa_consent_records 
      RENAME COLUMN consent_timestamp TO consent_given_at;
      RAISE NOTICE 'Renamed consent_timestamp to consent_given_at';
    ELSE
      ALTER TABLE dpdpa_consent_records 
      ADD COLUMN consent_given_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
      RAISE NOTICE 'Added consent_given_at column';
    END IF;
  END IF;
END $$;

-- 4. Fix updated_at column (rename last_updated if it exists, or add new)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'updated_at'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'dpdpa_consent_records' 
      AND column_name = 'last_updated'
    ) THEN
      ALTER TABLE dpdpa_consent_records 
      RENAME COLUMN last_updated TO updated_at;
      RAISE NOTICE 'Renamed last_updated to updated_at';
    ELSE
      ALTER TABLE dpdpa_consent_records 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
      RAISE NOTICE 'Added updated_at column';
    END IF;
  END IF;
END $$;

-- 5. Add consent_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consent_id'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN consent_id VARCHAR(255);
    
    -- Generate consent_id for existing records
    UPDATE dpdpa_consent_records 
    SET consent_id = widget_id || '_' || visitor_id || '_' || EXTRACT(EPOCH FROM created_at)::bigint || '_' || SUBSTRING(id::text, 1, 8)
    WHERE consent_id IS NULL;
    
    -- Make it NOT NULL and UNIQUE after populating
    ALTER TABLE dpdpa_consent_records 
    ALTER COLUMN consent_id SET NOT NULL;
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_id 
    ON dpdpa_consent_records(consent_id);
    
    RAISE NOTICE 'Added consent_id column';
  END IF;
END $$;

-- 6. Add privacy_notice_version column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'privacy_notice_version'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN privacy_notice_version VARCHAR(50);
    
    RAISE NOTICE 'Added privacy_notice_version column';
  END IF;
END $$;

-- 7. Add consent_details column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'consent_details'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN consent_details JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Added consent_details column';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN dpdpa_consent_records.consent_expires_at IS 'When consent expires and re-consent is required';
COMMENT ON COLUMN dpdpa_consent_records.consent_id IS 'Unique consent transaction ID';
COMMENT ON COLUMN dpdpa_consent_records.consent_given_at IS 'Timestamp when consent was given';
COMMENT ON COLUMN dpdpa_consent_records.privacy_notice_version IS 'Version tracking for privacy notice updates';
COMMENT ON COLUMN dpdpa_consent_records.consent_details IS 'Detailed consent data including activity consents, purpose-level consent, rule context, and metadata';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_expires_at 
ON dpdpa_consent_records(consent_expires_at);

CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_given_at 
ON dpdpa_consent_records(consent_given_at DESC);

-- GIN index for consented_activities array
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consented_activities 
ON dpdpa_consent_records USING GIN(consented_activities);

-- GIN index for consent_details JSONB
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_details 
ON dpdpa_consent_records USING GIN(consent_details);

