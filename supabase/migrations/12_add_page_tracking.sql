-- ============================================================================
-- ADD PAGE TRACKING TO DPDPA CONSENT RECORDS
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-07
-- Purpose: Add current_url and page_title tracking to consent records
--          to enable multi-page preference centre features
-- ============================================================================

DO $$ 
BEGIN
  -- Add current_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'current_url'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN current_url TEXT;
    RAISE NOTICE 'Added column: current_url';
  END IF;

  -- Add page_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dpdpa_consent_records' 
    AND column_name = 'page_title'
  ) THEN
    ALTER TABLE dpdpa_consent_records 
    ADD COLUMN page_title VARCHAR(500);
    RAISE NOTICE 'Added column: page_title';
  END IF;
END $$;

-- Add indexes for performance
DO $$
BEGIN
  -- Index for widget_id + current_url queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_consent_records_current_url'
  ) THEN
    CREATE INDEX idx_consent_records_current_url 
    ON dpdpa_consent_records(widget_id, current_url);
    RAISE NOTICE 'Created index: idx_consent_records_current_url';
  END IF;

  -- Index for visitor_id + current_url queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_consent_records_visitor_url'
  ) THEN
    CREATE INDEX idx_consent_records_visitor_url 
    ON dpdpa_consent_records(visitor_id, widget_id, current_url);
    RAISE NOTICE 'Created index: idx_consent_records_visitor_url';
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN dpdpa_consent_records.current_url IS 'The page URL where consent was given';
COMMENT ON COLUMN dpdpa_consent_records.page_title IS 'The page title where consent was given';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Page tracking columns added successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update widget JavaScript to send current_url and page_title';
  RAISE NOTICE '  2. Update consent-record API to store these fields';
  RAISE NOTICE '  3. Build Privacy Centre pages view';
END $$;
