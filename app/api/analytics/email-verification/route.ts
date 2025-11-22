import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email Verification Analytics API
 * Provides metrics and statistics for email verification flows
 * Restricted to admin users only
 */

// Hardcoded admin credentials (secured with environment variables recommended for production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@consently.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'C0n$ently@dm!n2024#Secure';

// Verify admin authentication
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

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
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        }
      );
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const widgetId = searchParams.get('widgetId');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If filtering by user, first get their widget IDs
    let widgetIdsToFilter: string[] | null = null;
    if (userId) {
      const { data: userWidgets, error: widgetsError } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id')
        .eq('user_id', userId);

      if (widgetsError) {
        console.error('[Analytics] Error fetching user widgets:', widgetsError);
        return NextResponse.json(
          { success: false, error: `Failed to fetch user widgets: ${widgetsError.message}` },
          { status: 500 }
        );
      }

      widgetIdsToFilter = userWidgets?.map(w => w.widget_id) || [];
      
      // If user has no widgets, return empty results
      if (widgetIdsToFilter.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalOtpSent: 0,
              totalVerified: 0,
              totalFailed: 0,
              totalSkipped: 0,
              totalRateLimited: 0,
              verificationRate: 0,
              skipRate: 0,
              averageTimeToVerifySeconds: 0,
            },
            timeSeries: [],
            byWidget: [],
            recentEvents: [],
          },
          meta: {
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
            days,
            widgetId: widgetId || 'all',
            userId: userId || 'all',
          },
        });
      }
    }

    // Base query filters
    let eventsQuery = supabase
      .from('email_verification_events')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Filter by user's widgets if userId is specified
    if (widgetIdsToFilter && widgetIdsToFilter.length > 0) {
      eventsQuery = eventsQuery.in('widget_id', widgetIdsToFilter);
    }

    // Filter by specific widget if specified (takes precedence)
    if (widgetId) {
      // If userId is also specified, ensure the widget belongs to that user
      if (userId && widgetIdsToFilter && !widgetIdsToFilter.includes(widgetId)) {
        return NextResponse.json(
          { success: false, error: 'Widget does not belong to the specified user' },
          { status: 400 }
        );
      }
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

    // Fetch widget names and user info
    const widgetIds = Array.from(widgetMap.keys());
    if (widgetIds.length > 0) {
      let widgetsQuery = supabase
        .from('dpdpa_widget_configs')
        .select('widget_id, name, user_id');

      // If filtering by user, only fetch widgets for that user
      if (userId) {
        widgetsQuery = widgetsQuery.eq('user_id', userId);
      }

      widgetsQuery = widgetsQuery.in('widget_id', widgetIds);

      const { data: widgets } = await widgetsQuery;

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
        userId: userId || 'all',
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
