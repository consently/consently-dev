import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Public API endpoint to verify a user's Consent ID
 * Allows users to retrieve their consent preferences on new devices
 * No authentication required - it's publicly accessible
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit({
      max: 50, // 50 verifications per minute per IP
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          valid: false,
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

    const body = await request.json();
    const { consentID, widgetId } = body;

    // Validate required fields
    if (!consentID || !widgetId) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'consentID and widgetId are required',
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

    // Validate Consent ID format: CNST-XXXX-XXXX-XXXX or legacy vis_xxxxx format
    const isNewFormat = /^CNST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(consentID);
    const isLegacyFormat = /^vis_[a-zA-Z0-9]+$/.test(consentID);
    
    if (!isNewFormat && !isLegacyFormat) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid Consent ID format. Expected format: CNST-XXXX-XXXX-XXXX',
          code: 'INVALID_FORMAT'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Create public supabase client
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
        api: 'verify-consent-id',
      });
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid widget ID or widget is not active',
          code: 'INVALID_WIDGET'
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Look up consent record by visitor_id (which is the Consent ID)
    const { data: consentRecords, error: queryError } = await supabase
      .from('dpdpa_consent_records')
      .select('id, consent_status, consented_activities, rejected_activities, consent_given_at, consent_expires_at, consent_details')
      .eq('visitor_id', consentID)
      .eq('widget_id', widgetId)
      .order('consent_given_at', { ascending: false })
      .limit(1);

    if (queryError) {
      logger.error('Error querying consent records', queryError, {
        consentID,
        widgetId,
        api: 'verify-consent-id',
      });
      return NextResponse.json(
        { 
          valid: false,
          error: 'Failed to verify Consent ID',
          code: 'QUERY_ERROR'
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Check if consent found
    if (!consentRecords || consentRecords.length === 0) {
      logger.info('Consent ID not found', {
        consentID,
        widgetId,
        api: 'verify-consent-id'
      });
      return NextResponse.json(
        { 
          valid: false,
          error: 'Consent ID not found. Please check your ID and try again.',
          code: 'NOT_FOUND'
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const latestConsent = consentRecords[0];
    const now = new Date();

    // Check if consent has expired
    if (latestConsent.consent_expires_at) {
      const expiresAt = new Date(latestConsent.consent_expires_at);
      if (expiresAt < now) {
        return NextResponse.json(
          { 
            valid: false,
            error: 'Consent has expired. Please provide consent again.',
            code: 'EXPIRED',
            expiredAt: latestConsent.consent_expires_at
          },
          { 
            status: 410,
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
          valid: false,
          error: 'Consent was revoked. Please provide consent again.',
          code: 'REVOKED',
          revokedAt: latestConsent.consent_details?.revoked_at || null
        },
        { 
          status: 410,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Consent is valid! Return preferences
    logger.info('Consent ID verified successfully', {
      consentID,
      widgetId,
      api: 'verify-consent-id'
    });

    return NextResponse.json(
      { 
        valid: true,
        preferences: {
          consentStatus: latestConsent.consent_status,
          acceptedActivities: latestConsent.consented_activities || [],
          rejectedActivities: latestConsent.rejected_activities || [],
          timestamp: latestConsent.consent_given_at,
          expiresAt: latestConsent.consent_expires_at,
          consentDetails: latestConsent.consent_details || {}
        },
        message: 'Consent ID verified successfully'
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    logger.error('Unexpected error in verify-consent-id API', error, {
      api: 'verify-consent-id',
    });
    return NextResponse.json(
      { 
        valid: false,
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

