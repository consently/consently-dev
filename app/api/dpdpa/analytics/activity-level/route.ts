import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint for activity-level consent analytics
 * Returns aggregated data about consent rates for each processing activity
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth required
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'acceptanceRate'; // acceptanceRate, totalConsents, activityName
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get user's widgets
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id);

    if (widgetsError || !widgets || widgets.length === 0) {
      return NextResponse.json({ 
        data: [],
        summary: {
          totalActivities: 0,
          totalConsents: 0,
          avgAcceptanceRate: 0
        }
      });
    }

    const widgetIds = widgets.map((w: any) => w.widget_id);

    // Build query
    let query = supabase
      .from('dpdpa_consent_records')
      .select('consented_activities, rejected_activities, consent_status, consent_given_at');

    // Filter by widget
    if (widgetId && widgetIds.includes(widgetId)) {
      query = query.eq('widget_id', widgetId);
    } else {
      query = query.in('widget_id', widgetIds);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('consent_given_at', startDate);
    }
    if (endDate) {
      query = query.lte('consent_given_at', endDate);
    }

    const { data: consentRecords, error: recordsError } = await query;

    if (recordsError) {
      console.error('Error fetching consent records:', recordsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get all processing activities for the user
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select(`
        id,
        activity_name,
        industry,
        is_active
      `)
      .eq('user_id', user.id);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Build activity stats map
    const activityStatsMap = new Map<string, {
      activityId: string;
      activityName: string;
      industry: string;
      totalConsents: number;
      acceptedCount: number;
      rejectedCount: number;
      partialCount: number;
      acceptanceRate: number;
      rejectionRate: number;
      partialRate: number;
      isActive: boolean;
      trend?: 'up' | 'down' | 'stable';
    }>();

    // Initialize stats for all activities
    (activities || []).forEach((activity: any) => {
      activityStatsMap.set(activity.id, {
        activityId: activity.id,
        activityName: activity.activity_name,
        industry: activity.industry,
        totalConsents: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        partialCount: 0,
        acceptanceRate: 0,
        rejectionRate: 0,
        partialRate: 0,
        isActive: activity.is_active,
      });
    });

    // Process consent records
    (consentRecords || []).forEach((record: any) => {
      const consentedActivities = record.consented_activities || [];
      const rejectedActivities = record.rejected_activities || [];

      // Count consented activities
      consentedActivities.forEach((activityId: string) => {
        if (activityStatsMap.has(activityId)) {
          const stats = activityStatsMap.get(activityId)!;
          stats.totalConsents++;
          
          if (record.consent_status === 'accepted') {
            stats.acceptedCount++;
          } else if (record.consent_status === 'partial') {
            stats.partialCount++;
          }
        }
      });

      // Count rejected activities
      rejectedActivities.forEach((activityId: string) => {
        if (activityStatsMap.has(activityId)) {
          const stats = activityStatsMap.get(activityId)!;
          stats.totalConsents++;
          
          if (record.consent_status === 'rejected') {
            stats.rejectedCount++;
          } else if (record.consent_status === 'partial') {
            // Already counted in partial above
          }
        }
      });
    });

    // Calculate rates for each activity
    activityStatsMap.forEach((stats) => {
      if (stats.totalConsents > 0) {
        stats.acceptanceRate = (stats.acceptedCount / stats.totalConsents) * 100;
        stats.rejectionRate = (stats.rejectedCount / stats.totalConsents) * 100;
        stats.partialRate = (stats.partialCount / stats.totalConsents) * 100;
      }
    });

    // Convert to array and sort
    let activityStats = Array.from(activityStatsMap.values());

    // Sort results
    if (sortBy === 'acceptanceRate') {
      activityStats.sort((a, b) => sortOrder === 'desc' 
        ? b.acceptanceRate - a.acceptanceRate 
        : a.acceptanceRate - b.acceptanceRate);
    } else if (sortBy === 'totalConsents') {
      activityStats.sort((a, b) => sortOrder === 'desc' 
        ? b.totalConsents - a.totalConsents 
        : a.totalConsents - b.totalConsents);
    } else if (sortBy === 'activityName') {
      activityStats.sort((a, b) => sortOrder === 'desc'
        ? b.activityName.localeCompare(a.activityName)
        : a.activityName.localeCompare(b.activityName));
    }

    // Calculate summary stats
    const totalActivities = activityStats.length;
    const totalConsents = activityStats.reduce((sum, stats) => sum + stats.totalConsents, 0);
    const avgAcceptanceRate = totalActivities > 0 
      ? activityStats.reduce((sum, stats) => sum + stats.acceptanceRate, 0) / totalActivities 
      : 0;

    const topActivities = activityStats
      .filter(stats => stats.totalConsents > 0)
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 5);

    const bottomActivities = activityStats
      .filter(stats => stats.totalConsents > 0)
      .sort((a, b) => a.acceptanceRate - b.acceptanceRate)
      .slice(0, 5);

    return NextResponse.json({
      data: activityStats,
      summary: {
        totalActivities,
        totalConsents,
        avgAcceptanceRate: parseFloat(avgAcceptanceRate.toFixed(2)),
        topActivities,
        bottomActivities,
      },
      filters: {
        widgetId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    });

  } catch (error) {
    console.error('Error in activity-level analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

