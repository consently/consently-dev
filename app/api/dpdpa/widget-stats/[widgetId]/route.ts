import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get detailed stats for a specific DPDPA widget
 * Returns consent records, activity breakdown, geographic data, device stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const supabase = await createClient();
    const { widgetId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch all consent records for this widget
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
    const revokedCount = consents?.filter(c => c.consent_status === 'revoked').length || 0;
    const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;
    const uniqueVisitors = new Set(consents?.map(c => c.visitor_id) || []).size;

    // Device type breakdown
    const deviceStats = consents?.reduce((acc: any, c) => {
      const device = c.device_type || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {}) || {};

    // Browser breakdown
    const browserStats = consents?.reduce((acc: any, c) => {
      const browser = c.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {}) || {};

    // Geographic breakdown (country)
    const countryStats = consents?.reduce((acc: any, c) => {
      const country = c.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {}) || {};

    // Language breakdown
    const languageStats = consents?.reduce((acc: any, c) => {
      const language = c.language || 'Unknown';
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {}) || {};

    // Time series data (daily breakdown)
    const timeSeriesMap = new Map<string, { accepted: number; rejected: number; partial: number }>();
    consents?.forEach(c => {
      const date = new Date(c.consent_timestamp).toISOString().split('T')[0];
      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, { accepted: 0, rejected: 0, partial: 0 });
      }
      const dayStats = timeSeriesMap.get(date)!;
      if (c.consent_status === 'accepted') dayStats.accepted++;
      else if (c.consent_status === 'rejected') dayStats.rejected++;
      else if (c.consent_status === 'partial') dayStats.partial++;
    });

    const timeSeries = Array.from(timeSeriesMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Activity-level stats
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, activity_name, purpose, industry')
      .eq('user_id', user.id)
      .in('id', widgetConfig.selected_activities || []);

    const activityMap = new Map<string, { 
      name: string; 
      purpose: string;
      industry: string;
      accepted: number; 
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>();

    if (activities) {
      activities.forEach(activity => {
        activityMap.set(activity.id, {
          name: activity.activity_name,
          purpose: activity.purpose,
          industry: activity.industry,
          accepted: 0,
          rejected: 0,
          total: 0,
          acceptanceRate: 0,
        });
      });

      // Count accepts/rejects for each activity
      consents?.forEach(consent => {
        consent.consented_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) {
            stat.accepted++;
            stat.total++;
          }
        });

        consent.rejected_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) {
            stat.rejected++;
            stat.total++;
          }
        });
      });

      // Calculate acceptance rates
      activityMap.forEach(stat => {
        if (stat.total > 0) {
          stat.acceptanceRate = (stat.accepted / stat.total) * 100;
        }
      });
    }

    const activityStats = Array.from(activityMap.entries()).map(([id, data]) => ({
      activityId: id,
      ...data
    }));

    // Return comprehensive stats
    return NextResponse.json({
      widgetInfo: {
        widgetId: widgetConfig.widget_id,
        name: widgetConfig.name,
        domain: widgetConfig.domain,
        isActive: widgetConfig.is_active,
        createdAt: widgetConfig.created_at,
      },
      overview: {
        totalConsents,
        acceptedCount,
        rejectedCount,
        partialCount,
        revokedCount,
        acceptanceRate,
        uniqueVisitors,
      },
      breakdown: {
        devices: deviceStats,
        browsers: browserStats,
        countries: countryStats,
        languages: languageStats,
      },
      timeSeries,
      activities: activityStats,
    });
  } catch (error) {
    console.error('Unexpected error in widget stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
