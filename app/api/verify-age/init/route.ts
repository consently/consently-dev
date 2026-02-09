import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { generatePKCEAsync, buildAuthorizationUrl } from '@/lib/digilocker';
import { redis } from '@/lib/redis';
import { env } from '@/lib/env';

/**
 * POST /api/verify-age/init
 *
 * Initiates a DigiLocker OAuth flow for anonymous widget visitors.
 * Returns an authorization URL that should be opened in a popup.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 req / 5 min per IP (strict)
    const rateLimitResult = await checkRateLimit({
      max: 5,
      window: 300000, // 5 minutes
      identifier: `verify-age-init:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (rateLimitResult.retryAfter || 300).toString(),
          },
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.widgetId || typeof body.widgetId !== 'string') {
      return NextResponse.json(
        { error: 'widgetId is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { widgetId } = body;

    // Validate widget exists and has age verification enabled
    const supabase = await createClient();
    const { data: widgetConfig, error: configError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, require_age_verification, age_verification_threshold, verification_validity_days')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
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

    // Check public redirect URI is configured
    const publicRedirectUri = env.DIGILOCKER_PUBLIC_REDIRECT_URI;
    if (!publicRedirectUri) {
      console.error('[verify-age/init] DIGILOCKER_PUBLIC_REDIRECT_URI not configured');
      return NextResponse.json(
        { error: 'Age verification not configured' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Generate PKCE pair
    const { codeVerifier, codeChallenge } = await generatePKCEAsync();

    // Generate state
    const state = crypto.randomUUID();

    // Store state in Redis (TTL 600s = 10 minutes)
    const stateData = {
      codeVerifier,
      widgetId,
      ageThreshold: widgetConfig.age_verification_threshold ?? 18,
      validityDays: widgetConfig.verification_validity_days ?? 365,
    };

    if (redis) {
      await redis.set(`verify-age:state:${state}`, JSON.stringify(stateData), { ex: 600 });
    } else {
      // Fallback: encode state data in the state param itself (less secure but works without Redis)
      console.warn('[verify-age/init] Redis not available, state management degraded');
      return NextResponse.json(
        { error: 'Server configuration error - Redis required' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Build authorization URL with public redirect URI override
    const authUrl = buildAuthorizationUrl(
      codeChallenge,
      state,
      'verification',
      publicRedirectUri
    );

    return NextResponse.json(
      { authUrl, state },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[verify-age/init] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
