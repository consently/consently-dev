import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint for purpose-level consent analytics
 * Returns aggregated data about consent rates for each purpose within activities
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
    const activityId = searchParams.get('activityId'); // Optional: filter by activity
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'consentRate'; // consentRate, totalRecords, purposeName

    // Get user's widgets
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id);

    if (widgetsError || !widgets || widgets.length === 0) {
      return NextResponse.json({ 
        data: [],
        summary: {
          totalPurposes: 0,
          totalRecords: 0,
          avgConsentRate: 0
        }
      });
    }

    const widgetIds = widgets.map((w: any) => w.widget_id);

    // Build query for consent records
    let query = supabase
      .from('dpdpa_consent_records')
      .select('consent_details, consented_activities, rejected_activities, consent_status, consent_given_at');

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

    // Get all processing activities and their purposes for the user
    let activitiesQuery = supabase
      .from('processing_activities')
      .select(`
        id,
        activity_name,
        industry,
        is_active,
        activity_purposes!inner (
          id,
          purpose_id,
          legal_basis,
          custom_description,
          purposes!inner (
            id,
            purpose_name,
            description
          )
        )
      `)
      .eq('user_id', user.id);

    // Optional: filter by specific activity
    if (activityId) {
      activitiesQuery = activitiesQuery.eq('id', activityId);
    }

    const { data: activities, error: activitiesError } = await activitiesQuery;

    if (activitiesError) {
      console.error('Error fetching activities with purposes:', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch purposes' }, { status: 500 });
    }

    // Build purpose stats map
    // Key: `${activityId}:${purposeId}` for unique tracking
    const purposeStatsMap = new Map<string, {
      activityId: string;
      activityName: string;
      purposeId: string;
      purposeName: string;
      legalBasis: string;
      totalRecords: number; // Total times this purpose was presented
      consentedCount: number; // Times user consented to this purpose
      consentRate: number; // Percentage
      industry: string;
    }>();

    // Initialize stats for all purposes
    (activities || []).forEach((activity: any) => {
      const activityPurposes = activity.activity_purposes || [];
      activityPurposes.forEach((ap: any) => {
        const purpose = ap.purposes;
        if (purpose) {
          const key = `${activity.id}:${ap.id}`;
          purposeStatsMap.set(key, {
            activityId: activity.id,
            activityName: activity.activity_name,
            purposeId: ap.id,
            purposeName: purpose.purpose_name,
            legalBasis: ap.legal_basis,
            totalRecords: 0,
            consentedCount: 0,
            consentRate: 0,
            industry: activity.industry,
          });
        }
      });
    });

    // Process consent records to extract purpose-level data
    (consentRecords || []).forEach((record: any) => {
      const consentDetails = record.consent_details || {};
      const activityPurposeConsents = consentDetails.activityPurposeConsents || {};
      const consentedActivities = record.consented_activities || [];
      const rejectedActivities = record.rejected_activities || [];

      // For each activity that was consented to, check which purposes were included
      Object.entries(activityPurposeConsents).forEach(([activityIdKey, purposeIds]: [string, any]) => {
        if (Array.isArray(purposeIds)) {
          purposeIds.forEach((purposeId: string) => {
            // Find matching purpose in our map
            for (const [key, stats] of purposeStatsMap.entries()) {
              if (stats.activityId === activityIdKey && stats.purposeId === purposeId) {
                stats.totalRecords++;
                // Check if the activity was consented
                if (consentedActivities.includes(activityIdKey)) {
                  stats.consentedCount++;
                }
              }
            }
          });
        }
      });

      // Also count activities that were presented but purposes weren't explicitly tracked
      // (for activities without purpose-level tracking)
      consentedActivities.forEach((activityIdKey: string) => {
        // Check if this activity has purposes in our map
        const hasPurposes = Array.from(purposeStatsMap.values()).some(
          stats => stats.activityId === activityIdKey
        );
        
        if (hasPurposes) {
          // Increment total records for all purposes of this activity
          purposeStatsMap.forEach((stats) => {
            if (stats.activityId === activityIdKey) {
              // Only increment if not already counted via activityPurposeConsents
              if (!activityPurposeConsents[activityIdKey]) {
                stats.totalRecords++;
                stats.consentedCount++; // Assume all purposes consented if activity consented
              }
            }
          });
        }
      });

      // Count rejected activities
      rejectedActivities.forEach((activityIdKey: string) => {
        purposeStatsMap.forEach((stats) => {
          if (stats.activityId === activityIdKey) {
            // Only increment if not already counted
            if (!activityPurposeConsents[activityIdKey]) {
              stats.totalRecords++;
              // Don't increment consentedCount for rejected
            }
          }
        });
      });
    });

    // Calculate consent rates
    purposeStatsMap.forEach((stats) => {
      if (stats.totalRecords > 0) {
        stats.consentRate = (stats.consentedCount / stats.totalRecords) * 100;
      }
    });

    // Convert to array and filter out purposes with no data
    let purposeStats = Array.from(purposeStatsMap.values());

    // Sort results
    if (sortBy === 'consentRate') {
      purposeStats.sort((a, b) => b.consentRate - a.consentRate);
    } else if (sortBy === 'totalRecords') {
      purposeStats.sort((a, b) => b.totalRecords - a.totalRecords);
    } else if (sortBy === 'purposeName') {
      purposeStats.sort((a, b) => a.purposeName.localeCompare(b.purposeName));
    }

    // Calculate summary stats
    const totalPurposes = purposeStats.length;
    const totalRecords = purposeStats.reduce((sum, stats) => sum + stats.totalRecords, 0);
    const avgConsentRate = totalPurposes > 0 
      ? purposeStats.reduce((sum, stats) => sum + stats.consentRate, 0) / totalPurposes 
      : 0;

    // Group by activity for better insights
    const purposesByActivity = new Map<string, typeof purposeStats>();
    purposeStats.forEach((stats) => {
      if (!purposesByActivity.has(stats.activityId)) {
        purposesByActivity.set(stats.activityId, []);
      }
      purposesByActivity.get(stats.activityId)!.push(stats);
    });

    const activityBreakdown = Array.from(purposesByActivity.entries()).map(([activityId, purposes]) => {
      const activityName = purposes[0]?.activityName || 'Unknown';
      const avgRate = purposes.reduce((sum, p) => sum + p.consentRate, 0) / purposes.length;
      return {
        activityId,
        activityName,
        purposeCount: purposes.length,
        avgConsentRate: parseFloat(avgRate.toFixed(2)),
        purposes: purposes.map(p => ({
          purposeId: p.purposeId,
          purposeName: p.purposeName,
          consentRate: parseFloat(p.consentRate.toFixed(2)),
          totalRecords: p.totalRecords,
        })),
      };
    });

    // Top and bottom purposes
    const topPurposes = purposeStats
      .filter(p => p.totalRecords > 0)
      .sort((a, b) => b.consentRate - a.consentRate)
      .slice(0, 5);

    const bottomPurposes = purposeStats
      .filter(p => p.totalRecords > 0)
      .sort((a, b) => a.consentRate - b.consentRate)
      .slice(0, 5);

    return NextResponse.json({
      data: purposeStats,
      summary: {
        totalPurposes,
        totalRecords,
        avgConsentRate: parseFloat(avgConsentRate.toFixed(2)),
        topPurposes,
        bottomPurposes,
      },
      activityBreakdown,
      filters: {
        widgetId,
        activityId,
        startDate,
        endDate,
        sortBy,
      },
    });

  } catch (error) {
    console.error('Error in purpose-level analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

