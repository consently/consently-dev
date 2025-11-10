-- Example SQL script to set up page-specific notices
-- This creates display rules for careers and contact pages
-- Run this after running migration 12_add_display_rules_to_widget_config.sql

-- Replace 'dpdpa_mhnhpimc_atq70ak' with your actual widget_id
-- Replace the notice content with your actual privacy notice text

UPDATE dpdpa_widget_configs
SET display_rules = jsonb_build_array(
  -- Rule 1: Careers Page Notice
  jsonb_build_object(
    'id', 'careers_rule_1',
    'rule_name', 'Careers Page Notice',
    'url_pattern', '/careers',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'careers_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'Career Application Consent',
      'message', 'We need your consent to process your job application data under DPDPA 2023. This includes your name, email, phone number, resume, and cover letter for recruitment purposes.',
      'html', '<div style="padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">Career Application Data Processing</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280;">By submitting your application, you consent to us processing the following personal data:</p>
        <ul style="margin: 8px 0; color: #6b7280; padding-left: 20px;">
          <li>Name and contact information</li>
          <li>Resume and cover letter</li>
          <li>Employment history and qualifications</li>
          <li>Any other information you provide</li>
        </ul>
        <p style="margin: 8px 0 0 0; color: #6b7280;"><strong>Purpose:</strong> Recruitment and candidate evaluation</p>
        <p style="margin: 8px 0 0 0; color: #6b7280;"><strong>Retention:</strong> Data will be retained for 2 years or until you request deletion, whichever is earlier.</p>
      </div>'
    )
  ),
  
  -- Rule 2: Contact Page Notice
  jsonb_build_object(
    'id', 'contact_rule_1',
    'rule_name', 'Contact Page Notice',
    'url_pattern', '/contact',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'contact_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'Contact Form Consent',
      'message', 'We need your consent to process your contact form data under DPDPA 2023. This includes your name, email, company, and message for responding to your inquiry.',
      'html', '<div style="padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">Contact Form Data Processing</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280;">By submitting this form, you consent to us processing the following personal data:</p>
        <ul style="margin: 8px 0; color: #6b7280; padding-left: 20px;">
          <li>Name and email address</li>
          <li>Company name (if provided)</li>
          <li>Your message and inquiry details</li>
        </ul>
        <p style="margin: 8px 0 0 0; color: #6b7280;"><strong>Purpose:</strong> Responding to your inquiry and providing customer support</p>
        <p style="margin: 8px 0 0 0; color: #6b7280;"><strong>Retention:</strong> Data will be retained for 1 year or until you request deletion, whichever is earlier.</p>
      </div>'
    )
  )
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';

-- Verify the update
SELECT 
  widget_id,
  name,
  jsonb_array_length(display_rules) as rules_count,
  display_rules
FROM dpdpa_widget_configs
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';

-- To disable a rule, you can update it:
/*
UPDATE dpdpa_widget_configs
SET display_rules = jsonb_set(
  display_rules,
  '{0,is_active}',
  'false'::jsonb
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';
*/

-- To add a new rule, you can append to the array:
/*
UPDATE dpdpa_widget_configs
SET display_rules = display_rules || jsonb_build_array(
  jsonb_build_object(
    'id', 'new_rule_1',
    'rule_name', 'New Page Notice',
    'url_pattern', '/new-page',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'new_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'New Page Consent',
      'message', 'Your consent message here',
      'html', '<p>Your HTML content here</p>'
    )
  )
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';
*/


