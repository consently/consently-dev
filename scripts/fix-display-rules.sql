-- ============================================================================
-- Display Rules Purpose Filtering - SQL Diagnostic and Fix Script
-- ============================================================================
-- Purpose: Help diagnose and fix display rules where multiple purposes show
--          on a single page when only one should appear
--
-- Usage: Replace 'YOUR_WIDGET_ID' with your actual widget ID
-- ============================================================================

-- Replace this with your actual widget ID
\set widget_id 'YOUR_WIDGET_ID'

-- ============================================================================
-- STEP 1: Check Current Display Rules Configuration
-- ============================================================================

\echo '\n==================================================================='
\echo 'STEP 1: Current Display Rules Configuration'
\echo '==================================================================='

SELECT 
  widget_id,
  name,
  domain,
  jsonb_array_length(COALESCE(display_rules, '[]'::jsonb)) as rules_count,
  array_length(selected_activities, 1) as activities_count
FROM dpdpa_widget_configs
WHERE widget_id = :'widget_id';

-- Show each display rule
SELECT 
  jsonb_array_elements(display_rules) -> 'rule_name' as rule_name,
  jsonb_array_elements(display_rules) -> 'url_pattern' as url_pattern,
  jsonb_array_elements(display_rules) -> 'is_active' as is_active,
  jsonb_array_length(
    COALESCE(jsonb_array_elements(display_rules) -> 'activities', '[]'::jsonb)
  ) as activities_count,
  jsonb_array_elements(display_rules) -> 'activity_purposes' as activity_purposes
FROM dpdpa_widget_configs
WHERE widget_id = :'widget_id'
  AND jsonb_array_length(display_rules) > 0;

-- ============================================================================
-- STEP 2: Get Your Activity IDs
-- ============================================================================

\echo '\n==================================================================='
\echo 'STEP 2: Available Activities for This Widget'
\echo '==================================================================='

WITH widget_activities AS (
  SELECT 
    unnest(selected_activities) as activity_id
  FROM dpdpa_widget_configs
  WHERE widget_id = :'widget_id'
)
SELECT 
  pa.id as activity_id,
  pa.activity_name,
  pa.industry,
  COUNT(ap.id) as purposes_count
FROM processing_activities pa
JOIN widget_activities wa ON wa.activity_id = pa.id
LEFT JOIN activity_purposes ap ON ap.activity_id = pa.id
GROUP BY pa.id, pa.activity_name, pa.industry
ORDER BY pa.activity_name;

-- ============================================================================
-- STEP 3: Get Purpose IDs for Each Activity
-- ============================================================================

\echo '\n==================================================================='
\echo 'STEP 3: Purposes for Each Activity'
\echo '==================================================================='

WITH widget_activities AS (
  SELECT 
    unnest(selected_activities) as activity_id
  FROM dpdpa_widget_configs
  WHERE widget_id = :'widget_id'
)
SELECT 
  pa.activity_name,
  pa.id as activity_id,
  ap.purpose_id,  -- ✅ This is what you need for activity_purposes mapping!
  p.purpose_name,
  p.name as purpose_display_name,
  ap.legal_basis,
  ap.id as activity_purpose_join_id  -- ❌ Do NOT use this for filtering!
FROM processing_activities pa
JOIN widget_activities wa ON wa.activity_id = pa.id
JOIN activity_purposes ap ON ap.activity_id = pa.id
JOIN purposes p ON p.id = ap.purpose_id
ORDER BY pa.activity_name, p.purpose_name;

-- ============================================================================
-- STEP 4: Identify Issues
-- ============================================================================

\echo '\n==================================================================='
\echo 'STEP 4: Potential Issues'
\echo '==================================================================='

