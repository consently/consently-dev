import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Public API endpoint to check if consent exists for a visitor
 * Called by the widget JavaScript to check if user already consented
 * No authentication required - it's publicly accessible
 */

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit({
      max: 200, // 200 checks per minute per IP
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

    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');
    const visitorId = searchParams.get('visitorId'); // Consent ID (CNST-XXXX-XXXX-XXXX format)
    const currentUrl = searchParams.get('currentUrl') || null;

    // Validate required parameters
    if (!widgetId || !visitorId) {
      return NextResponse.json(
        {
          error: 'widgetId and visitorId are required',
          code: 'MISSING_PARAMETERS'
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
      .select('widget_id, consent_duration')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      logger.error('Widget validation failed', widgetError, {
        widgetId,
        api: 'check-consent',
      });
      return NextResponse.json(
        {
          error: 'Invalid widget ID or widget is not active',
          code: 'INVALID_WIDGET',
          hasConsent: false
        },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Calculate expiration date
    const consentDuration = widgetConfig.consent_duration || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);
    const now = new Date();

    // Validate visitorId format (Consent ID: CNST-XXXX-XXXX-XXXX or legacy vis_xxxxx)
    const isNewFormat = /^CNST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(visitorId);
    const isLegacyFormat = /^vis_[a-zA-Z0-9]+$/.test(visitorId);

    if (!isNewFormat && !isLegacyFormat) {
      return NextResponse.json(
        {
          error: 'Invalid Consent ID format',
          code: 'INVALID_VISITOR_ID',
          hasConsent: false
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Query for valid consent records by visitor_id (Consent ID)
    const { data: consentRecords, error: queryError } = await supabase
      .from('dpdpa_consent_records')
      .select('id, consent_status, consented_activities, rejected_activities, consent_given_at, consent_expires_at, consent_details, visitor_id')
      .eq('widget_id', widgetId)
      .eq('visitor_id', visitorId)
      .order('consent_given_at', { ascending: false })
      .limit(1);

    if (queryError) {
      logger.error('Error querying consent records', queryError, {
        widgetId,
        visitorId,
        api: 'check-consent',
      });
      return NextResponse.json(
        {
          error: 'Failed to check consent',
          code: 'QUERY_ERROR',
          hasConsent: false
        },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Check if we have any valid consent records
    if (!consentRecords || consentRecords.length === 0) {
      return NextResponse.json(
        {
          hasConsent: false,
          message: 'No consent found'
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Get the most recent consent record
    const latestConsent = consentRecords[0];

    // Check if consent has expired
    if (latestConsent.consent_expires_at) {
      const expiresAtDate = new Date(latestConsent.consent_expires_at);
      if (expiresAtDate < now) {
        return NextResponse.json(
          {
            hasConsent: false,
            message: 'Consent expired',
            expiredAt: latestConsent.consent_expires_at
          },
          {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
    }

    // Check if consent was revoked
    if (latestConsent.consent_status === 'revoked') {
      return NextResponse.json(
        {
          hasConsent: false,
          message: 'Consent was revoked',
          revokedAt: latestConsent.consent_details?.revoked_at || null
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Consent exists and is valid
    logger.info('Found valid consent', {
      visitorId,
      widgetId,
      api: 'check-consent'
    });

    // Return consent details
    const consentData = {
      status: latestConsent.consent_status,
      acceptedActivities: latestConsent.consented_activities || [],
      rejectedActivities: latestConsent.rejected_activities || [],
      timestamp: latestConsent.consent_given_at,
      expiresAt: latestConsent.consent_expires_at || null,
      consentDetails: latestConsent.consent_details || {}
    };

    // Check if this visitor has a verified email (stable consent ID)
    // This allows cross-device sync - if user verifies on device B, they get the same ID from device A
    let stableConsentId = null;
    try {
      // Query preferences to see if this visitor_id has an associated email hash
      const { data: verifiedPrefs, error: verifiedError } = await supabase
        .from('visitor_consent_preferences')
        .select('visitor_email_hash, visitor_id, created_at')
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId)
        .not('visitor_email_hash', 'is', null)
        .limit(1);

      if (!verifiedError && verifiedPrefs && verifiedPrefs.length > 0) {
        const emailHash = verifiedPrefs[0].visitor_email_hash;

        // Find the oldest (canonical) visitor_id for this email hash
        const { data: allDevices, error: devicesError } = await supabase
          .from('visitor_consent_preferences')
          .select('visitor_id, created_at')
          .eq('visitor_email_hash', emailHash)
          .eq('widget_id', widgetId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (!devicesError && allDevices && allDevices.length > 0) {
          stableConsentId = allDevices[0].visitor_id;
          logger.info('Found stable consent ID for verified user', {
            currentId: visitorId,
            stableId: stableConsentId,
            api: 'check-consent'
          });
        }
      }
    } catch (stableIdError) {
      // Non-critical - just log and continue
      logger.warn('Failed to determine stable consent ID (non-critical)', {
        api: 'check-consent',
        error: stableIdError instanceof Error ? stableIdError.message : String(stableIdError)
      });
    }

    return NextResponse.json(
      {
        hasConsent: true,
        consent: consentData,
        stableConsentId: stableConsentId, // May be null for unverified users
        message: 'Valid consent found'
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    logger.error('Unexpected error in check-consent API', error, {
      api: 'check-consent',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        hasConsent: false
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

