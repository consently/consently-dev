import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Initialize Supabase client for Edge
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    }
  }
);

// Helper function to tokenize identifier (Edge compatible)
async function tokenizeIdentifier(identifier: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(identifier.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Look up the widget config to get user_id
    let widgetConfig = null;
    
    const { data: cookieWidgetConfig } = await supabase
      .from('widget_configs')
      .select('user_id, domain')
      .eq('widget_id', widgetId)
      .single();

    if (!cookieWidgetConfig) {
      // Try DPDPA widget configs as fallback
      const { data: dpdpaConfig } = await supabase
        .from('dpdpa_widget_configs')
        .select('user_id, domain')
        .eq('widget_id', widgetId)
        .single();
      
      if (!dpdpaConfig) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid widget ID',
          },
          { status: 404 }
        );
      }
      
      widgetConfig = dpdpaConfig;
    } else {
      widgetConfig = cookieWidgetConfig;
    }

    // ===== CONSENT LIMIT ENFORCEMENT (Simplified for Edge) =====
    // In production, use Redis for quota checks to avoid DB overhead in Edge
    const userId = widgetConfig.user_id;

    // Get IP address and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const requestUserAgent = request.headers.get('user-agent') || userAgent || 'unknown';
    const detectedDeviceType = deviceType || getDeviceType(requestUserAgent);

    // Generate a visitor identifier (using IP + User Agent + Domain)
    const visitorIdentifier = `${ipAddress}-${requestUserAgent.substring(0, 50)}-${widgetConfig.domain}`;
    const tokenizedEmail = await tokenizeIdentifier(visitorIdentifier);

    // Insert consent record in both tables for compatibility
    // First insert into consent_logs (dashboard reads from here)
    void supabase
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
      ]);

    // Also insert into consent_records for backwards compatibility
    const { data, error } = await supabase
      .from('consent_records')
      .insert([
        {
          user_id: widgetConfig.user_id,
          consent_id: consentId,
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
      return NextResponse.json(
        { success: false, error: 'Failed to record consent' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        consent_id: data.consent_id,
        status: data.status,
        created_at: data.created_at
      }
    });
    
    // Add CORS headers for cross-origin widget requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error: any) {
    console.error('[API] Unexpected error:', error);
    console.error('[API] Error stack:', error.stack);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
    
    // Add CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    },
  });
}
