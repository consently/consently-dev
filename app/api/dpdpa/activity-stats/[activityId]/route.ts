import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get detailed stats for a specific processing activity
 * Returns acceptance rates across widgets, geographic data, trends
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const supabase = await createClient();
    const { activityId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Verify activity belongs to user
    const { data: activity, error: activityError } = await supabase
      .from('processing_activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', user.id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Activity not found or access denied' }, { status: 404 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, all

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

    // Find all widgets that include this activity
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, name, domain, is_active')
      .eq('user_id', user.id)
      .contains('selected_activities', [activityId]);

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    const widgetIds = widgets?.map(w => w.widget_id) || [];

    // Fetch consent records that involve this activity
    let consentsQuery = supabase
      .from('dpdpa_consent_records')
      .select('*')
      .or(`accepted_activities.cs.{${activityId}},rejected_activities.cs.{${activityId}}`);

    if (range !== 'all') {
      consentsQuery = consentsQuery.gte('consent_timestamp', dateFilter);
    }

    if (widgetIds.length > 0) {
      consentsQuery = consentsQuery.in('widget_id', widgetIds);
    }

    const { data: consents, error: consentsError } = await consentsQuery;

    if (consentsError) {
      console.error('Error fetching consent records:', consentsError);
      return NextResponse.json({ error: 'Failed to fetch consent records' }, { status: 500 });
    }

    // Calculate overall stats for this activity
    let acceptedCount = 0;
    let rejectedCount = 0;
    let totalResponses = 0;

    consents?.forEach(consent => {
      if (consent.accepted_activities?.includes(activityId)) {
        acceptedCount++;
        totalResponses++;
      }
      if (consent.rejected_activities?.includes(activityId)) {
        rejectedCount++;
        totalResponses++;
      }
    });

    const acceptanceRate = totalResponses > 0 ? (acceptedCount / totalResponses) * 100 : 0;

    // Geographic breakdown
    const countryStats = consents?.reduce((acc: any, c) => {
      const country = c.country || 'Unknown';
      const isAccepted = c.accepted_activities?.includes(activityId);
      const isRejected = c.rejected_activities?.includes(activityId);
      
      if (!acc[country]) {
        acc[country] = { accepted: 0, rejected: 0, total: 0 };
      }
      
      if (isAccepted) {
        acc[country].accepted++;
        acc[country].total++;
      }
      if (isRejected) {
        acc[country].rejected++;
        acc[country].total++;
      }
      
      return acc;
    }, {}) || {};

    // Device breakdown
    const deviceStats = consents?.reduce((acc: any, c) => {
      const device = c.device_type || 'Unknown';
      const isAccepted = c.accepted_activities?.includes(activityId);
      const isRejected = c.rejected_activities?.includes(activityId);
      
      if (!acc[device]) {
        acc[device] = { accepted: 0, rejected: 0, total: 0 };
      }
      
      if (isAccepted) {
        acc[device].accepted++;
        acc[device].total++;
      }
      if (isRejected) {
        acc[device].rejected++;
        acc[device].total++;
      }
      
      return acc;
    }, {}) || {};

    // Time series data (daily breakdown)
    const timeSeriesMap = new Map<string, { accepted: number; rejected: number }>();
    consents?.forEach(c => {
      const date = new Date(c.consent_timestamp).toISOString().split('T')[0];
      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, { accepted: 0, rejected: 0 });
      }
      const dayStats = timeSeriesMap.get(date)!;
      if (c.accepted_activities?.includes(activityId)) dayStats.accepted++;
      if (c.rejected_activities?.includes(activityId)) dayStats.rejected++;
    });

    const timeSeries = Array.from(timeSeriesMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Widget-level breakdown
    const widgetStatsMap = new Map<string, {
      widgetId: string;
      widgetName: string;
      domain: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>();

    widgets?.forEach(widget => {
      widgetStatsMap.set(widget.widget_id, {
        widgetId: widget.widget_id,
        widgetName: widget.name,
        domain: widget.domain,
        accepted: 0,
        rejected: 0,
        total: 0,
        acceptanceRate: 0,
      });
    });

    consents?.forEach(consent => {
      const widgetStat = widgetStatsMap.get(consent.widget_id);
      if (widgetStat) {
        if (consent.accepted_activities?.includes(activityId)) {
          widgetStat.accepted++;
          widgetStat.total++;
        }
        if (consent.rejected_activities?.includes(activityId)) {
          widgetStat.rejected++;
          widgetStat.total++;
        }
      }
    });

    // Calculate acceptance rates per widget
    widgetStatsMap.forEach(stat => {
      if (stat.total > 0) {
        stat.acceptanceRate = (stat.accepted / stat.total) * 100;
      }
    });

    const widgetBreakdown = Array.from(widgetStatsMap.values());

    // Return comprehensive activity stats
    return NextResponse.json({
      activityInfo: {
        activityId: activity.id,
        name: activity.activity_name,
        purpose: activity.purpose,
        industry: activity.industry,
        dataAttributes: activity.data_attributes,
        retentionPeriod: activity.retention_period,
        isActive: activity.is_active,
        createdAt: activity.created_at,
      },
      overview: {
        totalResponses,
        acceptedCount,
        rejectedCount,
        acceptanceRate,
        widgetCount: widgets?.length || 0,
      },
      breakdown: {
        countries: Object.entries(countryStats).map(([country, stats]: [string, any]) => ({
          country,
          ...stats,
          acceptanceRate: stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0,
        })),
        devices: Object.entries(deviceStats).map(([device, stats]: [string, any]) => ({
          device,
          ...stats,
          acceptanceRate: stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0,
        })),
      },
      timeSeries,
      widgets: widgetBreakdown,
    });
  } catch (error) {
    console.error('Unexpected error in activity stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
