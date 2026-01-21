-- ============================================================================
-- DPDPA WIDGET - AGE GATE CONFIGURATION
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-21
-- Purpose: Add age gate configuration for DPDPA 2023 compliance
--          Implements "verifiable parental consent" requirement
-- ============================================================================

-- Add age gate configuration columns to dpdpa_widget_configs
ALTER TABLE dpdpa_widget_configs 
ADD COLUMN IF NOT EXISTS enable_age_gate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_gate_threshold INTEGER DEFAULT 18 
  CHECK (age_gate_threshold >= 13 AND age_gate_threshold <= 21),
ADD COLUMN IF NOT EXISTS age_gate_minor_message TEXT 
  DEFAULT 'This content requires adult supervision. Please ask a parent or guardian to assist you.';

-- Add comments
COMMENT ON COLUMN dpdpa_widget_configs.enable_age_gate IS 'Enable neutral age verification gate before showing consent widget';
COMMENT ON COLUMN dpdpa_widget_configs.age_gate_threshold IS 'Minimum age required to proceed (13-21 years)';
COMMENT ON COLUMN dpdpa_widget_configs.age_gate_minor_message IS 'Custom message shown to users identified as minors';

-- ============================================================================
-- Migration Complete
-- ============================================================================
