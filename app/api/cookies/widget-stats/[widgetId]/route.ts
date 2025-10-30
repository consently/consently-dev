import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
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

    const { widgetId } = params;

    // Verify widget belongs to user
    const { data: widget, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 404 });
    }

    // Fetch consent records for this widget
    const { data: consentLogs, error: logsError } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_type', 'cookie')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (logsError) {
      console.error('Error fetching consent logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch consent logs' }, { status: 500 });
    }

    const logs = consentLogs || [];

    // Calculate statistics
    const totalConsents = logs.length;
    const acceptedCount = logs.filter((l) => l.status === 'accepted').length;
    const rejectedCount = logs.filter((l) => l.status === 'rejected').length;
    const partialCount = logs.filter((l) => l.status === 'partial').length;
    const revokedCount = logs.filter((l) => l.status === 'revoked').length;
    const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const device = log.device_info?.type || 'Unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Browser breakdown (from user_agent parsing)
    const browserBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const userAgent = log.user_agent || '';
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
    });

    // Country breakdown
    const countryBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const country = log.geo_location?.country || 'Unknown';
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
    });

    // Language breakdown
    const languageBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const lang = log.language || 'en';
      languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
    });

    // Time series data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = logs.filter((log) => new Date(log.created_at) >= thirtyDaysAgo);
    const timeSeriesData: Record<string, { accepted: number; rejected: number; partial: number }> = {};
    
    recentLogs.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { accepted: 0, rejected: 0, partial: 0 };
      }
      if (log.status === 'accepted') timeSeriesData[date].accepted++;
      else if (log.status === 'rejected') timeSeriesData[date].rejected++;
      else if (log.status === 'partial') timeSeriesData[date].partial++;
    });

    // Recent consents (last 10)
    const recentConsents = logs.slice(0, 10).map((log) => ({
      id: log.id,
      status: log.status,
      timestamp: log.created_at,
      deviceType: log.device_info?.type || 'Unknown',
      ipAddress: log.ip_address,
      country: log.geo_location?.country || 'Unknown',
      browser: log.user_agent?.includes('Chrome') ? 'Chrome' : 'Other',
    }));

    // Category preferences (if available)
    const categoryBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const categories = log.categories || [];
      categories.forEach((cat: string) => {
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      });
    });

    const stats = {
      widget: {
        id: widget.widget_id,
        domain: widget.domain,
        createdAt: widget.created_at,
      },
      overview: {
        totalConsents,
        acceptedCount,
        rejectedCount,
        partialCount,
        revokedCount,
        acceptanceRate: parseFloat(acceptanceRate.toFixed(2)),
        uniqueVisitors: new Set(logs.map((l) => l.visitor_token)).size,
      },
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      languageBreakdown,
      categoryBreakdown,
      timeSeriesData,
      recentConsents,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching widget stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
