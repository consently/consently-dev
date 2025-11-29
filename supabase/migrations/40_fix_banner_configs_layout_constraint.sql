-- Migration: Fix banner_configs layout check constraint
-- The API allows 'banner' as a layout option but the database constraint was missing it

-- Drop the existing constraint and add a new one that includes 'banner'
ALTER TABLE banner_configs 
DROP CONSTRAINT IF EXISTS banner_configs_layout_check;

ALTER TABLE banner_configs 
ADD CONSTRAINT banner_configs_layout_check 
CHECK (layout = ANY (ARRAY['bar'::text, 'box'::text, 'modal'::text, 'popup'::text, 'inline'::text, 'floating'::text, 'banner'::text]));

