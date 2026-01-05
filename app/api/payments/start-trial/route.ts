import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getUserIdentifier } from '@/lib/rate-limit';
import { logSuccess, logFailure } from '@/lib/audit';

const TRIAL_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting - 5 attempts per hour per user (prevent abuse)
    const rateLimitResult = await checkRateLimit({
      max: 5,
      window: 3600000, // 1 hour
      identifier: getUserIdentifier(user.id),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many trial requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          }
        }
      );
    }

    // Check existing active subscription or trial
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const hasActiveTrial = existing.is_trial && (!existing.trial_end || new Date(existing.trial_end) > new Date());
      if (hasActiveTrial) {
        return NextResponse.json({ error: 'Trial already active', trialEndsAt: existing.trial_end }, { status: 400 });
      }
      // If has paid active subscription, disallow trial
      if (!existing.is_trial) {
        return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
      }
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    // Create trial subscription on the 'small' (Premium) plan
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: 'small',
        status: 'active',
        amount: 0,
        currency: 'INR',
        billing_cycle: 'monthly',
        payment_provider: 'razorpay',
        payment_id: null,
        start_date: now.toISOString(),
        end_date: trialEnd.toISOString(),
        is_trial: true,
        trial_end: trialEnd.toISOString(),
      })
      .select('*')
      .single();

    if (subErr) {
      console.error('Failed to start trial:', subErr);
      
      // Log trial creation failure
      await logFailure(
        user.id,
        'subscription.create',
        'subscription',
        subErr.message,
        request
      );
      
      return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 });
    }

    // Update user profile
    await supabase
      .from('users')
      .update({ subscription_plan: 'small', subscription_status: 'active' })
      .eq('id', user.id);

    // Log successful trial activation
    await logSuccess(
      user.id,
      'subscription.create',
      'subscription',
      sub.id,
      {
        plan: 'small',
        is_trial: true,
        trial_days: TRIAL_DAYS,
        trial_end: trialEnd.toISOString()
      },
      request
    );

    return NextResponse.json({
      success: true,
      trial: {
        plan: 'small',
        startDate: now.toISOString(),
        endDate: trialEnd.toISOString(),
        days: TRIAL_DAYS,
      },
      subscription: sub,
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 });
  }
}