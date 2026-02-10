-- ============================================================================
-- DPDPA WIDGET - AGE VERIFICATION CONFIGURATION COLUMNS
-- ============================================================================
-- Version: 2.0.0
-- Date: 2026-02-09
-- Purpose: Re-add age verification columns to dpdpa_widget_configs
--          for DigiLocker-based age verification in the embeddable widget.
--          These columns were previously removed by migration
--          202502010001_remove_age_verification_module.sql and are now
--          needed for the new popup-based widget age verification flow.
-- ============================================================================

-- Legacy Age Gate columns (deprecated but kept for backward compatibility)
ALTER TABLE dpdpa_widget_configs
ADD COLUMN IF NOT EXISTS enable_age_gate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_gate_threshold INTEGER DEFAULT 18
  CHECK (age_gate_threshold >= 13 AND age_gate_threshold <= 21),
ADD COLUMN IF NOT EXISTS age_gate_minor_message TEXT
  DEFAULT 'This content requires adult supervision. Please ask a parent or guardian to assist you.';

-- DigiLocker Age Verification columns (new widget integration)
ALTER TABLE dpdpa_widget_configs
ADD COLUMN IF NOT EXISTS require_age_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_verification_threshold INTEGER DEFAULT 18
  CHECK (age_verification_threshold >= 13 AND age_verification_threshold <= 21),
ADD COLUMN IF NOT EXISTS age_verification_provider TEXT DEFAULT 'digilocker'
  CHECK (age_verification_provider IN ('digilocker', 'apisetu', 'custom')),
ADD COLUMN IF NOT EXISTS minor_handling TEXT DEFAULT 'block'
  CHECK (minor_handling IN ('block', 'limited_access')),
ADD COLUMN IF NOT EXISTS verification_validity_days INTEGER DEFAULT 365
  CHECK (verification_validity_days >= 1 AND verification_validity_days <= 3650);

-- Add comments for documentation
COMMENT ON COLUMN dpdpa_widget_configs.enable_age_gate IS 'DEPRECATED: Legacy age gate. Use require_age_verification instead.';
COMMENT ON COLUMN dpdpa_widget_configs.age_gate_threshold IS 'DEPRECATED: Legacy age gate threshold (13-21 years).';
COMMENT ON COLUMN dpdpa_widget_configs.age_gate_minor_message IS 'DEPRECATED: Legacy message shown to minors.';
COMMENT ON COLUMN dpdpa_widget_configs.require_age_verification IS 'Enable DigiLocker age verification before showing consent widget.';
COMMENT ON COLUMN dpdpa_widget_configs.age_verification_threshold IS 'Minimum age required to proceed (13-21 years). Default 18 for DPDPA.';
COMMENT ON COLUMN dpdpa_widget_configs.age_verification_provider IS 'Age verification provider: digilocker, apisetu, or custom.';
COMMENT ON COLUMN dpdpa_widget_configs.minor_handling IS 'How to handle minors: block (deny access) or limited_access.';
COMMENT ON COLUMN dpdpa_widget_configs.verification_validity_days IS 'Days a successful age verification remains valid (1-3650).';

-- ============================================================================
-- Migration Complete
-- ============================================================================
