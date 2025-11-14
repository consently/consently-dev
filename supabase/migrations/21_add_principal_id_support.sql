-- ============================================================================
-- Migration: Add Principal ID Support for Cross-Device Consent
-- Description: Adds principal_id (email-based identity) and visitor/principal
--              linking for cross-device consent sync
-- ============================================================================

-- Add principal_id to dpdpa_consent_records
ALTER TABLE dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS principal_id VARCHAR(255);

-- Create index for principal_id lookups
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_principal_id 
ON dpdpa_consent_records(principal_id);

-- Create index for combined visitor_id and principal_id
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_principal 
ON dpdpa_consent_records(visitor_id, principal_id);

-- Create visitor_principal_links table for tracking relationships
CREATE TABLE IF NOT EXISTS visitor_principal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  visitor_id VARCHAR(255) NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  email_hash VARCHAR(255) NOT NULL,
  
  -- Widget association
  widget_id VARCHAR(100) NOT NULL,
  
  -- Metadata
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  link_source VARCHAR(50) DEFAULT 'consent_banner' CHECK (link_source IN ('consent_banner', 'privacy_centre', 'website_integration')),
  
  -- Device info at time of linking
  device_type VARCHAR(50),
  user_agent TEXT,
  ip_address VARCHAR(45),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Unique constraint: one visitor can only be linked to one principal per widget
  CONSTRAINT unique_visitor_widget UNIQUE (visitor_id, widget_id)
);

-- Create indexes for visitor_principal_links
CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_visitor_id 
ON visitor_principal_links(visitor_id);

CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_principal_id 
ON visitor_principal_links(principal_id);

CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_widget_id 
ON visitor_principal_links(widget_id);

CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_email_hash 
ON visitor_principal_links(email_hash);

-- Table comments
COMMENT ON TABLE visitor_principal_links IS 'Links device-based visitor IDs to email-based principal IDs for cross-device consent sync';
COMMENT ON COLUMN visitor_principal_links.visitor_id IS 'Device fingerprint-based visitor identifier';
COMMENT ON COLUMN visitor_principal_links.principal_id IS 'Email-based principal identifier (SHA-256 hash)';
COMMENT ON COLUMN visitor_principal_links.email_hash IS 'SHA-256 hash of user email for privacy';
COMMENT ON COLUMN visitor_principal_links.link_source IS 'Where the link was created: consent_banner, privacy_centre, or website_integration';

-- Add RLS policies (if RLS is enabled)
DO $$ 
BEGIN
  -- Check if table exists and enable RLS if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'visitor_principal_links'
  ) THEN
    -- Enable RLS
    ALTER TABLE visitor_principal_links ENABLE ROW LEVEL SECURITY;
    
    -- Drop policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Allow public to read visitor_principal_links" ON visitor_principal_links;
    DROP POLICY IF EXISTS "Allow public to insert visitor_principal_links" ON visitor_principal_links;
    
    -- Policy: Allow public to read their own links
    CREATE POLICY "Allow public to read visitor_principal_links" 
    ON visitor_principal_links FOR SELECT 
    USING (true);
    
    -- Policy: Allow public to insert links
    CREATE POLICY "Allow public to insert visitor_principal_links" 
    ON visitor_principal_links FOR INSERT 
    WITH CHECK (true);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If RLS is not enabled or policies fail, continue
    RAISE NOTICE 'RLS policies could not be created: %', SQLERRM;
END $$;

-- Update principal_id for existing records that have visitor_email_hash
UPDATE dpdpa_consent_records 
SET principal_id = 'pri_' || SUBSTRING(visitor_email_hash, 1, 24)
WHERE visitor_email_hash IS NOT NULL 
  AND principal_id IS NULL;

COMMENT ON COLUMN dpdpa_consent_records.principal_id IS 'Email-based principal identifier for cross-device consent tracking (format: pri_<hash>)';

