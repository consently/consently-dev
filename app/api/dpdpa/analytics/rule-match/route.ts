import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { RuleMatchEvent } from '@/types/dpdpa-widget.types';

/**
 * Public API endpoint to track rule match events
 * Called by the widget JavaScript on external sites
 * No authentication required - it's publicly accessible
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const rateLimitResult = checkRateLimit({
      max: 200, // 200 rule match events per minute per IP
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
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

    // Parse request body
    let body: RuleMatchEvent;
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

    // Validate required fields
    if (!body.widgetId || !body.visitorId || !body.ruleId || !body.ruleName) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: widgetId, visitorId, ruleId, ruleName',
          code: 'MISSING_FIELDS'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate trigger type
    if (!['onPageLoad', 'onClick', 'onFormSubmit', 'onScroll'].includes(body.triggerType)) {
      return NextResponse.json(
        { 
          error: 'Invalid trigger type',
          code: 'INVALID_TRIGGER_TYPE'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Create public supabase client (no auth required for this endpoint)
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify widget exists and is active
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('widget_id', body.widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Invalid widget ID or widget is not active' },
        { status: 404 }
      );
    }

    // Extract IP address and country from request headers (if available)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // You can use a geolocation service here to get country from IP
    // For now, we'll use the country from the request body if provided
    const country = body.country || 'Unknown';

    // Insert rule match event
    const { error: insertError } = await supabase
      .from('dpdpa_rule_match_events')
      .insert({
        widget_id: body.widgetId,
        visitor_id: body.visitorId,
        rule_id: body.ruleId,
        rule_name: body.ruleName,
        url_pattern: body.urlPattern,
        page_url: body.pageUrl,
        matched_at: body.matchedAt || new Date().toISOString(),
        trigger_type: body.triggerType,
        user_agent: body.userAgent || null,
        device_type: body.deviceType || null,
        country: country,
        language: body.language || null,
      });

    if (insertError) {
      console.error('[Analytics API] Error inserting rule match event:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to record rule match event',
          code: 'INSERT_FAILED'
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Rule match event recorded successfully'
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

