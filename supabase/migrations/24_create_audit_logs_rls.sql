-- ============================================================================
-- AUDIT LOGS TABLE AND RLS POLICIES
-- ============================================================================
-- Purpose: Ensure audit_logs table exists with proper RLS policies
-- Date: 2025-01-XX
-- ============================================================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb,
  ip_address text,
  user_agent text,
  status text CHECK (status = ANY (ARRAY['success'::text, 'failure'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;

-- RLS Policy: Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Authenticated users can create audit logs (for their own user_id)
-- This allows the backend to create audit logs on behalf of users
CREATE POLICY "Users can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can create logs for themselves
    auth.uid() = user_id 
    OR 
    -- Or if user_id is null (for system logs)
    user_id IS NULL
  );

-- RLS Policy: Service role can do everything (for backend operations)
-- This allows the backend service role to create audit logs without user context
CREATE POLICY "Service role can manage audit logs"
  ON public.audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add table comment
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all user actions and system events';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action (NULL for system events)';
COMMENT ON COLUMN public.audit_logs.action IS 'Action type (e.g., user.login, banner.create)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (e.g., users, banners, widgets)';
COMMENT ON COLUMN public.audit_logs.status IS 'success or failure';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object containing changed fields and values';

