import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Safety: only allow in non-production unless explicitly overridden
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_GRANT !== 'true') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark user as demo and enterprise active
    const { error: userErr } = await supabase
      .from('users')
      .update({ demo_account: true, subscription_plan: 'enterprise', subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (userErr) {
      console.error('Failed to mark demo:', userErr);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Insert a zero-amount enterprise subscription if none exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const now = new Date();
      const { error: subErr } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'enterprise',
          status: 'active',
          amount: 0,
          currency: 'INR',
          billing_cycle: 'monthly',
          payment_provider: 'razorpay',
          payment_id: null,
          start_date: now.toISOString(),
          end_date: null,
          is_trial: false,
          trial_end: null,
        });
      if (subErr) {
        console.error('Failed to insert demo subscription:', subErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Demo enterprise access granted to current user' });
  } catch (error) {
    console.error('Error granting demo:', error);
    return NextResponse.json({ error: 'Failed to grant demo' }, { status: 500 });
  }
}