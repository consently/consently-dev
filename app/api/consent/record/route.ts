import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Helper function to tokenize email
function tokenizeEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

// Helper function to detect device type
function getDeviceType(userAgent: string): 'Desktop' | 'Mobile' | 'Tablet' {
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgetId, consentId, status, categories, deviceType, userAgent, language } = body;

    // Validate required fields
    if (!widgetId || !consentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: widgetId, consentId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['accepted', 'rejected', 'partial', 'revoked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: accepted, rejected, partial, or revoked' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Look up the widget config to get user_id
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('widget_configs')
      .select('user_id, domain')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError || !widgetConfig) {
      console.error('Widget lookup error:', widgetError);
      return NextResponse.json(
        { success: false, error: 'Invalid widget ID' },
        { status: 404 }
      );
    }

    // Get IP address and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const requestUserAgent = request.headers.get('user-agent') || userAgent || 'unknown';
    const detectedDeviceType = deviceType || getDeviceType(requestUserAgent);

    // Generate a visitor identifier (using IP + User Agent + Domain)
    const visitorIdentifier = `${ipAddress}-${requestUserAgent.substring(0, 50)}-${widgetConfig.domain}`;
    const visitorEmail = `visitor@${widgetConfig.domain}`;
    const tokenizedEmail = tokenizeEmail(visitorIdentifier);

    // Insert consent record in both tables for compatibility
    // First insert into consent_logs (dashboard reads from here)
    const { data: logData, error: logError } = await supabase
      .from('consent_logs')
      .insert([
        {
          user_id: widgetConfig.user_id,
          consent_id: consentId,
          visitor_token: tokenizedEmail,
          consent_type: 'cookie',
          status,
          categories: categories || ['necessary'],
          device_info: { type: detectedDeviceType },
          ip_address: ipAddress,
          user_agent: requestUserAgent,
          language: language || 'en',
          consent_method: 'banner',
          widget_version: '3.1',
        },
      ])
      .select()
      .single();

    if (logError) {
      console.error('Supabase error inserting consent log:', logError);
    }

    // Also insert into consent_records for backwards compatibility
    const { data, error } = await supabase
      .from('consent_records')
      .insert([
        {
          user_id: widgetConfig.user_id,
          consent_id: consentId,
          visitor_email: visitorEmail,
          tokenized_email: tokenizedEmail,
          consent_type: 'cookie',
          status,
          categories: categories || ['necessary'],
          device_type: detectedDeviceType,
          ip_address: ipAddress,
          user_agent: requestUserAgent,
          language: language || 'en',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting consent:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to record consent', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        consent_id: data.consent_id,
        status: data.status,
        created_at: data.created_at
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
