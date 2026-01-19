-- Migration: Add consent_source column to dpdpa_consent_records
-- This allows tracking whether consent came from web widget, mobile SDK, or direct API
-- Date: 2026-01-19

-- Add consent_source column to dpdpa_consent_records table
ALTER TABLE public.dpdpa_consent_records
ADD COLUMN IF NOT EXISTS consent_source VARCHAR(50) DEFAULT 'web_widget'
CHECK (consent_source IN ('web_widget', 'mobile_sdk', 'api', 'privacy_centre'));

-- Add comment for documentation
COMMENT ON COLUMN public.dpdpa_consent_records.consent_source IS 
'Source of consent: web_widget (browser widget), mobile_sdk (iOS/Android/RN/Flutter), api (direct API call), privacy_centre (preference centre)';

-- Create index for filtering by consent_source
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_source 
ON public.dpdpa_consent_records(consent_source);

-- Create composite index for common query patterns (widget + source)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_source 
ON public.dpdpa_consent_records(widget_id, consent_source);

-- Backfill existing records - set all existing records to 'web_widget' (default)
-- They were all created via web widget before this migration
UPDATE public.dpdpa_consent_records
SET consent_source = 'web_widget'
WHERE consent_source IS NULL;
