-- ============================================================================
-- QUICK FIX: Add Visitor Email Columns
-- Run this in Supabase SQL Editor to add missing email columns
-- ============================================================================

-- Step 1: Add visitor_email_hash to dpdpa_consent_records
ALTER TABLE public.dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64);

-- Step 2: Add visitor_email to dpdpa_consent_records
ALTER TABLE public.dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email TEXT;

-- Step 3: Add visitor_email_hash to visitor_consent_preferences
ALTER TABLE public.visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64);

-- Step 4: Add visitor_email to visitor_consent_preferences
ALTER TABLE public.visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email TEXT;

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_email_hash 
ON public.dpdpa_consent_records(visitor_email_hash) 
WHERE visitor_email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_preferences_email_hash 
ON public.visitor_consent_preferences(visitor_email_hash) 
WHERE visitor_email_hash IS NOT NULL;

-- Step 6: Add column comments
COMMENT ON COLUMN public.dpdpa_consent_records.visitor_email_hash IS 
  'SHA-256 hash of visitor email for cross-device consent management';

COMMENT ON COLUMN public.dpdpa_consent_records.visitor_email IS 
  'Optional verified email shown in admin dashboard (only visible when Show Emails is clicked)';

COMMENT ON COLUMN public.visitor_consent_preferences.visitor_email_hash IS 
  'SHA-256 hash of visitor email for cross-device consent management';

COMMENT ON COLUMN public.visitor_consent_preferences.visitor_email IS 
  'Optional verified email shown in admin dashboard';

-- Step 7: Verification - check if columns exist
SELECT 
    'dpdpa_consent_records' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email_hash'
    ) as has_email_hash,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dpdpa_consent_records' 
        AND column_name = 'visitor_email'
    ) as has_email
UNION ALL
SELECT 
    'visitor_consent_preferences' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email_hash'
    ) as has_email_hash,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visitor_consent_preferences' 
        AND column_name = 'visitor_email'
    ) as has_email;

-- Expected output: All rows should show 'true' for both has_email_hash and has_email

