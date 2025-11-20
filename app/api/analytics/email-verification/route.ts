import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email Verification Analytics API
 * Provides metrics and statistics for email verification flows
 */

interface EmailVerificationMetrics {
  overview: {
    totalOtpSent: number;
    totalVerified: number;
    totalFailed: number;
    totalSkipped: number;
    totalRateLimited: number;
    verificationRate: number; // percentage
    skipRate: number; // percentage
    averageTimeToVerifySeconds: number;
  };
  timeSeries: Array<{
    date: string;
    otpSent: number;
    verified: number;
    failed: number;
    skipped: number;
    rateLimited: number;
  }>;
  byWidget: Array<{
    widgetId: string;
    widgetName: string;
    otpSent: number;
    verified: number;
    verificationRate: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    visitorId: string;
    createdAt: string;
    metadata: any;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const widgetId = searchParams.get('widgetId');
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Base query filters
    let eventsQuery = supabase
      .from('email_verification_events')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Filter by widget if specified
    if (widgetId) {
      eventsQuery = eventsQuery.eq('widget_id', widgetId);
    }

    // Get all events
    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('[Analytics] Error fetching events:', eventsError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch analytics data: ${eventsError.message}` },
        { status: 500 }
      );
    }

    // Calculate overview metrics
    const otpSentEvents = events?.filter(e => e.event_type === 'otp_sent') || [];
    const verifiedEvents = events?.filter(e => e.event_type === 'otp_verified') || [];
    const failedEvents = events?.filter(e => e.event_type === 'otp_failed') || [];
    const skippedEvents = events?.filter(e => e.event_type === 'otp_skipped') || [];
    const rateLimitedEvents = events?.filter(e => e.event_type === 'rate_limited') || [];

    const totalOtpSent = otpSentEvents.length;
    const totalVerified = verifiedEvents.length;
    const totalFailed = failedEvents.length;
    const totalSkipped = skippedEvents.length;
    const totalRateLimited = rateLimitedEvents.length;

    const verificationRate = totalOtpSent > 0 
      ? (totalVerified / totalOtpSent) * 100 
      : 0;

    const skipRate = totalOtpSent > 0 
      ? (totalSkipped / totalOtpSent) * 100 
      : 0;

    // Calculate average time to verify
    const timeToVerifyValues = verifiedEvents
      .map(e => e.metadata?.time_to_verify_seconds)
      .filter(t => t !== undefined && t !== null);
    
    const averageTimeToVerifySeconds = timeToVerifyValues.length > 0
      ? Math.round(timeToVerifyValues.reduce((sum, t) => sum + t, 0) / timeToVerifyValues.length)
      : 0;

    // Calculate time series data (daily)
    const timeSeriesMap = new Map<string, {
      date: string;
      otpSent: number;
      verified: number;
      failed: number;
      skipped: number;
      rateLimited: number;
    }>();

    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      timeSeriesMap.set(dateKey, {
        date: dateKey,
        otpSent: 0,
        verified: 0,
        failed: 0,
        skipped: 0,
        rateLimited: 0,
      });
    }

    // Populate time series data
    events?.forEach(event => {
      const dateKey = event.created_at.split('T')[0];
      const dayData = timeSeriesMap.get(dateKey);
      if (dayData) {
        if (event.event_type === 'otp_sent') dayData.otpSent++;
        else if (event.event_type === 'otp_verified') dayData.verified++;
        else if (event.event_type === 'otp_failed') dayData.failed++;
        else if (event.event_type === 'otp_skipped') dayData.skipped++;
        else if (event.event_type === 'rate_limited') dayData.rateLimited++;
      }
    });

    const timeSeries = Array.from(timeSeriesMap.values());

    // Calculate by-widget metrics
    const widgetMap = new Map<string, {
      widgetId: string;
      widgetName: string;
      otpSent: number;
      verified: number;
    }>();

    events?.forEach(event => {
      if (!widgetMap.has(event.widget_id)) {
        widgetMap.set(event.widget_id, {
          widgetId: event.widget_id,
          widgetName: '', // Will be populated later
          otpSent: 0,
          verified: 0,
        });
      }
      const widgetData = widgetMap.get(event.widget_id)!;
      if (event.event_type === 'otp_sent') widgetData.otpSent++;
      else if (event.event_type === 'otp_verified') widgetData.verified++;
    });

    // Fetch widget names
    const widgetIds = Array.from(widgetMap.keys());
    if (widgetIds.length > 0) {
      const { data: widgets } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id, name')
        .in('widget_id', widgetIds);

      widgets?.forEach(widget => {
        const widgetData = widgetMap.get(widget.widget_id);
        if (widgetData) {
          widgetData.widgetName = widget.name || widget.widget_id;
        }
      });
    }

    const byWidget = Array.from(widgetMap.values()).map(w => ({
      ...w,
      verificationRate: w.otpSent > 0 ? (w.verified / w.otpSent) * 100 : 0,
    }));

    // Get recent events (last 50)
    const recentEvents = (events || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map(e => ({
        id: e.id,
        eventType: e.event_type,
        visitorId: e.visitor_id,
        createdAt: e.created_at,
        metadata: e.metadata,
      }));

    const metrics: EmailVerificationMetrics = {
      overview: {
        totalOtpSent,
        totalVerified,
        totalFailed,
        totalSkipped,
        totalRateLimited,
        verificationRate: Math.round(verificationRate * 100) / 100,
        skipRate: Math.round(skipRate * 100) / 100,
        averageTimeToVerifySeconds,
      },
      timeSeries,
      byWidget,
      recentEvents,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days,
        widgetId: widgetId || 'all',
      },
    });

  } catch (error) {
    console.error('[Analytics] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
