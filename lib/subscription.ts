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
    consentLimit = limits.consents;
    maxScanDepth = limits.maxScanDepth;
  }

  return { plan, isTrial, trialEndsAt, isDemo, consentLimit, maxScanDepth };
}

export function isScanDepthAllowed(requested: 'shallow' | 'medium' | 'deep', entitlements: Entitlements) {
  const order = { shallow: 0, medium: 1, deep: 2 } as const;
  return order[requested] <= order[entitlements.maxScanDepth];
}