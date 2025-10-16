import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlements } from '@/lib/subscription';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get calculated entitlements
    const entitlements = await getEntitlements();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      subscription,
      entitlements,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
