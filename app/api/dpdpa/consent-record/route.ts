import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { ConsentRecordRequest, ConsentDetails, RuleContext, PartialRuleContext } from '@/types/dpdpa-widget.types';
import { consentRecordRequestSchema } from '@/types/dpdpa-widget.types';

/**
 * Public API endpoint to record DPDPA consent
 * Called by the widget JavaScript on external sites
 * No authentication required - it's publicly accessible
 */

// Types moved to @/types/dpdpa-widget.types.ts

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
      // search by consent id
      query = query.eq('id', search);
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
    // Apply rate limiting to prevent abuse
    const rateLimitResult = checkRateLimit({
      max: 100, // 100 consent records per minute per IP
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Parse and validate request body
    let body: ConsentRecordRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate request using Zod schema
    const validationResult = consentRecordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Use validated data
    body = validationResult.data;

    // Create public supabase client (no auth required for this endpoint)
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
    const currentUrl = body.metadata?.currentUrl || null;
    const pageTitle = body.metadata?.pageTitle || null;

    // Calculate expiration date
    const consentDuration = body.consentDuration || widgetConfig.consent_duration || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);

    // Note: visitor_email_hash field doesn't exist in schema, storing in consent_details instead

    // Check if consent record already exists for this visitor
    const { data: existingConsent, error: existingConsentError } = await supabase
      .from('dpdpa_consent_records')
      .select('id')
      .eq('widget_id', body.widgetId)
      .eq('visitor_id', body.visitorId)
      .order('consent_given_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no records gracefully

    if (existingConsentError) {
      console.error('[Consent Record API] Error checking for existing consent:', existingConsentError);
      // Continue with creating new record if check fails
    }

    let result;

    // Build consent_details JSONB with rule context, activity consents, and extra metadata
    // Validate and sanitize rule context (only include if all required fields are present)
    const ruleContext: RuleContext | null = body.ruleContext && 
      body.ruleContext.ruleId && 
      body.ruleContext.ruleName && 
      body.ruleContext.urlPattern && 
      body.ruleContext.pageUrl ? {
      ruleId: body.ruleContext.ruleId,
      ruleName: body.ruleContext.ruleName,
      urlPattern: body.ruleContext.urlPattern,
      pageUrl: body.ruleContext.pageUrl,
      matchedAt: body.ruleContext.matchedAt || new Date().toISOString(),
    } : null;

    // Validate activity IDs are UUIDs (security: prevent injection)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validatedAcceptedActivities = (body.acceptedActivities || []).filter(id => 
      typeof id === 'string' && uuidRegex.test(id)
    );
    const validatedRejectedActivities = (body.rejectedActivities || []).filter(id => 
      typeof id === 'string' && uuidRegex.test(id)
    );

    // Limit number of activities (prevent abuse)
    if (validatedAcceptedActivities.length > 100 || validatedRejectedActivities.length > 100) {
      return NextResponse.json(
        { 
          error: 'Too many activities in consent record',
          code: 'TOO_MANY_ACTIVITIES'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate activityPurposeConsents if provided
    let validatedActivityPurposeConsents: Record<string, string[]> | undefined = undefined;
    if (body.activityPurposeConsents && typeof body.activityPurposeConsents === 'object') {
      validatedActivityPurposeConsents = {};
      for (const [activityId, purposeIds] of Object.entries(body.activityPurposeConsents)) {
        // Validate activity ID is UUID
        if (typeof activityId === 'string' && uuidRegex.test(activityId)) {
          // Validate purpose IDs are UUIDs
          if (Array.isArray(purposeIds)) {
            const validatedPurposeIds = purposeIds.filter(id => 
              typeof id === 'string' && uuidRegex.test(id)
            );
            if (validatedPurposeIds.length > 0) {
              validatedActivityPurposeConsents[activityId] = validatedPurposeIds;
            }
          }
        }
      }
      // Set to undefined if empty
      if (Object.keys(validatedActivityPurposeConsents).length === 0) {
        validatedActivityPurposeConsents = undefined;
      }
    }

    const consentDetails: ConsentDetails = {
      activityConsents: body.activityConsents || {},
      activityPurposeConsents: validatedActivityPurposeConsents, // Store purpose-level consent
      ruleContext: ruleContext,
      metadata: {
        referrer: referrer || undefined,
        currentUrl: currentUrl || undefined,
        pageTitle: pageTitle || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        deviceType: deviceType || undefined,
        browser: browser || undefined,
        os: os || undefined,
        country: country || undefined,
        language: language || undefined,
      }
    };

    if (existingConsent) {
      // Update existing consent record
      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .update({
          consent_status: body.consentStatus,
          consented_activities: validatedAcceptedActivities,
          rejected_activities: validatedRejectedActivities,
          consent_details: consentDetails, // Store rule context and activity consents
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
          country_code: country?.substring(0, 3) || null, // Truncate to 3 chars for country_code
          language: language,
          updated_at: new Date().toISOString(),
          consent_expires_at: expiresAt.toISOString()
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('[Consent Record API] Error updating consent record:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          widgetId: body.widgetId,
          visitorId: body.visitorId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            error: 'Failed to update consent record',
            code: 'UPDATE_FAILED'
          },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      result = data;
    } else {
      // Generate unique consent_id
      const consentId = `${body.widgetId}_${body.visitorId}_${Date.now()}`;
      
      // Create new consent record
      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert({
          widget_id: body.widgetId,
          visitor_id: body.visitorId,
          consent_id: consentId,
          consent_status: body.consentStatus,
          consented_activities: validatedAcceptedActivities,
          rejected_activities: validatedRejectedActivities,
          consent_details: consentDetails, // Store rule context and activity consents
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
          country_code: country?.substring(0, 3) || null, // Truncate to 3 chars for country_code
          language: language,
          consent_given_at: new Date().toISOString(),
          consent_expires_at: expiresAt.toISOString(),
          privacy_notice_version: '2.0' // Updated version for display rules support
        })
        .select()
        .single();

      if (error) {
        console.error('[Consent Record API] Error creating consent record:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          widgetId: body.widgetId,
          visitorId: body.visitorId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            error: 'Failed to create consent record',
            code: 'CREATE_FAILED'
          },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
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
    // Enhanced error logging for production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Consent Record API] Unexpected error:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
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
