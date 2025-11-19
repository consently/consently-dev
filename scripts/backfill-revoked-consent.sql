-- ============================================================================
-- Backfill Revocation Data for Existing Records
-- ============================================================================
-- This script fixes existing consent records that have status='revoked'
-- but are missing revoked_at timestamp and revocation_reason
--
-- Run this AFTER deploying the revocation fix to production
-- ============================================================================

-- First, let's check how many records need backfilling
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM dpdpa_consent_records
  WHERE consent_status = 'revoked'
    AND revoked_at IS NULL;
  
  RAISE NOTICE 'Found % records with missing revocation data', missing_count;
END $$;

-- Display the records that will be updated (for verification)
SELECT 
  id,
  widget_id,
  visitor_id,
  consent_id,
  consent_status,
  revoked_at,
  revocation_reason,
  created_at,
  updated_at,
  -- Use updated_at as best estimate for when revocation occurred
  updated_at AS estimated_revoked_at
FROM dpdpa_consent_records
WHERE consent_status = 'revoked'
  AND revoked_at IS NULL
ORDER BY updated_at DESC;

-- Pause here and review the output before proceeding
-- Uncomment the UPDATE statement below when ready to apply the fix

/*
-- ============================================================================
-- BACKFILL UPDATE - Uncomment to execute
-- ============================================================================
-- This update will:
-- 1. Set revoked_at to the updated_at timestamp (best available estimate)
-- 2. Set revocation_reason to indicate this is backfilled data
-- ============================================================================

UPDATE dpdpa_consent_records
SET 
  revoked_at = updated_at,
  revocation_reason = CASE 
    WHEN revocation_reason IS NULL OR revocation_reason = '' 
    THEN 'Revocation (backfilled - exact timestamp may vary)'
    ELSE revocation_reason
  END
WHERE consent_status = 'revoked'
  AND revoked_at IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as updated_count,
  MIN(revoked_at) as earliest_revocation,
  MAX(revoked_at) as latest_revocation
FROM dpdpa_consent_records
WHERE consent_status = 'revoked'
  AND revocation_reason LIKE '%backfilled%';

RAISE NOTICE 'Backfill complete. Updated % records.', ROW_COUNT;
*/

-- ============================================================================
-- Alternative: More Conservative Update
-- ============================================================================
-- If you want to preserve updated_at for other purposes, you can use created_at
-- or set revoked_at to current timestamp with a note in the reason
-- ============================================================================

/*
-- Option 2: Use created_at as estimate
UPDATE dpdpa_consent_records
SET 
  revoked_at = created_at,
  revocation_reason = 'Revocation (backfilled using created_at)'
WHERE consent_status = 'revoked'
  AND revoked_at IS NULL;
*/

/*
-- Option 3: Use current timestamp (least accurate but clearly marked)
UPDATE dpdpa_consent_records
SET 
  revoked_at = NOW(),
  revocation_reason = 'Revocation (backfilled on ' || NOW()::date || ' - actual date may be earlier)'
WHERE consent_status = 'revoked'
  AND revoked_at IS NULL;
*/

-- ============================================================================
-- Verification Query
-- ============================================================================
-- After running the backfill, verify all revoked records now have data
SELECT 
  COUNT(*) as total_revoked_records,
  COUNT(CASE WHEN revoked_at IS NOT NULL THEN 1 END) as records_with_timestamp,
  COUNT(CASE WHEN revocation_reason IS NOT NULL THEN 1 END) as records_with_reason,
  COUNT(CASE WHEN revoked_at IS NULL THEN 1 END) as records_still_missing
FROM dpdpa_consent_records
WHERE consent_status = 'revoked';

-- Expected result:
-- total_revoked_records = X
-- records_with_timestamp = X (should equal total)
-- records_with_reason = X (should equal total)
-- records_still_missing = 0 (should be zero)

-- ============================================================================
-- Audit Query - Check Revocation Distribution
-- ============================================================================
SELECT 
  DATE(revoked_at) as revocation_date,
  COUNT(*) as revocations,
  COUNT(CASE WHEN revocation_reason LIKE '%backfilled%' THEN 1 END) as backfilled,
  COUNT(CASE WHEN revocation_reason NOT LIKE '%backfilled%' THEN 1 END) as original
FROM dpdpa_consent_records
WHERE consent_status = 'revoked'
  AND revoked_at IS NOT NULL
GROUP BY DATE(revoked_at)
ORDER BY revocation_date DESC
LIMIT 30;

