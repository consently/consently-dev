-- Cookie module
CREATE INDEX IF NOT EXISTS idx_widget_configs_user_id ON widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_configs_user_active ON banner_configs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_consent_logs_widget_timestamp ON consent_logs(widget_id, created_at DESC);

-- DPDPA module
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_user ON dpdpa_widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_widget_visitor ON dpdpa_consent_records(widget_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_dpdpa_consent_records_email_hash ON dpdpa_consent_records(visitor_email_hash) WHERE visitor_email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processing_activities_active ON processing_activities(is_active, id);

-- Privacy Centre
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_visitor_widget ON visitor_consent_preferences(visitor_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_visitor_preferences_email_hash ON visitor_consent_preferences(visitor_email_hash) WHERE visitor_email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email_hash ON email_verification_otps(email_hash, expires_at);
