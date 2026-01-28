-- ============================================================================
-- ADD CODE_VERIFIER COLUMN FOR PKCE FLOW
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-28
-- Purpose: Add missing code_verifier column for DigiLocker PKCE OAuth flow
-- ============================================================================

-- Add code_verifier column to store PKCE code verifier for token exchange
ALTER TABLE age_verification_sessions
  ADD COLUMN IF NOT EXISTS code_verifier VARCHAR(255);

-- Comment explaining the column
COMMENT ON COLUMN age_verification_sessions.code_verifier IS 'PKCE code verifier for secure OAuth token exchange with DigiLocker';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
