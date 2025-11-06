-- Migration to insert the Consently Contact Us widget into production
-- This is a one-time migration for the widget created in development
-- All future widgets will be created through the dashboard and stored automatically

-- IMPORTANT: Replace 'YOUR_PRODUCTION_USER_ID' with your actual production user ID
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- First, ensure the processing activity exists (or create it)
-- If the activity already exists in production with a different ID, use that ID instead
INSERT INTO processing_activities (
  id,
  user_id,
  activity_name,
  industry,
  data_attributes,
  purpose,
  retention_period,
  data_processors,
  is_active,
  legal_basis
) VALUES (
  '16e9e168-d13e-40c3-8ed4-2f4e92863f7b',
  '6ffc87c3-64a2-4d24-9c61-15a641e59026', -- REPLACE THIS
  'Contact Form Submissions',
  'other',
  ARRAY[]::text[],
  NULL,
  NULL,
  '[]'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO NOTHING; -- Skip if activity already exists

-- Insert the widget configuration
INSERT INTO dpdpa_widget_configs (
  widget_id,
  user_id,
  name,
  domain,
  position,
  layout,
  theme,
  title,
  message,
  accept_button_text,
  reject_button_text,
  customize_button_text,
  selected_activities,
  auto_show,
  show_after_delay,
  consent_duration,
  respect_dnt,
  require_explicit_consent,
  show_data_subjects_rights,
  language,
  custom_translations,
  enable_analytics,
  enable_audit_log,
  show_branding,
  custom_css,
  is_active,
  supported_languages,
  privacy_notice_version,
  privacy_notice_last_updated,
  requires_reconsent
) VALUES (
  'dpdpa_mheon92d_o34gdpk',
  '6ffc87c3-64a2-4d24-9c61-15a641e59026', -- REPLACE THIS
  'Consently Contact us',
  'Consently.in',
  'modal',
  'modal',
  '{"logoUrl": "https://skjfzeunsqaayqarotjo.supabase.co/storage/v1/object/public/logos/6ffc87c3-64a2-4d24-9c61-15a641e59026/1762409642652_ujh3xsx.png", "textColor": "#1f2937", "borderRadius": 7, "primaryColor": "#3b82f6", "backgroundColor": "#ffffff"}'::jsonb,
  'Your Data Privacy Rights',
  'We process your personal data with your consent. Please review the activities below and choose your preferences. ',
  'Accept All',
  'Reject All',
  'Manage Preferences',
  ARRAY['16e9e168-d13e-40c3-8ed4-2f4e92863f7b']::uuid[],
  true,
  1000,
  365,
  false,
  true,
  true,
  'en',
  '{}'::jsonb,
  true,
  true,
  true,
  NULL,
  true,
  ARRAY['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as']::text[],
  NULL,
  NULL,
  false
)
ON CONFLICT (widget_id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  position = EXCLUDED.position,
  layout = EXCLUDED.layout,
  theme = EXCLUDED.theme,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  accept_button_text = EXCLUDED.accept_button_text,
  reject_button_text = EXCLUDED.reject_button_text,
  customize_button_text = EXCLUDED.customize_button_text,
  selected_activities = EXCLUDED.selected_activities,
  auto_show = EXCLUDED.auto_show,
  show_after_delay = EXCLUDED.show_after_delay,
  consent_duration = EXCLUDED.consent_duration,
  respect_dnt = EXCLUDED.respect_dnt,
  require_explicit_consent = EXCLUDED.require_explicit_consent,
  show_data_subjects_rights = EXCLUDED.show_data_subjects_rights,
  language = EXCLUDED.language,
  supported_languages = EXCLUDED.supported_languages,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
