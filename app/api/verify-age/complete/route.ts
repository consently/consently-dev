import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

/**
 * POST /api/verify-age/complete
 *
 * Records a completed age verification session in the database.
 * Called by the widget after successful DigiLocker verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 req / min per IP
    const rateLimitResult = await checkRateLimit({
      max: 10,
      window: 60000, // 1 minute
      identifier: `verify-age-complete:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          },
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.widgetId || !body.visitorId || !body.verificationOutcome) {
      return NextResponse.json(
        { error: 'widgetId, visitorId, and verificationOutcome are required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { widgetId, visitorId, verificationOutcome, verifiedAge, token } = body;

    // Validate verification outcome
    const validOutcomes = ['verified_adult', 'blocked_minor', 'limited_access'];
    if (!validOutcomes.includes(verificationOutcome)) {
      return NextResponse.json(
        { error: 'Invalid verification outcome' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = await createClient();

    // Get widget config to determine expiration
    const { data: widgetConfig, error: configError } = await supabase
      .from('dpdpa_widget_configs')
      .select('verification_validity_days, require_age_verification')
      .eq('widget_id', widgetId)
      .single();

    if (configError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!widgetConfig.require_age_verification) {
      return NextResponse.json(
        { error: 'Age verification not enabled for this widget' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Calculate expiration date
    const validityDays = widgetConfig.verification_validity_days || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Insert or update age verification session
    const { error: insertError } = await supabase.from('age_verification_sessions').upsert(
      {
        widget_id: widgetId,
        visitor_id: visitorId,
        status: 'verified',
        verification_outcome: verificationOutcome,
        verified_age: verifiedAge || null,
        verification_token: token || null,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'widget_id,visitor_id',
      }
    );

    if (insertError) {
      console.error('[verify-age/complete] Error saving verification session:', insertError);
      return NextResponse.json(
        { error: 'Failed to save verification session' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log('[verify-age/complete] Age verification recorded:', {
      widgetId,
      visitorId: visitorId.substring(0, 10) + '...',
      outcome: verificationOutcome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Age verification recorded successfully',
        expiresAt: expiresAt.toISOString(),
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[verify-age/complete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
