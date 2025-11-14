import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET endpoint to fetch acceptance statistics for all processing activities
 * Returns real-time data based on actual consent records
 */
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

    // Fetch all active activities for the user
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, activity_name, purpose, industry, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get all widget IDs for the user to fetch related consent records
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, selected_activities')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    const widgetIds = widgets?.map(w => w.widget_id) || [];

    // Fetch all consent records for user's widgets
    let consentsQuery = supabase
      .from('dpdpa_consent_records')
      .select('id, consented_activities, rejected_activities, consent_given_at, widget_id');

    if (widgetIds.length > 0) {
      consentsQuery = consentsQuery.in('widget_id', widgetIds);
    } else {
      // No widgets, return activities with zero stats
      return NextResponse.json({
        data: activities.map(activity => ({
          id: activity.id,
          name: activity.activity_name,
          purpose: activity.purpose,
          acceptanceRate: 0,
          totalResponses: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          status: 'low' as const,
          trend: 'stable' as const,
        })),
      });
    }

    const { data: consents, error: consentsError } = await consentsQuery;

    if (consentsError) {
      console.error('Error fetching consent records:', consentsError);
      return NextResponse.json({ error: 'Failed to fetch consent records' }, { status: 500 });
    }

    // Calculate stats for each activity
    const activityStats = activities.map(activity => {
      let acceptedCount = 0;
      let rejectedCount = 0;

      // Count how many times this activity was accepted or rejected
      consents?.forEach(consent => {
        if (consent.consented_activities?.includes(activity.id)) {
          acceptedCount++;
        }
        if (consent.rejected_activities?.includes(activity.id)) {
          rejectedCount++;
        }
      });

      const totalResponses = acceptedCount + rejectedCount;
      const acceptanceRate = totalResponses > 0 ? (acceptedCount / totalResponses) * 100 : 0;

      // Determine status based on acceptance rate
      let status: 'high' | 'medium' | 'low';
      if (acceptanceRate >= 75) {
        status = 'high';
      } else if (acceptanceRate >= 50) {
        status = 'medium';
      } else {
        status = 'low';
      }

      // Calculate trend based on last 7 days vs previous 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      let last7DaysAccepted = 0;
      let last7DaysRejected = 0;
      let previous7DaysAccepted = 0;
      let previous7DaysRejected = 0;

      consents?.forEach(consent => {
        const consentDate = new Date(consent.consent_given_at || consent.consent_timestamp);
        const isAccepted = consent.consented_activities?.includes(activity.id);
        const isRejected = consent.rejected_activities?.includes(activity.id);

        if (consentDate >= sevenDaysAgo) {
          if (isAccepted) last7DaysAccepted++;
          if (isRejected) last7DaysRejected++;
        } else if (consentDate >= fourteenDaysAgo) {
          if (isAccepted) previous7DaysAccepted++;
          if (isRejected) previous7DaysRejected++;
        }
      });

      const last7DaysTotal = last7DaysAccepted + last7DaysRejected;
      const previous7DaysTotal = previous7DaysAccepted + previous7DaysRejected;
      const last7DaysRate = last7DaysTotal > 0 ? (last7DaysAccepted / last7DaysTotal) * 100 : 0;
      const previous7DaysRate = previous7DaysTotal > 0 ? (previous7DaysAccepted / previous7DaysTotal) * 100 : 0;

      let trend: 'up' | 'down' | 'stable';
      if (previous7DaysTotal === 0 || Math.abs(last7DaysRate - previous7DaysRate) < 5) {
        trend = 'stable';
      } else if (last7DaysRate > previous7DaysRate) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      return {
        id: activity.id,
        name: activity.activity_name,
        purpose: activity.purpose,
        acceptanceRate,
        totalResponses,
        acceptedCount,
        rejectedCount,
        status,
        trend,
      };
    });

    return NextResponse.json({ data: activityStats });
  } catch (error) {
    console.error('Unexpected error in activity acceptance stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
