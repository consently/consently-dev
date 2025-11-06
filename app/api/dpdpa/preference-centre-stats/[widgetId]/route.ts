import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET endpoint to fetch preference centre statistics for a DPDPA widget
 * Returns stats about user preferences and interactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
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

    const { widgetId } = await params;

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Verify widget belongs to user
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('id, user_id')
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Widget not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch consent records for this widget
    const { data: consents, error: consentsError } = await supabase
      .from('dpdpa_consent_records')
      .select('*')
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    if (consentsError) {
      console.error('Error fetching consents:', consentsError);
      return NextResponse.json(
        { error: 'Failed to fetch consent records' },
        { status: 500 }
      );
    }

    // Calculate preference centre stats
    const totalInteractions = consents?.length || 0;
    const acceptedCount = consents?.filter(c => c.consent_status === 'accepted').length || 0;
    const rejectedCount = consents?.filter(c => c.consent_status === 'rejected').length || 0;
    const partialCount = consents?.filter(c => c.consent_status === 'partial').length || 0;
    
    // Calculate activity-specific stats
    const activityStats = new Map();
    consents?.forEach(consent => {
      if (consent.consented_activities && Array.isArray(consent.consented_activities)) {
        consent.consented_activities.forEach((activityId: string) => {
          const current = activityStats.get(activityId) || 0;
          activityStats.set(activityId, current + 1);
        });
      }
    });

    // Get last 7 days of interactions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentInteractions = consents?.filter(
      c => new Date(c.created_at) >= sevenDaysAgo
    ).length || 0;

    const response = {
      totalInteractions,
      acceptedCount,
      rejectedCount,
      partialCount,
      acceptanceRate: totalInteractions > 0 
        ? ((acceptedCount / totalInteractions) * 100).toFixed(2) 
        : '0.00',
      recentInteractions,
      activityStats: Object.fromEntries(activityStats),
      lastInteraction: consents && consents.length > 0 
        ? consents[0].created_at 
        : null,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });

  } catch (error) {
    console.error('Error fetching preference centre stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
