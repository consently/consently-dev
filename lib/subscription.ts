import { createClient } from '@/lib/supabase/server';

export type Plan = 'free' | 'small' | 'medium' | 'enterprise';

export interface Entitlements {
  plan: Plan;
  isTrial: boolean;
  trialEndsAt: string | null;
  isDemo: boolean;
  consentLimit: number | null; // null = unlimited
  maxScanDepth: 'shallow' | 'medium' | 'deep';
}

const PLAN_LIMITS: Record<'small' | 'medium' | 'enterprise', { consents: number | null; maxScanDepth: 'medium' | 'deep' }> = {
  small: { consents: 50000, maxScanDepth: 'medium' },
  medium: { consents: 100000, maxScanDepth: 'deep' },
  enterprise: { consents: null, maxScanDepth: 'deep' },
};

export async function getEntitlements(): Promise<Entitlements> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      plan: 'free',
      isTrial: false,
      trialEndsAt: null,
      isDemo: false,
      consentLimit: 5000,
      maxScanDepth: 'shallow',
    };
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('users').select('demo_account, subscription_plan, subscription_status').eq('id', user.id).single(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const isDemo = !!profile?.demo_account;

  // Default free entitlements
  let plan: Plan = 'free';
  let isTrial = false;
  let trialEndsAt: string | null = null;
  let consentLimit: number | null = 5000;
  let maxScanDepth: 'shallow' | 'medium' | 'deep' = 'shallow';

  if (isDemo) {
    plan = 'enterprise';
    isTrial = false;
    trialEndsAt = null;
    consentLimit = null;
    maxScanDepth = 'deep';
  } else if (subscription) {
    const activeTrial = subscription.is_trial && (!subscription.trial_end || new Date(subscription.trial_end) > new Date());
    isTrial = !!activeTrial;
    trialEndsAt = subscription.trial_end || null;

    const subPlan = subscription.plan as 'small' | 'medium' | 'enterprise';
    const limits = PLAN_LIMITS[subPlan];

    plan = subPlan;
    
    // During active trial, grant enterprise-level access (no limitations)
    if (activeTrial) {
      consentLimit = null; // Unlimited consents during trial
      maxScanDepth = 'deep'; // Full scan depth during trial
    } else {
      consentLimit = limits.consents;
      maxScanDepth = limits.maxScanDepth;
    }
  }

  return { plan, isTrial, trialEndsAt, isDemo, consentLimit, maxScanDepth };
}

export function isScanDepthAllowed(requested: 'shallow' | 'medium' | 'deep', entitlements: Entitlements) {
  const order = { shallow: 0, medium: 1, deep: 2 } as const;
  return order[requested] <= order[entitlements.maxScanDepth];
}

/**
 * Check if user has remaining consent quota for current month
 * Returns { allowed: boolean, remaining: number | null, limit: number | null }
 */
export async function checkConsentQuota(userId: string, entitlements: Entitlements): Promise<{
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  used: number;
}> {
  // Unlimited plans always allowed
  if (entitlements.consentLimit === null) {
    return { allowed: true, remaining: null, limit: null, used: 0 };
  }

  const supabase = await createClient();
  
  // Get first day of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count consents recorded this month across both tables
  const [{ count: cookieCount }, { count: dpdpaCount }] = await Promise.all([
    supabase
      .from('consent_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('dpdpa_consent_records')
      .select('dpdpa_widget_configs!inner(user_id)', { count: 'exact', head: true })
      .eq('dpdpa_widget_configs.user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
  ]);

  const totalUsed = (cookieCount || 0) + (dpdpaCount || 0);
  const remaining = Math.max(0, entitlements.consentLimit - totalUsed);
  const allowed = totalUsed < entitlements.consentLimit;

  return {
    allowed,
    remaining,
    limit: entitlements.consentLimit,
    used: totalUsed
  };
}

/**
 * Check if trial has expired and should be deactivated
 * This should be called on login/authentication
 */
export async function checkAndExpireTrial(userId: string): Promise<{ expired: boolean; message?: string }> {
  const supabase = await createClient();
  
  // Get active trial subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('is_trial', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return { expired: false };
  }

  // Check if trial has expired
  const now = new Date();
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;

  if (trialEnd && trialEnd < now) {
    // Trial has expired - deactivate it
    await supabase
      .from('subscriptions')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    // Update user profile to free plan
    await supabase
      .from('users')
      .update({
        subscription_plan: null,
        subscription_status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return {
      expired: true,
      message: 'Your trial period has ended. Please upgrade to continue using premium features.'
    };
  }

  return { expired: false };
}