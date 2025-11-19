-- ============================================================================
-- MIGRATION: Add indexes for activity and purpose-level analytics
-- Description: Optimize queries for consent analytics by adding strategic indexes
-- Created: 2024
-- ============================================================================

-- Index for filtering consent records by widget_id and date range
-- Used in both activity and purpose level analytics
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_date 
ON dpdpa_consent_records(widget_id, consent_given_at DESC);

-- Index for filtering by consent status
-- Useful for analytics that group by status
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_status 
ON dpdpa_consent_records(consent_status);

-- GIN index for array operations on consented_activities
-- Enables fast queries on activity acceptance/rejection
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consented_activities 
ON dpdpa_consent_records USING GIN(consented_activities);

-- GIN index for array operations on rejected_activities
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_rejected_activities 
ON dpdpa_consent_records USING GIN(rejected_activities);

-- GIN index for JSONB consent_details
-- Enables fast queries on activityPurposeConsents and other JSONB fields
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_consent_details 
ON dpdpa_consent_records USING GIN(consent_details);

-- Composite index for activity analytics queries
-- Optimizes queries that filter by widget and aggregate by activities
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_activities 
ON dpdpa_consent_records(widget_id, consent_status, consent_given_at DESC);

-- Index for visitor tracking and cross-device consent
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_email_hash 
ON dpdpa_consent_records(visitor_email_hash) 
WHERE visitor_email_hash IS NOT NULL;

-- Index for visitor_id lookups
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_visitor_id 
ON dpdpa_consent_records(visitor_id, widget_id);

-- Index for processing activities lookup by user
CREATE INDEX IF NOT EXISTS idx_processing_activities_user_active 
ON processing_activities(user_id, is_active);

-- Index for activity purposes lookup
CREATE INDEX IF NOT EXISTS idx_activity_purposes_activity_id 
ON activity_purposes(activity_id);

-- Index for purpose data categories lookup
CREATE INDEX IF NOT EXISTS idx_purpose_data_categories_activity_purpose 
ON purpose_data_categories(activity_purpose_id);

-- Index for widget configs by user
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_user_active 
ON dpdpa_widget_configs(user_id, is_active);

-- Index for visitor consent preferences analytics
CREATE INDEX IF NOT EXISTS idx_visitor_consent_preferences_widget_activity 
ON visitor_consent_preferences(widget_id, activity_id, consent_status);

-- Index for consent history tracking
CREATE INDEX IF NOT EXISTS idx_consent_history_visitor_activity 
ON consent_history(visitor_id, activity_id, changed_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_dpdpa_consent_records_widget_date IS 'Optimizes date-range queries for widget analytics';
COMMENT ON INDEX idx_dpdpa_consent_records_consented_activities IS 'Enables fast array membership queries for activity acceptance';
COMMENT ON INDEX idx_dpdpa_consent_records_rejected_activities IS 'Enables fast array membership queries for activity rejection';
COMMENT ON INDEX idx_dpdpa_consent_records_consent_details IS 'Optimizes JSONB queries for purpose-level analytics';
COMMENT ON INDEX idx_visitor_consent_preferences_widget_activity IS 'Speeds up preference centre analytics';

-- ============================================================================
-- Performance Monitoring Views (Optional)
-- ============================================================================

-- View for monitoring activity-level consent rates
CREATE OR REPLACE VIEW v_activity_consent_stats AS
SELECT 
  pa.id AS activity_id,
  pa.activity_name,
  pa.industry,
  pa.user_id,
  COUNT(DISTINCT dcr.id) AS total_consent_records,
  COUNT(DISTINCT CASE WHEN pa.id = ANY(dcr.consented_activities) THEN dcr.id END) AS accepted_count,
  COUNT(DISTINCT CASE WHEN pa.id = ANY(dcr.rejected_activities) THEN dcr.id END) AS rejected_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN pa.id = ANY(dcr.consented_activities) THEN dcr.id END)::numeric / 
    NULLIF(COUNT(DISTINCT dcr.id), 0) * 100, 
    2
  ) AS acceptance_rate
FROM processing_activities pa
LEFT JOIN dpdpa_consent_records dcr ON (
  pa.id = ANY(dcr.consented_activities) OR 
  pa.id = ANY(dcr.rejected_activities)
)
WHERE pa.is_active = true
GROUP BY pa.id, pa.activity_name, pa.industry, pa.user_id;

COMMENT ON VIEW v_activity_consent_stats IS 'Pre-aggregated view for activity-level analytics (for caching/materialization)';

-- ============================================================================
-- Analytics Helper Functions
-- ============================================================================

-- Function to extract activity purpose consents from JSONB
CREATE OR REPLACE FUNCTION extract_activity_purpose_consents(
  consent_details JSONB,
  activity_id UUID
) RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT jsonb_array_elements_text(
      consent_details->'activityPurposeConsents'->activity_id::text
    )::uuid
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN ARRAY[]::UUID[];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extract_activity_purpose_consents IS 'Extracts purpose IDs from consent_details JSONB for a given activity';

-- ============================================================================
-- Materialized View for Purpose-Level Analytics (Optional - for large datasets)
-- ============================================================================

-- Uncomment if you need to pre-aggregate purpose-level data for very large datasets
-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_purpose_consent_stats AS
-- SELECT 
--   ap.id AS activity_purpose_id,
--   ap.activity_id,
--   pa.activity_name,
--   ap.purpose_id,
--   p.purpose_name,
--   ap.legal_basis,
--   pa.user_id,
--   COUNT(DISTINCT dcr.id) AS total_records,
--   COUNT(DISTINCT CASE 
--     WHEN ap.id = ANY(extract_activity_purpose_consents(dcr.consent_details, pa.id)) 
--     THEN dcr.id 
--   END) AS consented_count
-- FROM activity_purposes ap
-- INNER JOIN processing_activities pa ON pa.id = ap.activity_id
-- INNER JOIN purposes p ON p.id = ap.purpose_id
-- LEFT JOIN dpdpa_consent_records dcr ON (
--   pa.id = ANY(dcr.consented_activities) OR 
--   pa.id = ANY(dcr.rejected_activities)
-- )
-- WHERE pa.is_active = true
-- GROUP BY ap.id, ap.activity_id, pa.activity_name, ap.purpose_id, p.purpose_name, ap.legal_basis, pa.user_id;

-- CREATE UNIQUE INDEX ON mv_purpose_consent_stats(activity_purpose_id);

-- COMMENT ON MATERIALIZED VIEW mv_purpose_consent_stats IS 'Pre-aggregated purpose-level analytics (refresh periodically)';

-- Grant permissions (adjust role as needed)
GRANT SELECT ON v_activity_consent_stats TO authenticated;
-- GRANT SELECT ON mv_purpose_consent_stats TO authenticated;

-- ============================================================================
-- End of Migration
-- ============================================================================

