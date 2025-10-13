import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieService } from '@/lib/cookies/cookie-service';
import { logAudit } from '@/lib/audit';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Cookie Analytics API
 * Real-time analytics and insights for cookie consent
 * 
 * Features:
 * - Real-time consent metrics
 * - Custom date range analytics
 * - Category-wise breakdown
 * - Trend analysis
 * - Export functionality (JSON, CSV)
 * - Geographic insights
 * - Device & browser analytics
 * - Conversion funnel
 */

interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metric?: string;
  category?: string;
  export_format?: 'json' | 'csv';
}

/**
 * GET /api/cookies/analytics
 * Get comprehensive cookie consent analytics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const endDate = searchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd');
    const granularity = (searchParams.get('granularity') || 'day') as 'hour' | 'day' | 'week' | 'month';
    const metric = searchParams.get('metric');
    const category = searchParams.get('category');
    const exportFormat = searchParams.get('export') as 'json' | 'csv' | null;

    // Get consent analytics from the service
    const analyticsData = await CookieService.getConsentAnalytics(
      user.id,
      startDate,
      endDate
    );

    // Get consent logs for detailed analysis
    const { logs: consentLogs, total: totalConsents } = await CookieService.getConsentLogs(
      user.id,
      {
        start_date: startDate,
        end_date: endDate,
        limit: 10000,
      }
    );

    // Calculate metrics
    const metrics = calculateMetrics(consentLogs);
    const trends = calculateTrends(analyticsData, granularity);
    const categoryBreakdown = calculateCategoryBreakdown(consentLogs, category);
    const deviceAnalytics = calculateDeviceAnalytics(consentLogs);
    const geographicInsights = calculateGeographicInsights(consentLogs);
    const timeSeriesData = calculateTimeSeries(consentLogs, startDate, endDate, granularity);

    const response = {
      success: true,
      period: {
        start_date: startDate,
        end_date: endDate,
        granularity,
      },
      overview: {
        total_consents: totalConsents,
        total_accepted: metrics.totalAccepted,
        total_rejected: metrics.totalRejected,
        total_partial: metrics.totalPartial,
        acceptance_rate: metrics.acceptanceRate,
        rejection_rate: metrics.rejectionRate,
        partial_rate: metrics.partialRate,
        unique_visitors: metrics.uniqueVisitors,
        return_visitors: metrics.returnVisitors,
      },
      trends: trends,
      categories: categoryBreakdown,
      devices: deviceAnalytics,
      geography: geographicInsights,
      time_series: timeSeriesData,
      top_pages: calculateTopPages(consentLogs),
      consent_methods: calculateConsentMethods(consentLogs),
      average_decision_time: calculateAverageDecisionTime(consentLogs),
    };

    // Handle export formats
    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(response, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="cookie-analytics-${startDate}-to-${endDate}.json"`,
        },
      });
    }

    if (exportFormat === 'csv') {
      const csv = convertAnalyticsToCSV(response);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cookie-analytics-${startDate}-to-${endDate}.csv"`,
        },
      });
    }

    // Log analytics access
    await logAudit({
      user_id: user.id,
      action: 'analytics_exported',
      resource_type: 'analytics',
      changes: { 
        date_range: { start_date: startDate, end_date: endDate },
        export_format: exportFormat || 'api',
      },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/analytics
 * Generate custom analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      start_date,
      end_date,
      metrics,
      dimensions,
      filters,
      export_format,
    } = body;

    // Validate dates
    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Build custom query
    let query = supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Apply filters
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.consent_type) {
        query = query.eq('consent_type', filters.consent_type);
      }
      if (filters.device_type) {
        query = query.contains('device_info', { type: filters.device_type });
      }
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Generate custom report
    const customReport = generateCustomReport(logs || [], metrics, dimensions);

    // Save report if requested
    if (body.save_report) {
      const { data: savedReport } = await supabase
        .from('analytics_reports')
        .insert({
          user_id: user.id,
          name: body.report_name || `Custom Report ${new Date().toISOString()}`,
          config: body,
          data: customReport,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        data: customReport,
        report_id: savedReport?.id,
        message: 'Custom report generated and saved',
      });
    }

    return NextResponse.json({
      success: true,
      data: customReport,
    });

  } catch (error) {
    console.error('Error generating custom report:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom report' },
      { status: 500 }
    );
  }
}

// Helper functions

function calculateMetrics(logs: any[]) {
  const totalAccepted = logs.filter(l => l.status === 'accepted').length;
  const totalRejected = logs.filter(l => l.status === 'rejected').length;
  const totalPartial = logs.filter(l => l.status === 'partial').length;
  const total = logs.length;

  const uniqueVisitors = new Set(logs.map(l => l.visitor_token)).size;
  const visitorCounts = logs.reduce((acc, log) => {
    acc[log.visitor_token] = (acc[log.visitor_token] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const returnVisitors = (Object.values(visitorCounts) as number[]).filter(count => count > 1).length;

  return {
    totalAccepted,
    totalRejected,
    totalPartial,
    acceptanceRate: total > 0 ? ((totalAccepted / total) * 100).toFixed(2) : 0,
    rejectionRate: total > 0 ? ((totalRejected / total) * 100).toFixed(2) : 0,
    partialRate: total > 0 ? ((totalPartial / total) * 100).toFixed(2) : 0,
    uniqueVisitors,
    returnVisitors,
  };
}

function calculateTrends(analyticsData: any[], granularity: string) {
  if (!analyticsData || analyticsData.length === 0) return { trend: 'stable', change: 0 };

  const recent = analyticsData.slice(-7);
  const previous = analyticsData.slice(-14, -7);

  if (previous.length === 0) return { trend: 'new', change: 0 };

  const recentAvg = recent.reduce((sum, d) => sum + (d.accepted || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, d) => sum + (d.accepted || 0), 0) / previous.length;

  const change = previousAvg > 0 ? (((recentAvg - previousAvg) / previousAvg) * 100).toFixed(2) : 0;
  const trend = recentAvg > previousAvg ? 'increasing' : recentAvg < previousAvg ? 'decreasing' : 'stable';

  return { trend, change: Number(change) };
}

function calculateCategoryBreakdown(logs: any[], filterCategory?: string | null) {
  const categoryStats: Record<string, any> = {};

  logs.forEach(log => {
    const categories = log.categories || [];
    
    if (Array.isArray(categories)) {
      categories.forEach((cat: string) => {
        if (!filterCategory || cat === filterCategory) {
          if (!categoryStats[cat]) {
            categoryStats[cat] = {
              category: cat,
              accepted: 0,
              rejected: 0,
              total: 0,
            };
          }
          categoryStats[cat].total++;
          if (log.status === 'accepted' || log.status === 'partial') {
            categoryStats[cat].accepted++;
          } else {
            categoryStats[cat].rejected++;
          }
        }
      });
    }
  });

  return Object.values(categoryStats).map(stat => ({
    ...stat,
    acceptance_rate: ((stat.accepted / stat.total) * 100).toFixed(2),
  }));
}

function calculateDeviceAnalytics(logs: any[]) {
  const deviceStats: Record<string, number> = {};
  const browserStats: Record<string, number> = {};

  logs.forEach(log => {
    const deviceInfo = log.device_info || {};
    const device = deviceInfo.type || 'Unknown';
    const browser = extractBrowser(log.user_agent || '');

    deviceStats[device] = (deviceStats[device] || 0) + 1;
    browserStats[browser] = (browserStats[browser] || 0) + 1;
  });

  return {
    devices: Object.entries(deviceStats).map(([name, count]) => ({
      name,
      count,
      percentage: ((count / logs.length) * 100).toFixed(2),
    })),
    browsers: Object.entries(browserStats).map(([name, count]) => ({
      name,
      count,
      percentage: ((count / logs.length) * 100).toFixed(2),
    })),
  };
}

function calculateGeographicInsights(logs: any[]) {
  const countryStats: Record<string, number> = {};
  const cityStats: Record<string, number> = {};

  logs.forEach(log => {
    const geo = log.geo_location || {};
    const country = geo.country || 'Unknown';
    const city = geo.city || 'Unknown';

    countryStats[country] = (countryStats[country] || 0) + 1;
    cityStats[city] = (cityStats[city] || 0) + 1;
  });

  return {
    countries: Object.entries(countryStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    cities: Object.entries(cityStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

function calculateTimeSeries(logs: any[], startDate: string, endDate: string, granularity: string) {
  const timeSeries: Record<string, any> = {};

  logs.forEach(log => {
    const date = log.created_at?.split('T')[0] || '';
    if (!timeSeries[date]) {
      timeSeries[date] = {
        date,
        accepted: 0,
        rejected: 0,
        partial: 0,
        total: 0,
      };
    }
    timeSeries[date].total++;
    timeSeries[date][log.status]++;
  });

  return Object.values(timeSeries).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

function calculateTopPages(logs: any[]) {
  const pageStats: Record<string, number> = {};

  logs.forEach(log => {
    const page = log.page_url || 'Unknown';
    pageStats[page] = (pageStats[page] || 0) + 1;
  });

  return Object.entries(pageStats)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateConsentMethods(logs: any[]) {
  const methodStats: Record<string, number> = {};

  logs.forEach(log => {
    const method = log.consent_method || 'banner';
    methodStats[method] = (methodStats[method] || 0) + 1;
  });

  return Object.entries(methodStats).map(([method, count]) => ({
    method,
    count,
    percentage: ((count / logs.length) * 100).toFixed(2),
  }));
}

function calculateAverageDecisionTime(logs: any[]) {
  // This would require timestamp tracking of when banner was shown vs when decision was made
  // For now, return a placeholder
  return {
    average: 0,
    median: 0,
    note: 'Decision time tracking requires additional implementation',
  };
}

function extractBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Other';
}

function convertAnalyticsToCSV(data: any): string {
  const rows = [
    ['Metric', 'Value'],
    ['Total Consents', data.overview.total_consents],
    ['Acceptance Rate', `${data.overview.acceptance_rate}%`],
    ['Rejection Rate', `${data.overview.rejection_rate}%`],
    ['Unique Visitors', data.overview.unique_visitors],
    ['Return Visitors', data.overview.return_visitors],
    [],
    ['Date', 'Accepted', 'Rejected', 'Partial', 'Total'],
    ...data.time_series.map((ts: any) => [
      ts.date,
      ts.accepted,
      ts.rejected,
      ts.partial,
      ts.total,
    ]),
  ];

  return rows.map(row => row.join(',')).join('\n');
}

function generateCustomReport(logs: any[], metrics: string[], dimensions: string[]) {
  // Generate custom aggregations based on requested metrics and dimensions
  const report: any = {
    summary: {},
    breakdowns: {},
  };

  // Calculate requested metrics
  if (metrics?.includes('acceptance_rate')) {
    const accepted = logs.filter(l => l.status === 'accepted').length;
    report.summary.acceptance_rate = ((accepted / logs.length) * 100).toFixed(2);
  }

  if (metrics?.includes('total_consents')) {
    report.summary.total_consents = logs.length;
  }

  // Calculate requested dimensions
  if (dimensions?.includes('device')) {
    report.breakdowns.by_device = calculateDeviceAnalytics(logs);
  }

  if (dimensions?.includes('category')) {
    report.breakdowns.by_category = calculateCategoryBreakdown(logs);
  }

  return report;
}
