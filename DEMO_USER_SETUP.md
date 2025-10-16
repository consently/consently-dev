# Demo Premium User Setup

## Pre-Created Demo Account Credentials

For development and presentations, use this demo account with **enterprise unlimited access**:

```
Email:    demo@consently.app
Password: DemoUser123!
```

## Quick Setup Steps

### 1. Create Auth User (Via Supabase Dashboard)

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → Users**
3. Click **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: `demo@consently.app`
   - **Password**: `DemoUser123!`
   - **Auto Confirm User**: ✅ Yes
5. Click **"Create User"**
6. Copy the generated **User ID (UUID)**

### 2. Set Up Profile & Subscription (SQL)

After creating the auth user, run this SQL in your Supabase SQL Editor:

```sql
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get the demo user's ID
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@consently.app';
  
  IF demo_user_id IS NOT NULL THEN
    -- Create/update user profile
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
    )
    VALUES (
      demo_user_id,
      'demo@consently.app',
      'Demo User',
      'email',
      'enterprise',
      'active',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      demo_account = true,
      subscription_plan = 'enterprise',
      subscription_status = 'active',
      full_name = 'Demo User',
      updated_at = NOW();
    
    -- Create enterprise subscription
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
    )
    VALUES (
      demo_user_id,
      'enterprise',
      'active',
      0,
      'INR',
      'monthly',
      'razorpay',
      NULL,
      NOW(),
      NULL,
      false,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      is_trial = false,
      updated_at = NOW();
    
    RAISE NOTICE 'Demo user setup complete for ID: %', demo_user_id;
  ELSE
    RAISE EXCEPTION 'Demo user not found. Please create it first via Authentication > Users';
  END IF;
END $$;
```

### 3. Verify Setup

Login with the demo credentials at `/login` and verify:
- ✅ Can access all dashboard features
- ✅ Can perform deep cookie scans (50+ pages)
- ✅ Unlimited consent records
- ✅ Profile shows "Enterprise" plan
- ✅ No trial warnings or upgrade prompts

## Alternative: Use Migration File

If you prefer, you can use the migration file at `supabase/migrations/20251016_create_demo_user.sql`:

1. Create the auth user via dashboard (steps above)
2. Copy the user UUID
3. Edit the migration file and replace `REPLACE_WITH_AUTH_USER_ID` with the actual UUID
4. Run: `supabase migration up`

## Features Available to Demo User

As a demo enterprise account, this user has:

- ✅ **Unlimited consent records** (no 5k, 50k, or 100k limits)
- ✅ **Deep website scans** (up to 50 pages per scan)
- ✅ **All premium features**:
  - Advanced compliance reporting
  - Custom banner branding
  - Export to CSV/JSON/PDF
  - Priority support access
  - All DPDPA widgets
  - Complete audit logs
  - White-label options

## Reset Demo User

To reset the demo user (e.g., after testing):

```sql
-- Clear demo user data
DELETE FROM consent_records WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@consently.app');
DELETE FROM cookie_scans WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@consently.app');
DELETE FROM processing_activities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@consently.app');
DELETE FROM audit_logs WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@consently.app');
-- User profile and subscription remain intact
```

## Security Notes

- 🔒 Change the password after initial setup if deployed to staging/production
- 🔒 This account is for **development and demos only**
- 🔒 Never use these credentials in production environments
- 🔒 Consider using environment-specific passwords
- 🔒 The `demo_account` flag prevents accidental billing

## Troubleshooting

### "User not found" error
- Ensure you created the auth user via Supabase Dashboard first
- Check spelling of email: `demo@consently.app`

### "Cannot login" error
- Verify email is confirmed in auth.users table
- Check that Auto Confirm was enabled during creation
- Try resetting password via dashboard

### "Subscription not active" error
- Re-run the SQL setup script above
- Check subscriptions table: `SELECT * FROM subscriptions WHERE user_id = 'UUID'`

### "Plan limits still enforced" error
- Verify `demo_account = true` in users table
- Check entitlements with: `SELECT demo_account, subscription_plan FROM users WHERE email = 'demo@consently.app'`
