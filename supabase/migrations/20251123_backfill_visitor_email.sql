-- ============================================================================
-- Migration: Backfill visitor_email in existing consent records
-- Description: Populates visitor_email field for records that have email_hash
--              by looking up emails in the email_verification_otps table
-- Date: 2025-11-23
-- ============================================================================

-- This migration is SAFE to run multiple times (idempotent)
-- It only updates records where visitor_email is NULL

DO $$
DECLARE
  updated_count INTEGER := 0;
  total_records INTEGER;
  records_with_hash INTEGER;
  records_needing_backfill INTEGER;
BEGIN
  -- Get statistics before backfill
  SELECT COUNT(*) INTO total_records
  FROM dpdpa_consent_records;
  
  SELECT COUNT(*) INTO records_with_hash
  FROM dpdpa_consent_records
  WHERE visitor_email_hash IS NOT NULL;
  
  SELECT COUNT(*) INTO records_needing_backfill
  FROM dpdpa_consent_records
  WHERE visitor_email_hash IS NOT NULL
    AND visitor_email IS NULL;
  
  RAISE NOTICE '📊 Backfill Statistics (Before):';
  RAISE NOTICE '   Total consent records: %', total_records;
  RAISE NOTICE '   Records with email hash: %', records_with_hash;
  RAISE NOTICE '   Records needing backfill: %', records_needing_backfill;
  
  IF records_needing_backfill = 0 THEN
    RAISE NOTICE '✅ No records need backfilling. All done!';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Starting backfill process...';
  
  -- Update consent records with emails from OTP table
  -- Use the most recent verified OTP for each email hash
  UPDATE dpdpa_consent_records AS cr
  SET visitor_email = otp.email
  FROM (
    SELECT DISTINCT ON (email_hash)
      email_hash,
      email
    FROM email_verification_otps
    WHERE email IS NOT NULL
      AND email_hash IS NOT NULL
      AND verified = TRUE  -- Only use verified emails
    ORDER BY email_hash, verified_at DESC NULLS LAST, created_at DESC
  ) AS otp
  WHERE cr.visitor_email_hash = otp.email_hash
    AND cr.visitor_email IS NULL;  -- Only update records without email
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Backfill complete!';
  RAISE NOTICE '   Records updated: %', updated_count;
  
  -- Get statistics after backfill
  SELECT COUNT(*) INTO records_needing_backfill
  FROM dpdpa_consent_records
  WHERE visitor_email_hash IS NOT NULL
    AND visitor_email IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Backfill Statistics (After):';
  RAISE NOTICE '   Records still needing backfill: %', records_needing_backfill;
  
  IF records_needing_backfill > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: % records still have email_hash but no email', records_needing_backfill;
    RAISE NOTICE '   This could be because:';
    RAISE NOTICE '   - The OTP was never verified';
    RAISE NOTICE '   - The OTP has been cleaned up/expired';
    RAISE NOTICE '   - The email was entered differently (case/whitespace)';
  END IF;
END $$;
