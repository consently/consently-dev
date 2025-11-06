-- ============================================================================
-- ADD widget_id TO COOKIE CONSENT TABLES
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-06
-- Purpose: Add widget_id foreign key to consent_records and consent_logs
--          to enable proper widget-specific data tracking and deletion
--
-- This migration:
-- 1. Adds widget_id column to consent_records and consent_logs
-- 2. Adds foreign key constraint to widget_configs
-- 3. Creates indexes for performance
-- 4. Updates RLS policies if needed
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD widget_id TO consent_records
-- ============================================================================

-- Add widget_id column (nullable initially for existing records)
ALTER TABLE consent_records 
ADD COLUMN IF NOT EXISTS widget_id VARCHAR(100);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_consent_records_widget_id 
ON consent_records(widget_id);

-- Add foreign key constraint (with SET NULL on delete to preserve historical data)
ALTER TABLE consent_records
ADD CONSTRAINT fk_consent_records_widget 
FOREIGN KEY (widget_id) 
REFERENCES widget_configs(widget_id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN consent_records.widget_id IS 'Reference to the widget that collected this consent (NULL for legacy records)';

-- ============================================================================
-- SECTION 2: ADD widget_id TO consent_logs
-- ============================================================================

-- Add widget_id column (nullable initially for existing records)
ALTER TABLE consent_logs 
ADD COLUMN IF NOT EXISTS widget_id VARCHAR(100);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_consent_logs_widget_id 
ON consent_logs(widget_id);

-- Add foreign key constraint (with SET NULL on delete to preserve historical data)
ALTER TABLE consent_logs
ADD CONSTRAINT fk_consent_logs_widget 
FOREIGN KEY (widget_id) 
REFERENCES widget_configs(widget_id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN consent_logs.widget_id IS 'Reference to the widget that collected this consent (NULL for legacy records)';

-- ============================================================================
-- SECTION 3: CREATE COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Composite index for user + widget queries (most common pattern)
CREATE INDEX IF NOT EXISTS idx_consent_records_user_widget 
ON consent_records(user_id, widget_id);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user_widget 
ON consent_logs(user_id, widget_id);

-- Composite index for widget + date queries (for analytics)
CREATE INDEX IF NOT EXISTS idx_consent_logs_widget_created 
ON consent_logs(widget_id, created_at DESC);

-- ============================================================================
-- SECTION 4: UPDATE EXISTING RECORDS (OPTIONAL)
-- ============================================================================

-- NOTE: For existing records without widget_id, you have two options:
-- 
-- Option 1: Leave them as NULL (legacy records)
--   Pro: Simple, preserves historical data as-is
--   Con: Legacy records won't be associated with any widget
--
-- Option 2: Try to associate them with existing widgets based on user_id
--   Pro: Better data continuity
--   Con: May incorrectly associate records if user has multiple widgets
--
-- Uncomment the following if you want Option 2:

/*
-- Update consent_records with single widget per user
WITH user_widgets AS (
  SELECT DISTINCT ON (user_id) 
    user_id, 
    widget_id
  FROM widget_configs
  ORDER BY user_id, created_at ASC
)
UPDATE consent_records cr
SET widget_id = uw.widget_id
FROM user_widgets uw
WHERE cr.user_id = uw.user_id 
  AND cr.widget_id IS NULL;

-- Update consent_logs with single widget per user
WITH user_widgets AS (
  SELECT DISTINCT ON (user_id) 
    user_id, 
    widget_id
  FROM widget_configs
  ORDER BY user_id, created_at ASC
)
UPDATE consent_logs cl
SET widget_id = uw.widget_id
FROM user_widgets uw
WHERE cl.user_id = uw.user_id 
  AND cl.widget_id IS NULL;
*/

-- ============================================================================
-- SECTION 5: ADD RLS POLICIES (if needed)
-- ============================================================================

-- The existing RLS policies based on user_id will still work
-- No changes needed since widget ownership is verified through user_id

-- ============================================================================
-- SECTION 6: VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check column was added:
--    SELECT column_name, data_type, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name IN ('consent_records', 'consent_logs') 
--    AND column_name = 'widget_id';
--
-- 2. Check indexes were created:
--    SELECT indexname, tablename 
--    FROM pg_indexes 
--    WHERE tablename IN ('consent_records', 'consent_logs')
--    AND indexname LIKE '%widget_id%';
--
-- 3. Check foreign key constraints:
--    SELECT conname, conrelid::regclass, confrelid::regclass
--    FROM pg_constraint
--    WHERE conname LIKE 'fk_%_widget';
--
-- 4. Check distribution of widget_id:
--    SELECT 
--      COUNT(*) as total_records,
--      COUNT(widget_id) as records_with_widget,
--      COUNT(*) - COUNT(widget_id) as legacy_records
--    FROM consent_records;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 08 completed successfully!';
  RAISE NOTICE 'Added widget_id to:';
  RAISE NOTICE '  - consent_records';
  RAISE NOTICE '  - consent_logs';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update widget.js to send widget_id with consent submissions';
  RAISE NOTICE '2. Update consent API endpoints to store widget_id';
  RAISE NOTICE '3. Update DELETE endpoint to remove widget-specific consents';
  RAISE NOTICE '4. Test thoroughly before deploying to production';
END $$;
