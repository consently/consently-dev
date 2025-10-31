-- Migration: Link all existing cookie widgets to default banner templates
-- This fixes the issue where widgets without banner_template_id show default "We value your privacy" text
-- Created: 2025-10-31

-- Step 1: Create default banner templates for users who don't have any banners yet
INSERT INTO banner_configs (
  user_id,
  name,
  description,
  position,
  layout,
  theme,
  title,
  message,
  privacy_policy_url,
  privacy_policy_text,
  accept_button,
  reject_button,
  settings_button,
  show_reject_button,
  show_settings_button,
  auto_show,
  show_after_delay,
  respect_dnt,
  block_content,
  z_index,
  is_active,
  is_default
)
SELECT DISTINCT
  wc.user_id,
  'Default Cookie Consent Banner',
  'Auto-generated default banner template for cookie consent',
  'bottom',
  'bar',
  jsonb_build_object(
    'primaryColor', '#3b82f6',
    'secondaryColor', '#1e40af',
    'backgroundColor', '#ffffff',
    'textColor', '#1f2937',
    'fontFamily', 'system-ui, sans-serif',
    'fontSize', 14,
    'borderRadius', 8,
    'boxShadow', true
  ),
  'Cookie Consent',
  'We use cookies to improve your experience on our website. By browsing this website, you agree to our use of cookies.',
  NULL, -- privacy_policy_url
  'Privacy Policy',
  jsonb_build_object(
    'text', 'Accept All',
    'backgroundColor', '#3b82f6',
    'textColor', '#ffffff',
    'borderRadius', 8
  ),
  jsonb_build_object(
    'text', 'Reject All',
    'backgroundColor', '#ffffff',
    'textColor', '#3b82f6',
    'borderColor', '#3b82f6',
    'borderRadius', 8
  ),
  jsonb_build_object(
    'text', 'Cookie Settings',
    'backgroundColor', '#f3f4f6',
    'textColor', '#1f2937',
    'borderRadius', 8
  ),
  true, -- show_reject_button
  true, -- show_settings_button
  true, -- auto_show
  0, -- show_after_delay
  false, -- respect_dnt
  false, -- block_content
  9999, -- z_index
  true, -- is_active
  true -- is_default
FROM widget_configs wc
LEFT JOIN banner_configs bc ON bc.user_id = wc.user_id
WHERE bc.id IS NULL
ON CONFLICT DO NOTHING;

-- Step 2: Link all widgets without banner_template_id to their user's default banner
UPDATE widget_configs wc
SET banner_template_id = (
  SELECT bc.id
  FROM banner_configs bc
  WHERE bc.user_id = wc.user_id
    AND bc.is_default = true
    AND bc.is_active = true
  ORDER BY bc.created_at DESC
  LIMIT 1
)
WHERE wc.banner_template_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM banner_configs bc
    WHERE bc.user_id = wc.user_id
      AND bc.is_default = true
      AND bc.is_active = true
  );

-- Step 3: Log the migration results
DO $$
DECLARE
  widgets_updated INTEGER;
  banners_created INTEGER;
BEGIN
  -- Count widgets that now have banner templates
  SELECT COUNT(*)
  INTO widgets_updated
  FROM widget_configs
  WHERE banner_template_id IS NOT NULL;
  
  -- Count total default banners
  SELECT COUNT(*)
  INTO banners_created
  FROM banner_configs
  WHERE is_default = true;
  
  RAISE NOTICE 'Migration complete: % widgets linked to banner templates, % default banners exist',
    widgets_updated, banners_created;
END $$;
