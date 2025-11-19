import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Hardcoded admin credentials (secured with environment variables recommended for production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@consently.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'C0n$ently@dm!n2024#Secure';

// Verify admin authentication
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        }
      );
    }

    const supabase = await createClient();

    // Fetch all users with their subscription details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
    }

    // Fetch cookie module statistics
    const { data: cookieBanners, error: cookieError } = await supabase
      .from('cookie_banners')
      .select('id, user_id, website_url, is_active, created_at');

    const { data: cookieScans, error: scansError } = await supabase
      .from('cookie_scans')
      .select('id, user_id, website_url, scan_date');

    // Fetch DPDPA module statistics
    const { data: dpdpaWidgets, error: dpdpaError } = await supabase
      .from('dpdpa_widget_configs')
      .select('id, user_id, name, domain, is_active, created_at');

    const { data: processingActivities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, user_id, activity_name, is_active, created_at');

    // Fetch consent records for both modules
    const { data: cookieConsents, error: cookieConsentsError } = await supabase
      .from('consent_logs')
      .select('id, user_id, created_at');

    const { data: dpdpaConsents, error: dpdpaConsentsError } = await supabase
      .from('dpdpa_consent_records')
      .select('id, widget_id, created_at, dpdpa_widget_configs!inner(user_id)');

    const { data: dpdpaRequests, error: requestsError } = await supabase
      .from('dpdp_rights_requests')
      .select('id, widget_id, request_type, status, created_at, dpdpa_widget_configs!inner(user_id)');

    // Build comprehensive user data
    const now = new Date();
    const userStats = users?.map((user) => {
      // Find active subscription
      const activeSubscription = subscriptions?.find(
        (sub) => sub.user_id === user.id && sub.status === 'active'
      );

      // Calculate trial days left
      let trialDaysLeft = null;
      let trialStatus = 'none';
      if (activeSubscription?.is_trial && activeSubscription.trial_end) {
        const trialEnd = new Date(activeSubscription.trial_end);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysLeft = Math.max(0, daysLeft);
        trialStatus = trialEnd > now ? 'active' : 'expired';
      }

      // Cookie module stats
      const userCookieBanners = cookieBanners?.filter((b) => b.user_id === user.id) || [];
      const userCookieScans = cookieScans?.filter((s) => s.user_id === user.id) || [];
      const userCookieConsents = cookieConsents?.filter((c) => c.user_id === user.id) || [];

      // DPDPA module stats
      const userDpdpaWidgets = dpdpaWidgets?.filter((w) => w.user_id === user.id) || [];
      const widgetIds = userDpdpaWidgets.map((w) => w.id);
      const userProcessingActivities = processingActivities?.filter((a) => a.user_id === user.id) || [];
      
      // Count DPDPA consents by matching widget_id
      const userDpdpaConsents = dpdpaConsents?.filter((c) => 
        widgetIds.includes(c.widget_id)
      ) || [];

      // Count DPDPA requests by matching widget_id
      const userDpdpaRequests = dpdpaRequests?.filter((r) => 
        widgetIds.includes(r.widget_id)
      ) || [];

      // Calculate total consents for current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthCookieConsents = userCookieConsents.filter(
        (c) => new Date(c.created_at) >= startOfMonth
      ).length;
      const monthDpdpaConsents = userDpdpaConsents.filter(
        (c) => new Date(c.created_at) >= startOfMonth
      ).length;

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        auth_provider: user.auth_provider,
        demo_account: user.demo_account,
        created_at: user.created_at,
        onboarding_completed: user.onboarding_completed,
        
        // Subscription info
        subscription: {
          plan: activeSubscription?.plan || 'free',
          status: activeSubscription?.status || 'inactive',
          is_trial: activeSubscription?.is_trial || false,
          trial_end: activeSubscription?.trial_end,
          trial_days_left: trialDaysLeft,
          trial_status: trialStatus,
          start_date: activeSubscription?.start_date,
          billing_cycle: activeSubscription?.billing_cycle,
          amount: activeSubscription?.amount,
        },

        // Cookie module
        cookieModule: {
          banners: userCookieBanners.length,
          activeBanners: userCookieBanners.filter((b) => b.is_active).length,
          totalScans: userCookieScans.length,
          totalConsents: userCookieConsents.length,
          monthlyConsents: monthCookieConsents,
          lastScan: userCookieScans[0]?.scan_date || null,
        },

        // DPDPA module
        dpdpaModule: {
          widgets: userDpdpaWidgets.length,
          activeWidgets: userDpdpaWidgets.filter((w) => w.is_active).length,
          processingActivities: userProcessingActivities.length,
          activeActivities: userProcessingActivities.filter((a) => a.is_active).length,
          totalConsents: userDpdpaConsents.length,
          monthlyConsents: monthDpdpaConsents,
          totalRequests: userDpdpaRequests.length,
          pendingRequests: userDpdpaRequests.filter((r) => r.status === 'pending').length,
        },

        // Combined metrics
        totalConsentsThisMonth: monthCookieConsents + monthDpdpaConsents,
        totalConsents: userCookieConsents.length + userDpdpaConsents.length,
      };
    }) || [];

    // Calculate platform-wide statistics
    const platformStats = {
      totalUsers: users?.length || 0,
      activeTrials: userStats.filter((u) => u.subscription.trial_status === 'active').length,
      expiredTrials: userStats.filter((u) => u.subscription.trial_status === 'expired').length,
      paidSubscriptions: userStats.filter(
        (u) => u.subscription.status === 'active' && !u.subscription.is_trial
      ).length,
      demoAccounts: userStats.filter((u) => u.demo_account).length,
      
      // Module adoption
      cookieModuleUsers: userStats.filter((u) => u.cookieModule.banners > 0).length,
      dpdpaModuleUsers: userStats.filter((u) => u.dpdpaModule.widgets > 0).length,
      bothModulesUsers: userStats.filter(
        (u) => u.cookieModule.banners > 0 && u.dpdpaModule.widgets > 0
      ).length,

      // This month
      totalConsentsThisMonth: userStats.reduce((sum, u) => sum + u.totalConsentsThisMonth, 0),
      totalCookieScans: cookieScans?.length || 0,
      totalProcessingActivities: processingActivities?.length || 0,
      
      // All time
      totalConsents: userStats.reduce((sum, u) => sum + u.totalConsents, 0),
      totalCookieBanners: cookieBanners?.length || 0,
      totalDpdpaWidgets: dpdpaWidgets?.length || 0,
      totalDpdpaRequests: dpdpaRequests?.length || 0,
    };

    return NextResponse.json({
      success: true,
      users: userStats,
      platformStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

