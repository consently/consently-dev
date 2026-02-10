-- ============================================================================
-- DPDPA WIDGET - AGE VERIFICATION SESSIONS TABLE
-- ============================================================================
-- Version: 2.0.0
-- Date: 2026-02-10
-- Purpose: Create age_verification_sessions table for widget-based age
--          verification using DigiLocker popup flow.
-- ============================================================================

-- Create age verification sessions table
CREATE TABLE IF NOT EXISTS public.age_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    verification_outcome TEXT 
        CHECK (verification_outcome IN ('verified_adult', 'blocked_minor', 'limited_access')),
    verified_age INTEGER,
    verification_token TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate sessions per widget/visitor
    UNIQUE(widget_id, visitor_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_widget_id 
    ON public.age_verification_sessions(widget_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_visitor_id 
    ON public.age_verification_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_status 
    ON public.age_verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_age_verification_sessions_expires_at 
    ON public.age_verification_sessions(expires_at) 
    WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.age_verification_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (backend API access)
CREATE POLICY age_verification_sessions_service_all
    ON public.age_verification_sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create policy for public insert (widget calls)
CREATE POLICY age_verification_sessions_public_insert
    ON public.age_verification_sessions
    FOR INSERT
    WITH CHECK (true);

-- Create policy for public update (widget calls)
CREATE POLICY age_verification_sessions_public_update
    ON public.age_verification_sessions
    FOR UPDATE
    USING (true);

-- Create policy for public select (widget calls)
CREATE POLICY age_verification_sessions_public_select
    ON public.age_verification_sessions
    FOR SELECT
    USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_age_verification_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_age_verification_sessions_updated_at 
    ON public.age_verification_sessions;

CREATE TRIGGER trigger_age_verification_sessions_updated_at
    BEFORE UPDATE ON public.age_verification_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_age_verification_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.age_verification_sessions IS 'Stores age verification sessions for DPDPA widget users';
COMMENT ON COLUMN public.age_verification_sessions.widget_id IS 'Widget identifier';
COMMENT ON COLUMN public.age_verification_sessions.visitor_id IS 'Visitor consent ID';
COMMENT ON COLUMN public.age_verification_sessions.verification_outcome IS 'Result: verified_adult, blocked_minor, or limited_access';
COMMENT ON COLUMN public.age_verification_sessions.verification_token IS 'Token from DigiLocker verification';

-- ============================================================================
-- Migration Complete
-- ============================================================================
