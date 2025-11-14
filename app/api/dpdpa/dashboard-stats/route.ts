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

    // Get all widget IDs for the user
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    const widgetIds = widgets?.map(w => w.widget_id) || [];

    // Get all consent records for user's widgets
    let query = supabase
      .from('dpdpa_consent_records')
      .select('*');

    if (widgetIds.length > 0) {
      query = query.in('widget_id', widgetIds);
    } else {
      // No widgets, return empty stats
      return NextResponse.json({
        data: {
          totalConsents: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          partialCount: 0,
          revokedCount: 0,
          acceptanceRate: 0,
          uniqueVisitors: 0,
          totalActivities: 0,
          activeWidgets: 0,
          last7Days: {
            consents: 0,
            change: 0,
          },
        },
      });
    }

    const { data: consents, error: consentsError } = await query;

    if (consentsError) {
      console.error('Error fetching consents:', consentsError);
      return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 });
    }

    // Calculate stats
    const totalConsents = consents?.length || 0;
    const acceptedCount = consents?.filter(c => c.consent_status === 'accepted').length || 0;
    const rejectedCount = consents?.filter(c => c.consent_status === 'rejected').length || 0;
    const partialCount = consents?.filter(c => c.consent_status === 'partial').length || 0;
    const revokedCount = consents?.filter(c => c.consent_status === 'revoked').length || 0;
    const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;

    // Count unique visitors
    const uniqueVisitors = new Set(consents?.map(c => c.visitor_id) || []).size;

    // Get total activities count
    const { count: activitiesCount } = await supabase
      .from('processing_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Calculate last 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const last7DaysConsents = consents?.filter(c => 
      new Date(c.consent_given_at || c.consent_timestamp) >= sevenDaysAgo
    ).length || 0;

    const previous7DaysConsents = consents?.filter(c => {
      const consentDate = new Date(c.consent_given_at || c.consent_timestamp);
      return consentDate >= fourteenDaysAgo && consentDate < sevenDaysAgo;
    }).length || 0;

    const changePercent = previous7DaysConsents > 0 
      ? ((last7DaysConsents - previous7DaysConsents) / previous7DaysConsents) * 100 
      : last7DaysConsents > 0 ? 100 : 0;

    return NextResponse.json({
      data: {
        totalConsents,
        acceptedCount,
        rejectedCount,
        partialCount,
        revokedCount,
        acceptanceRate,
        uniqueVisitors,
        totalActivities: activitiesCount || 0,
        activeWidgets: widgetIds.length,
        last7Days: {
          consents: last7DaysConsents,
          change: Math.round(changePercent),
        },
      },
    });
  } catch (error) {
    console.error('Unexpected error in dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
