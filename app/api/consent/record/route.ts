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

    console.log('[API] Received consent request:', {
      widgetId,
      consentId,
      status,
      categories: categories || []
    });

    // Validate required fields
    if (!widgetId || !consentId || !status) {
      console.error('[API] Missing required fields:', { widgetId, consentId, status });
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
    let widgetConfig = null;
    let widgetError = null;
    
    const { data: cookieWidgetConfig, error: cookieError } = await supabase
      .from('widget_configs')
      .select('user_id, domain')
      .eq('widget_id', widgetId)
      .single();

    if (cookieError || !cookieWidgetConfig) {
      console.log('[API] Cookie widget lookup failed, trying DPDPA widget configs...');
      
      // Try DPDPA widget configs as fallback
      const { data: dpdpaConfig, error: dpdpaError } = await supabase
        .from('dpdpa_widget_configs')
        .select('user_id, domain')
        .eq('widget_id', widgetId)
        .single();
      
      if (dpdpaError || !dpdpaConfig) {
        console.error('[API] Widget lookup failed for both tables:', {
          cookieError: cookieError?.message,
          dpdpaError: dpdpaError?.message,
          widgetId
        });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid widget ID',
            details: `Widget ${widgetId} not found in widget_configs or dpdpa_widget_configs`
          },
          { status: 404 }
        );
      }
      
      widgetConfig = dpdpaConfig;
      console.log('[API] Using DPDPA widget config');
    } else {
      widgetConfig = cookieWidgetConfig;
      console.log('[API] Using cookie widget config');
    }
    
    console.log('[API] Widget config found:', {
      user_id: widgetConfig.user_id,
      domain: widgetConfig.domain
    });

    // ===== CONSENT LIMIT ENFORCEMENT =====
    // Check if user has exceeded their monthly consent quota
    const userId = widgetConfig.user_id;
    if (userId) {
      const { getEntitlements, checkConsentQuota } = await import('@/lib/subscription');
      const entitlements = await getEntitlements();
      const quotaCheck = await checkConsentQuota(userId, entitlements);
      
      if (!quotaCheck.allowed) {
        console.warn('[API] Consent limit exceeded:', {
          userId,
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          plan: entitlements.plan
        });
        
        const errorResponse = NextResponse.json(
          { 
            success: false, 
            error: 'Monthly consent limit exceeded',
            details: {
              used: quotaCheck.used,
              limit: quotaCheck.limit,
              plan: entitlements.plan,
              message: 'Please upgrade your plan to record more consents this month.'
            }
          },
          { status: 403 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
      }
      
      console.log('[API] Consent quota check passed:', {
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: quotaCheck.remaining
      });
    }

    // Get IP address and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const requestUserAgent = request.headers.get('user-agent') || userAgent || 'unknown';
    const detectedDeviceType = deviceType || getDeviceType(requestUserAgent);

    // Generate a visitor identifier (using IP + User Agent + Domain)
    const visitorIdentifier = `${ipAddress}-${requestUserAgent.substring(0, 50)}-${widgetConfig.domain}`;
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
      console.error('[API] Supabase error inserting consent log:', logError);
    } else {
      console.log('[API] Consent log inserted successfully:', logData?.id);
    }

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
      console.error('[API] Supabase error inserting consent record:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to record consent', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('[API] Consent recorded successfully:', {
      id: data.id,
      consent_id: data.consent_id,
      status: data.status
    });

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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
