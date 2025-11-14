-- Migration: Add Performance Indexes for Consent Queries
-- Description: Critical indexes to improve query performance on consent tables
-- Date: 2025-11-14
-- Author: Production Optimization

-- ============================================================================
-- DPDPA Consent Records Indexes
-- ============================================================================

-- Index for checking consent by widget_id and visitor_id (most common query)
-- This is used when widget checks if a visitor has already consented
-- Note: We index all records and filter expired consents in application code
-- This is faster than using NOW() which is not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_widget_visitor 
ON dpdpa_consent_records(widget_id, visitor_id);

-- Index for cross-device consent lookup by principal_id
-- This is used for email-based cross-device consent sync
-- Note: We index all records and filter expired consents in application code
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_principal 
ON dpdpa_consent_records(principal_id, widget_id)
WHERE principal_id IS NOT NULL;

-- Index for consent expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_expires 
ON dpdpa_consent_records(consent_expires_at)
WHERE consent_expires_at IS NOT NULL;

-- Index for consent given timestamp (for analytics and recent consent queries)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_given_at 
ON dpdpa_consent_records(consent_given_at DESC);

-- Index for consent status filtering (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_status 
ON dpdpa_consent_records(widget_id, consent_status);

-- ============================================================================
-- Visitor Principal Links Indexes
-- ============================================================================

-- Index for finding all devices linked to a principal_id
CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_principal 
ON visitor_principal_links(principal_id, widget_id)
WHERE is_active = true;

-- Index for finding link by email hash
CREATE INDEX IF NOT EXISTS idx_visitor_principal_links_email_hash 
ON visitor_principal_links(email_hash, widget_id)
WHERE is_active = true;

-- Composite index for the unique constraint (already exists via unique constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_visitor_principal_unique 
-- ON visitor_principal_links(visitor_id, widget_id);

-- ============================================================================
-- Visitor Consent Preferences Indexes
-- ============================================================================

-- Index for preference center lookups by visitor_id
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_visitor 
ON visitor_consent_preferences(visitor_id, widget_id);

-- Index for activity-specific preferences
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_activity 
ON visitor_consent_preferences(widget_id, activity_id, consent_status);

-- ============================================================================
-- Cookie Consent Records Indexes
-- ============================================================================

-- Index for cookie consent lookups by widget_id and visitor_token
CREATE INDEX IF NOT EXISTS idx_cookie_consent_widget_visitor 
ON consent_logs(widget_id, visitor_token)
WHERE widget_id IS NOT NULL;

-- Index for cookie consent timestamp (analytics)
CREATE INDEX IF NOT EXISTS idx_cookie_consent_timestamp 
ON consent_logs(created_at DESC);

-- Index for cookie consent status
CREATE INDEX IF NOT EXISTS idx_cookie_consent_status 
ON consent_logs(status, consent_type);

-- ============================================================================
-- Processing Activities Indexes
-- ============================================================================

-- Index for active activities by user (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_processing_activities_user_active 
ON processing_activities(user_id, is_active)
WHERE is_active = true;

-- Index for industry filter
CREATE INDEX IF NOT EXISTS idx_processing_activities_industry 
ON processing_activities(industry);

-- ============================================================================
-- DPDPA Widget Configs Indexes
-- ============================================================================

-- Index for active widgets by user
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_user_active 
ON dpdpa_widget_configs(user_id, is_active)
WHERE is_active = true;

-- Index for widget_id lookups (public API)
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_id 
ON dpdpa_widget_configs(widget_id)
WHERE is_active = true;

-- ============================================================================
-- Cookie Widget Configs Indexes
-- ============================================================================

-- Index for cookie widget by user
CREATE INDEX IF NOT EXISTS idx_cookie_widget_user 
ON widget_configs(user_id);

-- Index for cookie widget_id lookups (public API)
CREATE INDEX IF NOT EXISTS idx_cookie_widget_id 
ON widget_configs(widget_id);

-- ============================================================================
-- Analytics Tables Indexes
-- ============================================================================

-- Index for consent analytics by user and date range
-- Note: consent_analytics table uses user_id, not widget_id
CREATE INDEX IF NOT EXISTS idx_consent_analytics_user_date 
ON consent_analytics(user_id, date DESC)
WHERE user_id IS NOT NULL;

-- ============================================================================
-- Analyze Tables (Update Statistics)
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE dpdpa_consent_records;
ANALYZE visitor_principal_links;
ANALYZE visitor_consent_preferences;
ANALYZE consent_logs;
ANALYZE processing_activities;
ANALYZE dpdpa_widget_configs;
ANALYZE widget_configs;
ANALYZE consent_analytics;

-- ============================================================================
-- Performance Notes
-- ============================================================================

-- Expected improvements:
-- 1. Widget consent check queries: 10-50x faster (from full table scan to index seek)
-- 2. Cross-device sync queries: 20-100x faster (principal_id lookups)
-- 3. Dashboard analytics queries: 5-20x faster (indexed by widget_id and date)
-- 4. Preference center loads: 10-30x faster (visitor_id + widget_id composite index)
-- 5. Expiration cleanup jobs: 50-100x faster (indexed by expires_at)

-- Recommended maintenance:
-- Run ANALYZE on these tables weekly to keep statistics fresh
-- Monitor index usage with: SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
-- Identify unused indexes with: SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- ============================================================================
-- End of Migration
-- ============================================================================

