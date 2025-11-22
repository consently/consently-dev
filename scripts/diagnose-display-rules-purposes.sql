-- Display Rules & Purpose Tracking Diagnostics
-- Run these queries in Supabase SQL Editor to check current state

-- ============================================================================
-- 1. Display Rules Distribution
-- ============================================================================
-- Check how many widgets have display rules configured

SELECT 
  widget_id,
  name,
  jsonb_array_length(COALESCE(display_rules, '[]'::jsonb)) as rules_count,
  is_active,
  created_at
FROM dpdpa_widget_configs
ORDER BY rules_count DESC;

-- ============================================================================
-- 2. Purpose Tracking Coverage (Last 30 Days)
-- ============================================================================
-- Check what percentage of consent records have purpose-level tracking

SELECT 
  COUNT(*) as total_consent_records,
 COUNT(CASE WHEN consent_details->'activityPurposeConsents' IS NOT NULL THEN 1 END) as records_with_purpose_tracking,
  ROUND(
    COUNT(CASE WHEN consent_details->'activityPurposeConsents' IS NOT NULL THEN 1 END)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as purpose_tracking_percentage
FROM dpdpa_consent_records
WHERE consent_given_at >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- 3. Display Rule Performance (Last 30 Days)
-- ============================================================================
-- Check which display rules are being triggered and their consent rates

SELECT 
  consent_details->'ruleContext'->>'ruleName' as rule_name,
  consent_details->'ruleContext'->>'urlPattern' as url_pattern,
  COUNT(*) as total_consents,
  COUNT(CASE WHEN consent_status = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN consent_status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN consent_status = 'partial' THEN 1 END) as partial_count,
  ROUND(
    COUNT(CASE WHEN consent_status = 'accepted' THEN 1 END)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as acceptance_rate
FROM dpdpa_consent_records
WHERE consent_details->'ruleContext' IS NOT NULL
  AND consent_given_at >= NOW() - INTERVAL '30 days'
GROUP BY 
  consent_details->'ruleContext'->>'ruleName',
  consent_details->'ruleContext'->>'urlPattern'
ORDER BY total_consents DESC;

-- ============================================================================
-- 4. Purpose Consent Analysis
-- ============================================================================
-- Check which purposes are being consented to most often

WITH purpose_consents AS (
  SELECT 
    jsonb_object_keys(consent_details->'activityPurposeConsents') as activity_id,
    jsonb_array_elements_text(
      consent_details->'activityPurposeConsents'->jsonb_object_keys(consent_details->'activityPurposeConsents')
    ) as purpose_id
  FROM dpdpa_consent_records
  WHERE consent_details->'activityPurposeConsents' IS NOT NULL
    AND consent_given_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  p.purpose_name,
  p.name as purpose_display_name,
  COUNT(*) as consent_count
FROM purpose_consents pc
JOIN purposes p ON p.id::text = pc.purpose_id
GROUP BY p.id, p.purpose_name, p.name
ORDER BY consent_count DESC
LIMIT 20;

-- ============================================================================
-- 5. Activities Without Purpose Tracking (Potential Issues)
-- ============================================================================
-- Find activities that have purposes but aren't being tracked in consents

SELECT 
  pa.id as activity_id,
  pa.activity_name,
  COUNT(DISTINCT ap.purpose_id) as purpose_count,
  COUNT(DISTINCT cr.id) as consent_records,
  COUNT(DISTINCT CASE 
    WHEN cr.consent_details->'activityPurposeConsents' ? pa.id::text 
    THEN cr.id 
  END) as records_with_purpose_tracking
FROM processing_activities pa
LEFT JOIN activity_purposes ap ON ap.activity_id = pa.id
LEFT JOIN dpdpa_consent_records cr ON pa.id = ANY(cr.consented_activities)
WHERE pa.is_active = true
  AND cr.consent_given_at >= NOW() - INTERVAL '30 days'
GROUP BY pa.id, pa.activity_name
HAVING COUNT(DISTINCT ap.purpose_id) > 0
ORDER BY consent_records DESC;

-- ============================================================================
-- 6. Display Rules Detail View
-- ============================================================================
-- Get detailed view of all configured display rules

SELECT 
  widget_id,
  name as widget_name,
  jsonb_array_elements(display_rules) as rule
FROM dpdpa_widget_configs
WHERE jsonb_array_length(display_rules) > 0;

-- ============================================================================
-- 7. Consent Records Missing Rule Context
-- ============================================================================
-- Find consents that happened but didn't match any display rule

SELECT 
  widget_id,
  COUNT(*) as consents_without_rule_context,
  MAX(consent_given_at) as most_recent
FROM dpdpa_consent_records
WHERE consent_details->'ruleContext' IS NULL
  AND consent_given_at >= NOW() - INTERVAL '30 days'
GROUP BY widget_id
ORDER BY consents_without_rule_context DESC;
