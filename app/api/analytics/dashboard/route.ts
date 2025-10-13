import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure } from '@/lib/audit';

interface DashboardMetrics {
  totalConsents: number;
  grantedConsents: number;
  deniedConsents: number;
  withdrawnConsents: number;
  consentRate: number;
  monthlyGrowth: number;
}

interface TrendData {
  date: string;
  granted: number;
  denied: number;
}

interface DeviceData {
  name: string;
  value: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch total consents
    const { count: totalConsents, error: totalError } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (totalError) {
      console.error('Error fetching total consents:', totalError);
      await logFailure(user.id, 'consent.record', 'consent_records', totalError.message, request);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Fetch granted consents
    const { count: grantedConsents } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    // Fetch denied consents
    const { count: deniedConsents } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'rejected');

    // Fetch withdrawn consents
    const { count: withdrawnConsents } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'revoked');

    // Calculate consent rate
    const total = totalConsents || 0;
    const granted = grantedConsents || 0;
    const denied = deniedConsents || 0;
    const withdrawn = withdrawnConsents || 0;
    const consentRate = total > 0 ? (granted / total) * 100 : 0;

    // Calculate monthly growth
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const { count: lastMonthCount } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', lastMonthDate.toISOString());

    const monthlyGrowth = lastMonthCount && total > 0 ? ((lastMonthCount / total) * 100) : 0;

    // Fetch trend data for the last 30 days
    const { data: trendRecords, error: trendError } = await supabase
      .from('consent_records')
      .select('created_at, status')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendError) {
      console.error('Error fetching trend data:', trendError);
    }

    // Group by date and status
    const trendMap = new Map<string, { granted: number; denied: number }>();
    
    trendRecords?.forEach((record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { granted: 0, denied: 0 });
      }
      const stats = trendMap.get(date)!;
      if (record.status === 'accepted') {
        stats.granted++;
      } else if (record.status === 'rejected') {
        stats.denied++;
      }
    });

    const trendData: TrendData[] = Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      granted: stats.granted,
      denied: stats.denied,
    }));

    // Fetch device breakdown
    const { data: deviceRecords, error: deviceError } = await supabase
      .from('consent_records')
      .select('device_type')
      .eq('user_id', user.id);

    if (deviceError) {
      console.error('Error fetching device data:', deviceError);
    }

    const deviceMap = new Map<string, number>();
    deviceRecords?.forEach((record) => {
      const device = record.device_type || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    const deviceData: DeviceData[] = Array.from(deviceMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Fetch recent activities from audit logs
    const { data: activities, error: activitiesError } = await supabase
      .from('audit_logs')
      .select('id, action, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    const recentActivities: RecentActivity[] = activities?.map((activity) => {
      const now = new Date();
      const activityDate = new Date(activity.created_at);
      const diffMs = now.getTime() - activityDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeAgo = '';
      if (diffMins < 1) {
        timeAgo = 'just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      }

      return {
        id: activity.id,
        action: activity.action.replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        user: user.email || 'Unknown',
        time: timeAgo,
      };
    }) || [];

    const metrics: DashboardMetrics = {
      totalConsents: total,
      grantedConsents: granted,
      deniedConsents: denied,
      withdrawnConsents: withdrawn,
      consentRate: parseFloat(consentRate.toFixed(1)),
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
    };

    return NextResponse.json({
      metrics,
      trendData,
      deviceData,
      recentActivities,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
