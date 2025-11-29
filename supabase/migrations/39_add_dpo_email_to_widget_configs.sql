-- Add DPO email column to dpdpa_widget_configs table
-- This stores the Data Protection Officer contact email for the privacy notice

ALTER TABLE public.dpdpa_widget_configs
ADD COLUMN IF NOT EXISTS dpo_email text;

-- Add comment for documentation
COMMENT ON COLUMN public.dpdpa_widget_configs.dpo_email IS 'Data Protection Officer contact email for privacy notices and data subject requests';

