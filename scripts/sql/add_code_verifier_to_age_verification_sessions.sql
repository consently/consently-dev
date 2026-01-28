-- Add PKCE code_verifier column to age_verification_sessions table
-- This is required for OAuth 2.0 PKCE (Proof Key for Code Exchange) flow
-- The code verifier is generated during session creation and used during token exchange

-- Add code_verifier column
ALTER TABLE public.age_verification_sessions
ADD COLUMN IF NOT EXISTS code_verifier TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.age_verification_sessions.code_verifier IS
'PKCE code verifier for OAuth 2.0 security. Generated during authorization, used during token exchange, then can be deleted.';

-- Optional: Create index for faster lookups (if needed)
-- CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_code_verifier
-- ON public.age_verification_sessions(code_verifier)
-- WHERE code_verifier IS NOT NULL;

-- Verification
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'age_verification_sessions'
  AND column_name = 'code_verifier';
