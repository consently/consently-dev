import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Public API endpoint to record DPDPA consent
 * Called by the widget JavaScript on external sites
 * No authentication required - it's publicly accessible
 */

interface ConsentRecordRequest {
  widgetId: string;
  visitorId: string;
  visitorEmail?: string;
  consentStatus: 'accepted' | 'rejected' | 'partial';
  acceptedActivities: string[];
  rejectedActivities: string[];
  activityConsents: Record<string, { status: string; timestamp: string }>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    language?: string;
    referrer?: string;
  };
  consentDuration?: number; // in days
}

// Helper function to hash email for privacy
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Helper function to detect device type from user agent
function detectDeviceType(userAgent: string): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  
  if (/mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(ua)) {
    return 'Mobile';
  }
  
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'Desktop';
  }
  
  return 'Unknown';
}

// Helper function to extract browser info
function extractBrowserInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  
  return 'Unknown';
}

// Helper function to extract OS info
function extractOSInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  
  return 'Unknown';
}

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all';
    const widgetId = searchParams.get('widgetId') || undefined;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('dpdpa_consent_records')
      .select('*', { count: 'exact' })
      .order('consent_timestamp', { ascending: false });

    // Filter by widgets owned by the user
    const { data: widgets } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id);

    const widgetIds = (widgets || []).map((w: any) => w.widget_id);
    if (widgetId) {
      if (!widgetIds.includes(widgetId)) {
        return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 404 });
      }
      query = query.eq('widget_id', widgetId);
    } else if (widgetIds.length > 0) {
      query = query.in('widget_id', widgetIds);
    } else {
      return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } });
    }

    if (search) {
      // search by email or consent id
      query = query.or(`visitor_email.ilike.%${search}%,id.eq.${search}`);
    }

    if (status !== 'all') {
      query = query.eq('consent_status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching DPDPA consent records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching DPDPA consent records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsentRecordRequest = await request.json();

    // Validate required fields
    if (!body.widgetId || !body.visitorId || !body.consentStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: widgetId, visitorId, consentStatus' },
        { status: 400 }
      );
    }

    // Validate consent status
    if (!['accepted', 'rejected', 'partial'].includes(body.consentStatus)) {
      return NextResponse.json(
        { error: 'Invalid consent status. Must be accepted, rejected, or partial' },
        { status: 400 }
      );
    }

    // Create supabase client
    const supabase = await createClient();

    // Verify widget exists and is active
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, consent_duration')
      .eq('widget_id', body.widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Invalid widget ID or widget is not active' },
        { status: 404 }
      );
    }

    // Extract metadata from request
    const userAgent = request.headers.get('user-agent') || body.metadata?.userAgent || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     body.metadata?.ipAddress || 
                     'unknown';

    const deviceType = body.metadata?.deviceType || detectDeviceType(userAgent);
    const browser = body.metadata?.browser || extractBrowserInfo(userAgent);
    const os = body.metadata?.os || extractOSInfo(userAgent);
    const country = body.metadata?.country || 'Unknown';
    const language = body.metadata?.language || request.headers.get('accept-language')?.split(',')[0] || 'en';
    const referrer = body.metadata?.referrer || request.headers.get('referer') || null;

    // Calculate expiration date
    const consentDuration = body.consentDuration || widgetConfig.consent_duration || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);

    // Hash email if provided
    const visitorEmailHash = body.visitorEmail ? hashEmail(body.visitorEmail) : null;

    // Check if consent record already exists for this visitor
    const { data: existingConsent } = await supabase
      .from('dpdpa_consent_records')
      .select('id')
      .eq('widget_id', body.widgetId)
      .eq('visitor_id', body.visitorId)
      .order('consent_timestamp', { ascending: false })
      .limit(1)
      .single();

    let result;

    if (existingConsent) {
      // Update existing consent record
      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .update({
          consent_status: body.consentStatus,
          accepted_activities: body.acceptedActivities || [],
          rejected_activities: body.rejectedActivities || [],
          activity_consents: body.activityConsents || {},
          visitor_email: body.visitorEmail || null,
          visitor_email_hash: visitorEmailHash,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
          country: country,
          language: language,
          referrer: referrer,
          last_updated: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          widget_version: '1.0.0'
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating consent record:', error);
        return NextResponse.json(
          { error: 'Failed to update consent record' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new consent record
      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert({
          widget_id: body.widgetId,
          visitor_id: body.visitorId,
          visitor_email: body.visitorEmail || null,
          visitor_email_hash: visitorEmailHash,
          consent_status: body.consentStatus,
          accepted_activities: body.acceptedActivities || [],
          rejected_activities: body.rejectedActivities || [],
          activity_consents: body.activityConsents || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
          country: country,
          language: language,
          referrer: referrer,
          consent_timestamp: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          consent_version: '1.0',
          widget_version: '1.0.0'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating consent record:', error);
        return NextResponse.json(
          { error: 'Failed to create consent record' },
          { status: 500 }
        );
      }

      result = data;
    }

    // Return success response
    return NextResponse.json({
      success: true,
      consentId: result.id,
      expiresAt: result.expires_at,
      message: 'Consent recorded successfully'
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
