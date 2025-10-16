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
    const range = searchParams.get('range') || '30d';
    const format = searchParams.get('format') || 'json'; // json, csv, pdf

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
    const revokedCount = consents?.filter(c => c.consent_status === 'revoked').length || 0;
    const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;
    const uniqueVisitors = new Set(consents?.map(c => c.visitor_id) || []).size;

    // Fetch activity details
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, activity_name, purpose')
      .eq('user_id', user.id)
      .in('id', widgetConfig.selected_activities || []);

    // Calculate activity stats
    const activityMap = new Map<string, { name: string; purpose: string; accepted: number; rejected: number }>();
    
    if (!activitiesError && activities) {
      activities.forEach(activity => {
        activityMap.set(activity.id, {
          name: activity.activity_name,
          purpose: activity.purpose,
          accepted: 0,
          rejected: 0,
        });
      });

      consents?.forEach(consent => {
        consent.accepted_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) stat.accepted++;
        });

        consent.rejected_activities?.forEach((activityId: string) => {
          const stat = activityMap.get(activityId);
          if (stat) stat.rejected++;
        });
      });
    }

    const activityStats = Array.from(activityMap.entries()).map(([id, data]) => {
      const total = data.accepted + data.rejected;
      const acceptanceRate = total > 0 ? (data.accepted / total) * 100 : 0;
      
      return {
        id,
        name: data.name,
        purpose: data.purpose,
        acceptanceRate,
        totalResponses: total,
        acceptedCount: data.accepted,
        rejectedCount: data.rejected,
      };
    });

    // Get recent consents
    const recentConsents = consents
      ?.sort((a, b) => new Date(b.consent_timestamp).getTime() - new Date(a.consent_timestamp).getTime())
      .slice(0, 50)
      .map(consent => ({
        timestamp: consent.consent_timestamp,
        status: consent.consent_status,
        deviceType: consent.device_type || 'unknown',
        country: consent.country || 'unknown',
        ipAddress: consent.ip_address,
      })) || [];

    // Prepare report data
    const reportData = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.email || 'Unknown',
        companyName: user.user_metadata?.company_name,
        reportPeriod: `Last ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : range === '90d' ? '90 days' : 'all time'}`,
        widgetName: widgetConfig.name,
        widgetDomain: widgetConfig.domain,
      },
      summary: {
        totalConsents,
        acceptedCount,
        rejectedCount,
        partialCount,
        revokedCount,
        acceptanceRate,
        uniqueVisitors,
      },
      activities: activityStats,
      recentConsents,
      rawData: {
        consents: consents?.map(c => ({
          id: c.id,
          timestamp: c.consent_timestamp,
          status: c.consent_status,
          acceptedActivities: c.accepted_activities,
          rejectedActivities: c.rejected_activities,
          deviceType: c.device_type,
          browser: c.browser,
          country: c.country,
          ipAddress: c.ip_address,
        })),
      },
    };

    // Return based on format
    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['DPDPA Consent Compliance Report'],
        [],
        ['Report Information'],
        ['Generated At', new Date().toLocaleString()],
        ['Generated By', user.email || 'Unknown'],
        ['Widget', widgetConfig.name],
        ['Domain', widgetConfig.domain],
        ['Report Period', reportData.reportMetadata.reportPeriod],
        [],
        ['Summary Statistics'],
        ['Total Consents', totalConsents],
        ['Acceptance Rate', acceptanceRate.toFixed(1) + '%'],
        ['Accepted', acceptedCount],
        ['Rejected', rejectedCount],
        ['Partial', partialCount],
        ['Revoked', revokedCount],
        ['Unique Visitors', uniqueVisitors],
        [],
        ['Activity Performance'],
        ['Activity Name', 'Purpose', 'Acceptance Rate', 'Total Responses', 'Accepted', 'Rejected'],
        ...activityStats.map(a => [
          a.name,
          a.purpose,
          a.acceptanceRate.toFixed(1) + '%',
          a.totalResponses,
          a.acceptedCount,
          a.rejectedCount,
        ]),
        [],
        ['Recent Consent Records'],
        ['Timestamp', 'Status', 'Device', 'Country', 'IP Address'],
        ...recentConsents.map(c => [
          new Date(c.timestamp).toLocaleString(),
          c.status,
          c.deviceType,
          c.country,
          c.ipAddress || 'N/A',
        ]),
      ];

      const csv = csvRows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')).join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dpdpa-compliance-report-${widgetId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      // Generate PDF using generator
      const { DPDPAReportGenerator } = await import('@/lib/pdf/dpdpa-report-generator');
      const generator = new DPDPAReportGenerator();
      const doc = generator.generateReport({
        reportMetadata: reportData.reportMetadata,
        summary: reportData.summary,
        activities: reportData.activities.map((a: any) => ({
          name: a.name,
          purpose: a.purpose,
          acceptanceRate: a.acceptanceRate,
          totalResponses: a.totalResponses,
        })),
        recentConsents: reportData.recentConsents,
      } as any);
      const pdf = doc.output('arraybuffer');
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dpdpa-compliance-report-${widgetId}-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    // Return JSON (default)
    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Unexpected error in compliance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
