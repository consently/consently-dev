-- Create demo user in auth.users table
-- This must be run with service role or through Supabase Dashboard

-- Note: You should run this via Supabase Dashboard SQL Editor
-- or use the Dashboard UI to create the user

-- OPTION 1: Use Supabase Dashboard UI (Recommended)
-- ===================================================
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" or "Invite User"
-- 3. Fill in:
--    Email: demo@consently.app
--    Password: DemoUser123!
--    Auto Confirm: YES (check this box)
-- 4. Click "Create User"
-- 5. Copy the generated UUID
-- 6. Update the migration file with this UUID

-- OPTION 2: Use SQL with service role (Advanced)
-- ===============================================
-- This requires service role privileges
-- Run this in Supabase SQL Editor:

-- First, check if user already exists and delete if needed
DO $$
BEGIN
  -- Delete existing user if exists
  DELETE FROM auth.users WHERE email = 'demo@consently.app';
END $$;

-- Insert new auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  confirmation_sent_at,
  recovery_sent_at,
  email_change_sent_at,
  invited_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  last_sign_in_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '264da718-d83d-479a-9065-19ebf08a07b9',
  'authenticated',
  'authenticated',
  'demo@consently.app',
  crypt('DemoUser123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo User"}',
  false,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  NULL
);

-- Clean up older identity if present (provider + provider_id is the unique pair)
DELETE FROM auth.identities 
WHERE provider = 'email' AND provider_id = 'demo@consently.app';

-- Create identity record (provider_id must be non-null and unique per provider)
INSERT INTO auth.identities (
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
)
VALUES (
  '264da718-d83d-479a-9065-19ebf08a07b9',
  jsonb_build_object(
    'sub', '264da718-d83d-479a-9065-19ebf08a07b9',
    'email', 'demo@consently.app',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  'demo@consently.app'
)
ON CONFLICT (provider, provider_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();
