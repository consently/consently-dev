/**
 * Age Verification API - Main Routes
 *
 * POST /api/dpdpa/age-verification - Initiate verification session
 * GET /api/dpdpa/age-verification - Check verification status
 *
 * Implements government-backed age verification via DigiLocker (API Setu)
 * for DPDPA 2023 "verifiable parental consent" compliance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import {
  getApiSetuService,
  calculateSessionExpiry,
  requiresGuardianConsent,
  isAgeAboveThreshold,
} from '@/lib/apisetu-digilocker';
import { logSuccess } from '@/lib/audit';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const initiateSchema = z.object({
  widgetId: z.string().min(1, 'Widget ID is required'),
  visitorId: z.string().min(1, 'Visitor ID is required'),
  returnUrl: z.string().url('Invalid return URL'),
});

const statusSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// ============================================================================
// POST - Initiate Age Verification Session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const rateLimitResult = await checkRateLimit({
      max: 10,
      window: 60000,
      identifier: `age_verify_init:${getClientIdentifier(request.headers)}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            'Access-Control-Allow-Origin': '*',
          },
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

    const validation = initiateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { widgetId, visitorId, returnUrl } = validation.data;

    // Validate required environment variables for DigiLocker integration
    const isMockMode = process.env.APISETU_USE_MOCK === 'true';
    if (!isMockMode) {
      const requiredEnvVars = [
        'APISETU_CLIENT_ID',
        'APISETU_CLIENT_SECRET',
        'APISETU_REDIRECT_URI',
      ];
      const missingVars = requiredEnvVars.filter(v => !process.env[v]);
      if (missingVars.length > 0) {
        console.error('[Age Verification] Missing required environment variables:', missingVars);
        return NextResponse.json(
          {
            error: 'Age verification service is not configured. Please contact support.',
            code: 'SERVICE_NOT_CONFIGURED',
          },
          { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // Create Supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify widget exists and has age verification enabled
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, require_age_verification, age_verification_threshold, minor_handling, user_id')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Invalid widget ID or widget is not active' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!widgetConfig.require_age_verification) {
      return NextResponse.json(
        { error: 'Age verification is not enabled for this widget' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Initialize API Setu service
    const apiSetuService = getApiSetuService();

    // Generate session, state tokens, and PKCE code verifier
    const sessionId = apiSetuService.generateSessionId();
    const stateToken = apiSetuService.generateStateToken();
    const codeVerifier = apiSetuService.generateCodeVerifier();
    const expiresAt = calculateSessionExpiry(60); // 1 hour expiry

    // Generate authorization URL with PKCE
    const redirectUrl = apiSetuService.generateAuthorizationUrl(stateToken, codeVerifier);

    // Store session in database (including code_verifier for callback)
    const { error: insertError } = await supabase
      .from('age_verification_sessions')
      .insert({
        widget_id: widgetId,
        visitor_id: visitorId,
        session_id: sessionId,
        state_token: stateToken,
        code_verifier: codeVerifier,
        status: 'pending',
        return_url: returnUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[Age Verification] Failed to create session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create verification session' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Log initiation
    await logSuccess(
      widgetConfig.user_id,
      'age_verification.initiated',
      'age_verification_session',
      sessionId,
      {
        widget_id: widgetId,
        visitor_id: visitorId,
        mock_mode: apiSetuService.isMockMode(),
      }
    );

    return NextResponse.json(
      {
        success: true,
        sessionId,
        redirectUrl,
        expiresAt: expiresAt.toISOString(),
        mockMode: apiSetuService.isMockMode(),
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[Age Verification] Initiate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// ============================================================================
// GET - Check Verification Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 60 requests per minute per session
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const rateLimitResult = await checkRateLimit({
      max: 60,
      window: 60000,
      identifier: `age_verify_status:${sessionId}`,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create Supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('age_verification_sessions')
      .select(`
        *,
        dpdpa_widget_configs!inner(
          age_verification_threshold,
          minor_handling,
          verification_validity_days
        )
      `)
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        {
          status: 'expired',
          verified: false,
          message: 'Verification session has expired. Please start again.',
        },
        { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Build response based on status
    const widgetConfig = session.dpdpa_widget_configs;
    const threshold = widgetConfig?.age_verification_threshold || 18;
    const isMinor = session.verified_age !== null && session.verified_age < threshold;

    let verificationAssertion = null;

    // Generate verification assertion if verified and adult (or minor with guardian consent)
    if (
      session.status === 'verified' &&
      session.verified_age !== null &&
      (!isMinor || session.guardian_consent_status === 'approved')
    ) {
      const apiSetuService = getApiSetuService();
      const validityDays = widgetConfig?.verification_validity_days || 365;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      verificationAssertion = apiSetuService.generateVerificationAssertion({
        sessionId: session.session_id,
        visitorId: session.visitor_id,
        widgetId: session.widget_id,
        age: session.verified_age,
        verifiedAt: new Date(session.verified_at),
        expiresAt,
      });
    }

    return NextResponse.json(
      {
        status: session.status,
        verified: session.status === 'verified',
        age: session.verified_age,
        isMinor,
        requiresGuardianConsent: session.requires_guardian_consent,
        guardianConsentStatus: session.guardian_consent_status,
        verificationAssertion,
        documentType: session.document_type,
        verifiedAt: session.verified_at,
        message: getStatusMessage(session.status, isMinor, session.guardian_consent_status),
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[Age Verification] Status check error:', error);
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

function getStatusMessage(
  status: string,
  isMinor: boolean,
  guardianConsentStatus: string | null
): string {
  switch (status) {
    case 'pending':
      return 'Verification session created. Please complete verification via DigiLocker.';
    case 'in_progress':
      return 'Verification in progress. Please wait...';
    case 'verified':
      if (isMinor) {
        if (guardianConsentStatus === 'approved') {
          return 'Age verified with guardian consent. You may proceed.';
        } else if (guardianConsentStatus === 'pending') {
          return 'You are under the required age. Waiting for guardian approval.';
        } else if (guardianConsentStatus === 'rejected') {
          return 'Guardian consent was denied. You cannot proceed.';
        } else {
          return 'You are under the required age. Guardian consent is required.';
        }
      }
      return 'Age verified successfully. You may proceed.';
    case 'failed':
      return 'Verification failed. Please try again.';
    case 'expired':
      return 'Session expired. Please start a new verification.';
    default:
      return 'Unknown status.';
  }
}