-- Check for rules without activities specified
WITH rules AS (
  SELECT 
    jsonb_array_elements(display_rules) as rule
  FROM dpdpa_widget_configs
  WHERE widget_id = :'widget_id'
)
SELECT 
  rule -> 'rule_name' as rule_name,
  rule -> 'url_pattern' as url_pattern,
  CASE 
    WHEN rule -> 'activities' IS NULL THEN '❌ No activities specified - will show ALL'
    WHEN jsonb_array_length(rule -> 'activities') = 0 THEN '❌ Empty activities array - will show ALL'
    ELSE '✅ Activities specified: ' || jsonb_array_length(rule -> 'activities')::text
  END as activities_status,
  CASE
    WHEN rule -> 'activity_purposes' IS NULL THEN '⚠️  No purpose filtering - shows ALL purposes'
    WHEN jsonb_typeof(rule -> 'activity_purposes') = 'object' 
      AND (SELECT COUNT(*) FROM jsonb_object_keys(rule -> 'activity_purposes')) = 0 
      THEN '⚠️  Empty activity_purposes - shows ALL purposes'
    ELSE '✅ Purpose filtering configured'
  END as purpose_filtering_status
FROM rules;

-- ============================================================================
-- EXAMPLE FIXES
-- ============================================================================

\echo '\n==================================================================='
\echo 'EXAMPLE FIX: How to Structure Display Rules'
\echo '==================================================================='

-- Example 1: Contact Page Rule (one activity, one purpose)
\echo '\nExample 1: Contact Page (one activity, one purpose)'
\echo '-------------------------------------------------------------------'
\echo 'Structure:'
\echo '{'
\echo '  "id": "contact_rule",'
\echo '  "rule_name": "Contact Page Rule",'
\echo '  "url_pattern": "/contact",'
\echo '  "activities": ["<activity_uuid>"],  -- Your contact activity UUID'
\echo '  "activity_purposes": {'
\echo '    "<activity_uuid>": ["<purpose_uuid>"]  -- Your contact purpose UUID'
\echo '  }'
\echo '}'

-- Example 2: Careers Page Rule (one activity, one purpose)
\echo '\nExample 2: Careers Page (one activity, one purpose)'
\echo '-------------------------------------------------------------------'
\echo 'Structure:'
\echo '{'
\echo '  "id": "careers_rule",'
\echo '  "rule_name": "Careers Page Rule",'
\echo '  "url_pattern": "/careers",'
\echo '  "activities": ["<activity_uuid>"],  -- Your careers activity UUID'
\echo '  "activity_purposes": {'
\echo '    "<activity_uuid>": ["<purpose_uuid>"]  -- Your careers purpose UUID'
\echo '  }'
\echo '}'

-- ============================================================================
-- STEP 5: Template for Manual Fix
-- ============================================================================

\echo '\n==================================================================='
\echo 'STEP 5: Fix Template (Update via Dashboard or API)'
\echo '==================================================================='
\echo 'Copy the activity_id and purpose_id values from STEP 3 above'
\echo 'Then update your display rules using the dashboard UI or API'
\echo ''
\echo 'API Endpoint: PUT /api/dpdpa/widget-config'
\echo 'Dashboard: /dashboard/dpdpa/widget -> Display Rules tab'

-- ============================================================================
-- Verification Query
-- ============================================================================

\echo '\n==================================================================='
\echo 'VERIFICATION: Run this after fixing'
\echo '==================================================================='

WITH rules AS (
  SELECT 
    jsonb_array_elements(display_rules) as rule
  FROM dpdpa_widget_configs
  WHERE widget_id = :'widget_id'
)
SELECT 
  rule -> 'rule_name' as rule_name,
  rule -> 'url_pattern' as url_pattern,
  jsonb_array_length(rule -> 'activities') as activities_count,
  (SELECT COUNT(*) FROM jsonb_object_keys(rule -> 'activity_purposes')) as filtered_activities_count,
  CASE
    WHEN jsonb_array_length(rule -> 'activities') = 1 
      AND (SELECT COUNT(*) FROM jsonb_object_keys(rule -> 'activity_purposes')) = 1
    THEN '✅ Correctly configured (1 activity, purpose filtering)'
    WHEN jsonb_array_length(rule -> 'activities') > 0 
      AND rule -> 'activity_purposes' IS NOT NULL
    THEN '⚠️  Multiple activities or purposes'
    ELSE '❌ Needs fixing'
  END as status
FROM rules;

\echo '\n==================================================================='
\echo 'Done! Check the output above for issues and fixes.'
\echo '==================================================================='

