/**
 * Guardian Verification Route
 *
 * POST /api/dpdpa/age-verification/guardian-consent/verify
 *
 * Handles guardian verification after they click the consent link.
 * Guardian must verify their own age via DigiLocker before approving.
 *
 * IMPORTANT: Guardian consent is NOT a separate DigiLocker product.
 * It is simply another DigiLocker verification session for the guardian,
 * which is then logically linked to the minor's verification session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getApiSetuService, calculateSessionExpiry } from '@/lib/apisetu-digilocker';
import { logSuccess, logFailure } from '@/lib/audit';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const initiateGuardianVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const approveConsentSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  guardianSessionId: z.string().min(1, 'Guardian session ID is required'),
  action: z.enum(['approve', 'reject']),
});

// ============================================================================
// POST - Initiate Guardian Verification or Approve/Reject Consent
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit({
      max: 10,
      window: 60000,
      identifier: `guardian_verify:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if this is an approval request or initiation request
    if (body.action === 'approve' || body.action === 'reject') {
      return handleApprovalRequest(supabase, body, request);
    }

    // Handle initiation of guardian verification
    const validation = initiateGuardianVerificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { token } = validation.data;

    // Find guardian consent record
    const { data: consent, error: consentError } = await supabase
      .from('guardian_consent_records')
      .select(`
        *,
        age_verification_sessions!inner(
          id,
          session_id,
          widget_id,
          verified_age,
          dpdpa_widget_configs!inner(
            age_verification_threshold,
            domain,
            user_id
          )
        )
      `)
      .eq('request_token', token)
      .single();

    if (consentError || !consent) {
      return NextResponse.json(
        { error: 'Invalid or expired consent token' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if expired
    if (new Date(consent.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Consent request has expired' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if already processed
    if (consent.status === 'approved' || consent.status === 'rejected') {
      return NextResponse.json(
        { error: `Consent has already been ${consent.status}` },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Update status to viewed
    if (consent.status === 'sent') {
      await supabase
        .from('guardian_consent_records')
        .update({ status: 'viewed', updated_at: new Date().toISOString() })
        .eq('id', consent.id);
    }

    // Check if guardian already verified
    if (consent.guardian_verification_session_id && consent.guardian_verified_age) {
      // Guardian already verified, return approval options
      return NextResponse.json(
        {
          success: true,
          guardianVerified: true,
          guardianAge: consent.guardian_verified_age,
          minorAge: consent.age_verification_sessions?.verified_age,
          domain: consent.age_verification_sessions?.dpdpa_widget_configs?.domain,
          readyForApproval: true,
          message: 'Guardian verified. Please approve or reject the consent request.',
        },
        { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create verification session for guardian
    const apiSetuService = getApiSetuService();
    const guardianSessionId = apiSetuService.generateSessionId();
    const stateToken = apiSetuService.generateStateToken();
    const codeVerifier = apiSetuService.generateCodeVerifier();
    const expiresAt = calculateSessionExpiry(60);

    // Store guardian verification session
    const { data: guardianSessionRow, error: insertError } = await supabase
      .from('age_verification_sessions')
      .insert({
        widget_id: consent.age_verification_sessions?.widget_id,
        visitor_id: `guardian_${consent.id}`,
        session_id: guardianSessionId,
        state_token: stateToken,
        code_verifier: codeVerifier,
        status: 'pending',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-guardian?token=${token}&guardian_session=${guardianSessionId}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !guardianSessionRow) {
      console.error('[Guardian Verify] Failed to create guardian session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create guardian verification session' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Update consent record with guardian session UUID reference
    await supabase
      .from('guardian_consent_records')
      .update({
        guardian_verification_session_id: guardianSessionRow.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consent.id);

    // Generate DigiLocker redirect URL for guardian (with PKCE)
    const redirectUrl = apiSetuService.generateAuthorizationUrl(stateToken, codeVerifier);

    return NextResponse.json(
      {
        success: true,
        guardianVerified: false,
        guardianSessionId,
        redirectUrl,
        minorAge: consent.age_verification_sessions?.verified_age,
        domain: consent.age_verification_sessions?.dpdpa_widget_configs?.domain,
        message: 'Guardian must verify their identity via DigiLocker.',
        mockMode: apiSetuService.isMockMode(),
      },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[Guardian Verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// ============================================================================
// HANDLE APPROVAL/REJECTION
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleApprovalRequest(
  supabase: any,
  body: Record<string, unknown>,
  request: NextRequest
) {
  const validation = approveConsentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.issues },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const { token, guardianSessionId, action } = validation.data;

  // Find guardian consent record
  const { data: consent, error: consentError } = await supabase
    .from('guardian_consent_records')
    .select(`
      *,
      age_verification_sessions!inner(
        id,
        session_id,
        verified_age,
        dpdpa_widget_configs!inner(
          age_verification_threshold,
          user_id
        )
      )
    `)
    .eq('request_token', token)
    .single();

  if (consentError || !consent) {
    return NextResponse.json(
      { error: 'Invalid consent token' },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Verify guardian session completed
  const { data: guardianSession } = await supabase
    .from('age_verification_sessions')
    .select('*')
    .eq('session_id', guardianSessionId)
    .eq('status', 'verified')
    .single();

  if (!guardianSession || guardianSession.verified_age === null) {
    return NextResponse.json(
      { error: 'Guardian must complete age verification first' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Validate guardian is an adult (>= 18)
  if (guardianSession.verified_age < 18) {
    await logFailure(
      consent.age_verification_sessions?.dpdpa_widget_configs?.user_id,
      'guardian_consent.rejected',
      'guardian_consent_record',
      `Guardian is a minor (age: ${guardianSession.verified_age})`,
      request
    );

    return NextResponse.json(
      { error: 'Guardian must be at least 18 years old' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Validate guardian is older than minor (sanity check)
  const minorAge = consent.age_verification_sessions?.verified_age || 0;
  if (guardianSession.verified_age <= minorAge) {
    return NextResponse.json(
      { error: 'Guardian must be older than the minor' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Process approval or rejection
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update guardian consent record
  await supabase
    .from('guardian_consent_records')
    .update({
      status: newStatus,
      guardian_verified_age: guardianSession.verified_age,
      guardian_visitor_id: guardianSession.visitor_id,
      consent_given_at: action === 'approve' ? new Date().toISOString() : null,
      consent_method: 'digilocker',
      updated_at: new Date().toISOString(),
    })
    .eq('id', consent.id);

  // Update minor's verification session with canonical outcome
  // guardian_approved = consent can proceed; blocked_minor = permanently blocked
  const verificationOutcome = action === 'approve' ? 'guardian_approved' : 'blocked_minor';

  await supabase
    .from('age_verification_sessions')
    .update({
      guardian_consent_status: newStatus,
      guardian_verification_id: guardianSession.id,
      verification_outcome: verificationOutcome,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consent.minor_verification_id);

  // Log action
  await logSuccess(
    consent.age_verification_sessions?.dpdpa_widget_configs?.user_id || '',
    newStatus === 'approved' ? 'guardian_consent.approved' : 'guardian_consent.rejected',
    'guardian_consent_record',
    consent.id,
    {
      guardian_age: guardianSession.verified_age,
      minor_age: minorAge,
      action,
    }
  );

  return NextResponse.json(
    {
      success: true,
      status: newStatus,
      message: action === 'approve'
        ? 'Guardian consent has been approved. The minor can now proceed.'
        : 'Guardian consent has been rejected.',
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
