import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const widgetId = searchParams.get('widgetId');
    const range = searchParams.get('range') || '7d'; // 7d, 30d, 90d, all

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    // Verify widget belongs to user
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 404 });
    }

    // Calculate date filter
    let dateFilter = '';
    const now = new Date();
    switch (range) {
      case '7d':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        dateFilter = sevenDaysAgo.toISOString();
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        dateFilter = thirtyDaysAgo.toISOString();
        break;
      case '90d':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        dateFilter = ninetyDaysAgo.toISOString();
        break;
      case 'all':
      default:
        dateFilter = '1970-01-01T00:00:00.000Z';
        break;
    }

    // Fetch consent records
    let consentQuery = supabase
      .from('dpdpa_consent_records')
      .select('*')
      .eq('widget_id', widgetId);

    if (range !== 'all') {
      consentQuery = consentQuery.gte('consent_timestamp', dateFilter);
    }

    const { data: consents, error: consentsError } = await consentQuery;

    if (consentsError) {
      console.error('Error fetching consent records:', consentsError);
      return NextResponse.json({ error: 'Failed to fetch consent records' }, { status: 500 });
    }

    // Calculate overall stats
    const totalConsents = consents?.length || 0;
    const acceptedCount = consents?.filter(c => c.consent_status === 'accepted').length || 0;
    const rejectedCount = consents?.filter(c => c.consent_status === 'rejected').length || 0;
    const partialCount = consents?.filter(c => c.consent_status === 'partial').length || 0;
    const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;
    
    // Count unique visitors
    const uniqueVisitors = new Set(consents?.map(c => c.visitor_id) || []).size;

    const stats = {
      total_consents: totalConsents,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      partial_count: partialCount,
      acceptance_rate: acceptanceRate,
      unique_visitors: uniqueVisitors,
    };

    // Calculate activity-specific stats
    const activityMap = new Map<string, { accepted: number; rejected: number; name: string }>();
    
    // Fetch activity names
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, activity_name')
      .eq('user_id', user.id)
      .in('id', widgetConfig.selected_activities || []);

    if (!activitiesError && activities) {
      // Initialize activity map
      activities.forEach(activity => {
        activityMap.set(activity.id, {
          accepted: 0,
          rejected: 0,
          name: activity.activity_name,
        });
      });

      // Count accepts/rejects for each activity
      consents?.forEach(consent => {
        consent.accepted_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) {
            stat.accepted++;
          }
        });

        consent.rejected_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) {
            stat.rejected++;
          }
        });
      });
    }

    // Format activity stats
    const activityStats = Array.from(activityMap.entries()).map(([id, data]) => {
      const total = data.accepted + data.rejected;
      const acceptanceRate = total > 0 ? (data.accepted / total) * 100 : 0;
      
      return {
        activity_id: id,
        activity_name: data.name,
        acceptance_count: data.accepted,
        rejection_count: data.rejected,
        acceptance_rate: acceptanceRate,
      };
    });

    // Get recent consent records (last 20)
    const recentConsents = consents
      ?.sort((a, b) => new Date(b.consent_timestamp).getTime() - new Date(a.consent_timestamp).getTime())
      .slice(0, 20)
      .map(consent => ({
        id: consent.id,
        consent_status: consent.consent_status,
        accepted_activities: consent.accepted_activities || [],
        rejected_activities: consent.rejected_activities || [],
        device_type: consent.device_type,
        country: consent.country,
        consent_timestamp: consent.consent_timestamp,
      })) || [];

    return NextResponse.json({
      stats,
      activityStats,
      recentConsents,
    });
  } catch (error) {
    console.error('Unexpected error in analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
