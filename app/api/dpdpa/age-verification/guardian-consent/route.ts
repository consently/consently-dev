/**
 * Guardian Consent API Routes
 *
 * POST /api/dpdpa/age-verification/guardian-consent - Request guardian consent
 * GET /api/dpdpa/age-verification/guardian-consent - Check guardian consent status
 *
 * Handles the guardian consent workflow for minors under DPDPA 2023.
 * Guardian must verify their identity via DigiLocker before approving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getApiSetuService, calculateSessionExpiry } from '@/lib/apisetu-digilocker';
import { logSuccess, logFailure } from '@/lib/audit';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const requestConsentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  guardianEmail: z.string().email('Valid email is required'),
  guardianPhone: z.string().optional(),
  relationship: z.enum(['parent', 'guardian', 'other']),
});

// ============================================================================
// POST - Request Guardian Consent
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 5 minutes per IP (sensitive operation)
    const rateLimitResult = await checkRateLimit({
      max: 5,
      window: 300000,
      identifier: `guardian_consent_request:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const validation = requestConsentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { sessionId, guardianEmail, guardianPhone, relationship } = validation.data;

    // Create Supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find verification session
    const { data: session, error: sessionError } = await supabase
      .from('age_verification_sessions')
      .select(`
        *,
        dpdpa_widget_configs!inner(
          domain,
          minor_guardian_message,
          user_id
        )
      `)
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Verification session not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Verify session requires guardian consent
    if (!session.requires_guardian_consent) {
      return NextResponse.json(
        { error: 'Guardian consent is not required for this session' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if guardian consent already requested
    const { data: existingConsent } = await supabase
      .from('guardian_consent_records')
      .select('id, status')
      .eq('minor_verification_id', session.id)
      .in('status', ['pending', 'sent', 'viewed', 'approved'])
      .single();

    if (existingConsent) {
      if (existingConsent.status === 'approved') {
        return NextResponse.json(
          { error: 'Guardian consent has already been approved' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      // Allow re-sending if pending/sent
    }

    // Generate unique request token
    const requestToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create or update guardian consent record
    const consentData = {
      minor_verification_id: session.id,
      minor_visitor_id: session.visitor_id,
      guardian_email: guardianEmail,
      guardian_phone: guardianPhone || null,
      relationship,
      request_token: requestToken,
      status: 'sent',
      request_sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || null,
    };

    let consentRecord;
    if (existingConsent) {
      // Update existing record
      const { data, error } = await supabase
        .from('guardian_consent_records')
        .update(consentData)
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('[Guardian Consent] Failed to update consent record:', error);
        return NextResponse.json(
          { error: 'Failed to update consent request' },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      consentRecord = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('guardian_consent_records')
        .insert(consentData)
        .select()
        .single();

      if (error) {
        console.error('[Guardian Consent] Failed to create consent record:', error);
        return NextResponse.json(
          { error: 'Failed to create consent request' },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      consentRecord = data;
    }

    // Generate verification link for guardian
    const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-guardian?token=${requestToken}`;

    // TODO: Send email to guardian (integrate with email service)
    // For now, log and return the link
    console.log('[Guardian Consent] Verification link generated:', verificationLink);
    console.log('[Guardian Consent] Send email to:', guardianEmail);

    // Log success
    await logSuccess(
      session.dpdpa_widget_configs?.user_id || '',
      'guardian_consent.requested',
      'guardian_consent_record',
      consentRecord.id,
      {
        minor_session_id: sessionId,
        guardian_email: guardianEmail,
        relationship,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Guardian consent request sent to ${guardianEmail}`,
        consentId: consentRecord.id,
        expiresAt: expiresAt.toISOString(),
        // Include verification link in development/mock mode for testing
        ...(getApiSetuService().isMockMode() && { verificationLink }),
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[Guardian Consent] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// ============================================================================
// GET - Check Guardian Consent Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const token = request.nextUrl.searchParams.get('token');

    if (!sessionId && !token) {
      return NextResponse.json(
        { error: 'Session ID or token is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('guardian_consent_records')
      .select(`
        id,
        status,
        relationship,
        consent_given_at,
        expires_at,
        guardian_verified_age,
        age_verification_sessions!inner(
          session_id,
          verified_age,
          status
        )
      `);

    if (token) {
      query = query.eq('request_token', token);
    } else if (sessionId) {
      query = query.eq('age_verification_sessions.session_id', sessionId);
    }

    const { data: consent, error } = await query.single();

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Guardian consent record not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if expired
    if (new Date(consent.expires_at) < new Date()) {
      return NextResponse.json(
        {
          status: 'expired',
          message: 'Guardian consent request has expired. Please request a new one.',
        },
        { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Type assertion for Supabase join result (inner join returns single object, not array)
    const ageSession = consent.age_verification_sessions as unknown as { session_id: string; verified_age: number; status: string } | null;

    return NextResponse.json(
      {
        status: consent.status,
        relationship: consent.relationship,
        consentGivenAt: consent.consent_given_at,
        expiresAt: consent.expires_at,
        minorAge: ageSession?.verified_age,
        guardianVerified: consent.guardian_verified_age !== null,
        message: getConsentStatusMessage(consent.status),
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[Guardian Consent] Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getConsentStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Guardian consent request is pending.';
    case 'sent':
      return 'Guardian consent request has been sent. Waiting for guardian to respond.';
    case 'viewed':
      return 'Guardian has viewed the consent request.';
    case 'approved':
      return 'Guardian has approved the consent request.';
    case 'rejected':
      return 'Guardian has rejected the consent request.';
    case 'expired':
      return 'Guardian consent request has expired.';
    default:
      return 'Unknown status.';
  }
}
