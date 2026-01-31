/**
 * MeriPehchaan Consent Postback Route
 *
 * POST /api/meri-pehchaan/consent/postback
 *
 * Receives consent artefact postbacks from MeriPehchaan's consent service.
 * MeriPehchaan sends a signed JWT containing the consent artefact when a user
 * grants, denies, or revokes consent through the MeriPehchaan/DigiLocker portal.
 *
 * SECURITY:
 * - JWT signature verified using static JWKS (RS256)
 * - Postback key validated via timing-safe comparison
 * - Audience claim checked against our consent client ID
 * - Rate limited to prevent abuse
 * - Full audit trail for DPDPA compliance
 *
 * Postback URL registered with API Setu:
 *   https://www.consently.in/api/meri-pehchaan/consent/postback
 * Consent Client ID: UK0F7C1979
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { processConsentPostback } from '@/lib/meripehchaan-consent';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

// ============================================================================
// POST - Receive Consent Artefact Postback
// ============================================================================

export async function POST(request: NextRequest) {
  const requestId = `mp_postback_${Date.now()}`;

  try {
    // Rate limiting: webhook preset — 1000 req/hour per IP
    const rateLimitResult = await checkRateLimit({
      max: 1000,
      window: 3600000,
      identifier: `mp_consent_postback:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      logger.warn('MeriPehchaan consent postback rate limited', {
        requestId,
        ip: getClientIdentifier(request.headers),
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          },
        }
      );
    }

    // Validate required environment variables
    if (!process.env.MERIPEHCHAAN_CONSENT_STATIC_JWKS) {
      logger.error('MeriPehchaan consent postback: JWKS not configured');
      return NextResponse.json(
        { error: 'Consent postback service not configured', code: 'SERVICE_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    // Parse request body
    // MeriPehchaan may send the JWT in different formats:
    // 1. As a raw JWT string in the body
    // 2. As JSON with a "token" or "consent_artefact" field
    // 3. As form-urlencoded with a "token" field
    let jwt: string | null = null;
    let postbackKey: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = await request.json();
        jwt =
          body.token ||
          body.consent_artefact ||
          body.consentArtefact ||
          body.jwt ||
          body.signed_consent ||
          body.signedConsent ||
          null;
        // Postback key may be in the body
        postbackKey =
          body.postback_key ||
          body.postbackKey ||
          body.key ||
          null;
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      jwt =
        (formData.get('token') as string) ||
        (formData.get('consent_artefact') as string) ||
        (formData.get('jwt') as string) ||
        null;
      postbackKey =
        (formData.get('postback_key') as string) ||
        (formData.get('key') as string) ||
        null;
    } else {
      // Try reading as raw text (raw JWT)
      const rawBody = await request.text();
      if (rawBody && rawBody.split('.').length === 3) {
        jwt = rawBody.trim();
      }
    }

    // Also check for postback key in headers (common pattern for webhooks)
    if (!postbackKey) {
      postbackKey =
        request.headers.get('x-postback-key') ||
        request.headers.get('x-api-key') ||
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        null;
    }

    if (!jwt) {
      logger.warn('MeriPehchaan consent postback: no JWT found in request', { requestId });
      return NextResponse.json(
        { error: 'Missing consent artefact JWT in request body' },
        { status: 400 }
      );
    }

    // Process the consent postback (verify JWT + extract artefact)
    logger.info('MeriPehchaan consent postback received', {
      requestId,
      hasPostbackKey: !!postbackKey,
      jwtLength: jwt.length,
    });

    const result = processConsentPostback(jwt, postbackKey || undefined);

    if (!result.success || !result.artefact) {
      logger.error('MeriPehchaan consent postback verification failed', undefined, {
        requestId,
        error: result.error,
        errorCode: result.errorCode,
      });

      await logAudit({
        user_id: 'system',
        action: 'consent.record',
        resource_type: 'meripehchaan_consent_artefact',
        changes: {
          error: result.error,
          errorCode: result.errorCode,
          requestId,
        },
        ip_address:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        status: 'failure',
        error_message: result.error,
      });

      // Return appropriate error — 401 for auth failures, 400 for bad data
      const statusCode =
        result.errorCode === 'INVALID_POSTBACK_KEY' ||
        result.errorCode === 'JWT_VERIFICATION_FAILED' ||
        result.errorCode === 'AUDIENCE_MISMATCH'
          ? 401
          : 400;

      return NextResponse.json(
        {
          error: result.error,
          code: result.errorCode,
        },
        { status: statusCode }
      );
    }

    const artefact = result.artefact;

    // Store consent artefact in database
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check for duplicate acknowledgement ID (idempotency)
    const { data: existing } = await supabase
      .from('meripehchaan_consent_artefacts')
      .select('id, status')
      .eq('acknowledgement_id', artefact.acknowledgementId)
      .single();

    if (existing) {
      // Update existing record if status changed (e.g., granted -> revoked)
      if (existing.status !== artefact.status) {
        const { error: updateError } = await supabase
          .from('meripehchaan_consent_artefacts')
          .update({
            status: artefact.status,
            consent_timestamp: artefact.consentTimestamp,
            valid_until: artefact.validUntil,
            raw_jwt: artefact.rawJwt,
            claims: artefact.claims,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          logger.error('Failed to update consent artefact', updateError, {
            requestId,
            acknowledgementId: artefact.acknowledgementId,
          });
        } else {
          logger.info('MeriPehchaan consent artefact updated', {
            requestId,
            acknowledgementId: artefact.acknowledgementId,
            oldStatus: existing.status,
            newStatus: artefact.status,
          });
        }
      } else {
        logger.info('MeriPehchaan consent postback duplicate (idempotent)', {
          requestId,
          acknowledgementId: artefact.acknowledgementId,
        });
      }
    } else {
      // Insert new consent artefact
      const { error: insertError } = await supabase
        .from('meripehchaan_consent_artefacts')
        .insert({
          acknowledgement_id: artefact.acknowledgementId,
          subject_id: artefact.subjectId,
          status: artefact.status,
          consent_timestamp: artefact.consentTimestamp,
          valid_until: artefact.validUntil,
          scopes: artefact.scopes,
          data_categories: artefact.dataCategories,
          raw_jwt: artefact.rawJwt,
          claims: artefact.claims,
          ip_address:
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            null,
          user_agent: request.headers.get('user-agent') || null,
        });

      if (insertError) {
        logger.error('Failed to store consent artefact', insertError, {
          requestId,
          acknowledgementId: artefact.acknowledgementId,
        });
        return NextResponse.json(
          { error: 'Failed to store consent artefact' },
          { status: 500 }
        );
      }

      logger.info('MeriPehchaan consent artefact stored', {
        requestId,
        acknowledgementId: artefact.acknowledgementId,
        status: artefact.status,
        subjectId: artefact.subjectId,
      });
    }

    // Audit log
    await logAudit({
      user_id: 'system',
      action: 'consent.record',
      resource_type: 'meripehchaan_consent_artefact',
      resource_id: artefact.acknowledgementId,
      changes: {
        status: artefact.status,
        subjectId: artefact.subjectId,
        scopes: artefact.scopes,
        requestId,
      },
      ip_address:
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    // Respond with acknowledgement
    // MeriPehchaan expects a 200 OK with the acknowledgement ID echoed back
    return NextResponse.json(
      {
        success: true,
        acknowledgementId: artefact.acknowledgementId,
        status: artefact.status,
        message: 'Consent artefact received and processed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      'MeriPehchaan consent postback unexpected error',
      error instanceof Error ? error : undefined,
      { requestId }
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS - CORS Preflight
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, X-Postback-Key, X-API-Key, Authorization',
      },
    }
  );
}
