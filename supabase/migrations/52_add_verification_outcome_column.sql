-- Migration: Add verification_outcome to age_verification_sessions
-- Purpose: Single source of truth for policy enforcement after age verification
-- This replaces scattered implicit logic across isMinor, requires_guardian_consent,
-- and guardian_consent_status with one canonical, server-enforced field.

-- Add verification_outcome column
ALTER TABLE age_verification_sessions
ADD COLUMN IF NOT EXISTS verification_outcome TEXT;

-- Add check constraint for allowed values
ALTER TABLE age_verification_sessions
ADD CONSTRAINT valid_verification_outcome
CHECK (
  verification_outcome IS NULL OR
  verification_outcome IN (
    'verified_adult',
    'blocked_minor',
    'guardian_required',
    'guardian_approved',
    'limited_access',
    'expired'
  )
);

-- Add index for querying by outcome (used by consent-record API guard)
CREATE INDEX IF NOT EXISTS idx_age_verification_outcome
ON age_verification_sessions (widget_id, visitor_id, verification_outcome)
WHERE verification_outcome IS NOT NULL;

-- Backfill existing verified sessions with correct outcomes
-- Adults (verified_age >= threshold stored in widget config)
UPDATE age_verification_sessions avs
SET verification_outcome = CASE
  WHEN avs.guardian_consent_status = 'approved' THEN 'guardian_approved'
  WHEN avs.requires_guardian_consent = true AND avs.guardian_consent_status != 'approved' THEN 'guardian_required'
  ELSE 'verified_adult'
END
WHERE avs.status = 'verified'
  AND avs.verification_outcome IS NULL;

-- Comment for documentation
COMMENT ON COLUMN age_verification_sessions.verification_outcome IS
  'Canonical policy outcome: verified_adult, blocked_minor, guardian_required, guardian_approved, limited_access, expired. Server-enforced single source of truth.';
