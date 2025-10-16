-- Add trial support to subscriptions and demo flag to users
BEGIN;

-- Add is_trial and trial_end to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_is_trial ON subscriptions(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end);

-- Add demo flag to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS demo_account BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_demo_account ON users(demo_account);

COMMENT ON COLUMN subscriptions.is_trial IS 'Marks if the subscription is a free trial';
COMMENT ON COLUMN subscriptions.trial_end IS 'When the free trial ends';
COMMENT ON COLUMN users.demo_account IS 'Developer/demo account with unlimited access for presentations';

COMMIT;