-- Create demo premium user for development and presentations
-- Credentials: demo@consently.app / DemoUser123!
-- This user has enterprise unlimited access

BEGIN;

-- Insert demo user (you'll need to create this via Supabase Auth dashboard or auth.users table)
-- The auth.users record must be created first through Supabase Auth
-- This is just a placeholder - see instructions below

-- Note: You need to create the auth user first via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Invite User" or "Add User"
-- 3. Email: demo@consently.app
-- 4. Password: DemoUser123!
-- 5. Copy the user ID and replace 'REPLACE_WITH_AUTH_USER_ID' below

-- Then run this migration to set up the profile and subscription

-- Insert user profile using the known demo user ID
INSERT INTO users (
  id, 
  email, 
  full_name, 
  auth_provider, 
  subscription_plan, 
  subscription_status, 
  demo_account,
  onboarding_completed,
  created_at,
  updated_at
) VALUES (
  '264da718-d83d-479a-9065-19ebf08a07b9'::uuid,
  'demo@consently.app',
  'Demo User',
  'email',
  'enterprise',
  'active',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  demo_account = true,
  subscription_plan = 'enterprise',
  subscription_status = 'active',
  full_name = 'Demo User',
  updated_at = NOW();

-- Create or update enterprise subscription for demo user
-- First, delete any existing subscriptions for this user
DELETE FROM subscriptions WHERE user_id = '264da718-d83d-479a-9065-19ebf08a07b9'::uuid;

-- Then insert the new enterprise subscription
INSERT INTO subscriptions (
  user_id,
  plan,
  status,
  amount,
  currency,
  billing_cycle,
  payment_provider,
  payment_id,
  start_date,
  end_date,
  is_trial,
  trial_end,
  created_at,
  updated_at
) VALUES (
  '264da718-d83d-479a-9065-19ebf08a07b9'::uuid,
  'enterprise',
  'active',
  0,
  'INR',
  'monthly',
  'razorpay',
  NULL,
  NOW(),
  NULL, -- No end date = unlimited
  false,
  NULL,
  NOW(),
  NOW()
);

COMMIT;

-- MANUAL SETUP INSTRUCTIONS:
-- =============================
-- Since auth.users is managed by Supabase Auth, you need to:
-- 
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User" 
-- 4. Fill in:
--    - Email: demo@consently.app
--    - Password: DemoUser123!
--    - Auto Confirm: Yes
-- 5. Click "Create User"
-- 6. Copy the generated user ID (UUID)
-- 7. Replace 'REPLACE_WITH_AUTH_USER_ID' in this file with that UUID
-- 8. Run this migration again
--
-- OR use SQL directly (after creating via dashboard):
--
-- DO $$
-- DECLARE
--   demo_user_id UUID;
-- BEGIN
--   -- Get the demo user's ID
--   SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@consently.app';
--   
--   IF demo_user_id IS NOT NULL THEN
--     -- Update users table
--     INSERT INTO users (id, email, full_name, auth_provider, subscription_plan, subscription_status, demo_account, onboarding_completed)
--     VALUES (demo_user_id, 'demo@consently.app', 'Demo User', 'email', 'enterprise', 'active', true, true)
--     ON CONFLICT (id) DO UPDATE SET demo_account = true, subscription_plan = 'enterprise', subscription_status = 'active';
--     
--     -- Create subscription
--     INSERT INTO subscriptions (user_id, plan, status, amount, currency, billing_cycle, payment_provider, start_date, is_trial)
--     VALUES (demo_user_id, 'enterprise', 'active', 0, 'INR', 'monthly', 'razorpay', NOW(), false)
--     ON CONFLICT (user_id, plan) DO UPDATE SET status = 'active', is_trial = false;
--   END IF;
-- END $$;
