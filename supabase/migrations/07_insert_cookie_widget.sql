-- ============================================================================
-- INSERT COOKIE WIDGET FOR www.consently.in
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-06
-- Purpose: Insert the cookie widget configuration that's being used
-- ============================================================================

-- IMPORTANT: Replace this user_id with your actual production user ID
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
DO $$
DECLARE
  v_user_id UUID := '6ffc87c3-64a2-4d24-9c61-15a641e59026'; -- REPLACE WITH YOUR USER ID
  v_banner_id UUID;
BEGIN
  -- First, create a banner template
  INSERT INTO banner_configs (
    user_id,
    name,
    description,
    position,
    layout,
    theme,
    title,
    message,
    privacy_policy_text,
    cookie_policy_text,
    terms_text,
    accept_button,
    reject_button,
    settings_button,
    show_reject_button,
    show_settings_button,
    auto_show,
    show_after_delay,
    is_active,
    is_default
  ) VALUES (
    v_user_id,
    'Cookie Banner for www.consently.in',
    'Default cookie consent banner for Consently website',
    'center',
    'modal',
    jsonb_build_object(
      'fontSize', 14,
      'boxShadow', true,
      'textColor', '#1f2937',
      'fontFamily', 'Roboto, sans-serif',
      'borderRadius', 6,
      'primaryColor', '#3b82f6',
      'secondaryColor', '#1e40af',
      'backgroundColor', '#ffffff',
      'logoUrl', 'https://skjfzeunsqaayqarotjo.supabase.co/storage/v1/object/public/logos/6ffc87c3-64a2-4d24-9c61-15a641e59026/1761972871817_wbk116y.png'
    ),
    'Cookie Consent ',
    'This website uses cookies to enhance your experience. We have detected 0 cookies across 0 categories. Please review and customize your preferences.',
    'Privacy Policy',
    'Cookie Policy',
    'Terms & Conditions',
    jsonb_build_object(
      'text', 'Allow all',
      'fontSize', 14,
      'textColor', '#ffffff',
      'fontWeight', 'semibold',
      'borderRadius', 6,
      'backgroundColor', '#3b82f6'
    ),
    jsonb_build_object(
      'text', 'Reject all',
      'fontSize', 14,
      'textColor', '#3b82f6',
      'fontWeight', 'medium',
      'borderColor', '#3b82f6',
      'borderRadius', 6,
      'backgroundColor', '#ffffff'
    ),
    jsonb_build_object(
      'text', 'Adjust Preferences',
      'fontSize', 14,
      'textColor', '#1f2937',
      'fontWeight', 'normal',
      'borderRadius', 6,
      'backgroundColor', '#f3f4f6'
    ),
    true,
    true,
    true,
    1000,
    true,
    true
  )
  RETURNING id INTO v_banner_id;

  RAISE NOTICE 'Created banner template with ID: %', v_banner_id;

  -- Now insert the widget config
  INSERT INTO widget_configs (
    user_id,
    widget_id,
    domain,
    categories,
    behavior,
    consent_duration,
    show_branding_link,
    block_scripts,
    respect_dnt,
    gdpr_applies,
    auto_block,
    banner_template_id,
    language,
    supported_languages,
    is_active
  ) VALUES (
    v_user_id,
    'cnsty_mhc0ouby_9tmvy18rd',
    'www.consently.in',
    ARRAY['necessary', 'preferences', 'analytics', 'marketing', 'social']::TEXT[],
    'explicit',
    365,
    true,
    true,
    false,
    true,
    ARRAY[]::TEXT[],
    v_banner_id,
    'en',
    ARRAY['en', 'hi', 'bn', 'ta', 'te', 'mr', 'pa', 'gu', 'kn', 'ur', 'or', 'ml']::TEXT[],
    true
  )
  ON CONFLICT (widget_id) DO UPDATE SET
    domain = EXCLUDED.domain,
    categories = EXCLUDED.categories,
    behavior = EXCLUDED.behavior,
    consent_duration = EXCLUDED.consent_duration,
    show_branding_link = EXCLUDED.show_branding_link,
    block_scripts = EXCLUDED.block_scripts,
    respect_dnt = EXCLUDED.respect_dnt,
    gdpr_applies = EXCLUDED.gdpr_applies,
    auto_block = EXCLUDED.auto_block,
    banner_template_id = EXCLUDED.banner_template_id,
    language = EXCLUDED.language,
    supported_languages = EXCLUDED.supported_languages,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE '✅ Widget cnsty_mhc0ouby_9tmvy18rd created/updated successfully!';
  RAISE NOTICE 'Linked to banner template: %', v_banner_id;
END $$;
