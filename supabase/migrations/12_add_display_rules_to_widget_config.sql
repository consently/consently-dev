-- Migration: Add display_rules support to widget configs
-- This enables page-specific notices without requiring new tables
-- For full implementation, see MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md

-- Add display_rules JSONB column to store URL-based rules
ALTER TABLE dpdpa_widget_configs 
ADD COLUMN IF NOT EXISTS display_rules JSONB DEFAULT '[]'::jsonb;

-- Add index for performance (GIN index for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_display_rules 
ON dpdpa_widget_configs USING GIN (display_rules);

-- Add comment
COMMENT ON COLUMN dpdpa_widget_configs.display_rules IS 
'Array of display rules for page-specific notices. Each rule contains: 
{
  "id": "unique_rule_id",
  "rule_name": "Human readable name",
  "url_pattern": "/careers",
  "url_match_type": "contains|exact|startsWith|regex",
  "trigger_type": "onPageLoad|onClick|onFormSubmit|onScroll",
  "trigger_delay": 1000,
  "element_selector": "#formId (optional)",
  "notice_id": "notice_identifier",
  "notice_content": {
    "title": "Notice title",
    "message": "Notice message",
    "html": "<p>HTML content</p>"
  },
  "priority": 100,
  "is_active": true
}';

-- Apply display rules for careers and contact pages
UPDATE dpdpa_widget_configs
SET display_rules = jsonb_build_array(
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
      'message', 'We need your consent to process your job application data under DPDPA 2023.',
      'html', '<p>By submitting your application, you consent to us processing your personal data including name, email, phone number, and resume for recruitment purposes.</p>'
    )
  ),
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
      'message', 'We need your consent to process your contact form data under DPDPA 2023.',
      'html', '<p>By submitting this form, you consent to us processing your personal data including name, email, and message for responding to your inquiry.</p>'
    )
  )
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';


