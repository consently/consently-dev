/**
 * Age Verification Callback Route
 *
 * GET /api/dpdpa/age-verification/callback
 *
 * Handles the OAuth callback from DigiLocker after user authentication.
 * Exchanges code for token, fetches age, and updates session.
 *
 * SECURITY NOTES:
 * - Validates state token to prevent CSRF attacks
 * - Access token is used once and immediately discarded
 * - DOB is discarded after age calculation
 * - Only verified_age is stored in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { getApiSetuService, requiresGuardianConsent } from '@/lib/apisetu-digilocker';
import { logSuccess, logFailure } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const isMock = searchParams.get('mock') === 'true';

  // Handle OAuth errors
  if (error) {
    console.error('[Age Verification Callback] OAuth error:', error, errorDescription);
    return redirectWithError('oauth_error', errorDescription || error);
  }

  // Validate required parameters
  if (!state) {
    return redirectWithError('missing_state', 'Missing state parameter');
  }

  try {
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Log incoming state for debugging
    console.log('[Age Verification Callback] Received state:', state);
    console.log('[Age Verification Callback] Received code:', code ? 'present' : 'missing');

    // Find session by state token (without join first to debug)
    const { data: session, error: sessionError } = await supabase
      .from('age_verification_sessions')
      .select('*')
      .eq('state_token', state)
      .single();

    if (sessionError) {
      console.error('[Age Verification Callback] Supabase error:', sessionError);
      console.error('[Age Verification Callback] State token:', state);

      // Try to find any recent sessions for debugging
      const { data: recentSessions } = await supabase
        .from('age_verification_sessions')
        .select('id, session_id, state_token, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('[Age Verification Callback] Recent sessions:', recentSessions);

      return redirectWithError('invalid_state', 'Invalid or expired verification session');
    }

    if (!session) {
      console.error('[Age Verification Callback] Session not found for state:', state);
      return redirectWithError('invalid_state', 'Invalid or expired verification session');
    }

    console.log('[Age Verification Callback] Found session:', session.session_id, 'status:', session.status);

    // Fetch widget config separately
    const { data: widgetConfig } = await supabase
      .from('dpdpa_widget_configs')
      .select('age_verification_threshold, minor_handling, user_id')
      .eq('widget_id', session.widget_id)
      .single();

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await updateSessionStatus(supabase, session.id, 'expired');
      return redirectWithError('session_expired', 'Verification session has expired');
    }

    // Check if session already processed
    if (session.status === 'verified' || session.status === 'failed') {
      return redirectToWidget(session.return_url, session.session_id, session.status);
    }

    // Update status to in_progress
    await updateSessionStatus(supabase, session.id, 'in_progress');

    const apiSetuService = getApiSetuService();
    const threshold = widgetConfig?.age_verification_threshold || 18;
    const minorHandling = widgetConfig?.minor_handling || 'block';

    // Get PKCE code verifier from session (needed for token exchange)
    const codeVerifier = session.code_verifier || '';
    if (!codeVerifier && !isMock && !apiSetuService.isMockMode()) {
      await updateSessionFailed(supabase, session.id, 'Missing PKCE code verifier');
      return redirectWithError('internal_error', 'Session data incomplete - please try again');
    }

    // Handle mock mode
    if (isMock || apiSetuService.isMockMode()) {
      // Use mock code from URL or default
      const mockCode = code || 'mock_adult_code';
      const result = await apiSetuService.completeVerification(mockCode, codeVerifier || 'mock_verifier', threshold);

      if (!result.success) {
        await updateSessionFailed(supabase, session.id, result.error || 'Verification failed');
        await logFailure(
          widgetConfig?.user_id,
          'age_verification.failed',
          'age_verification_session',
          result.error || 'Verification failed',
          request
        );
        return redirectWithError('verification_failed', result.error || 'Verification failed');
      }

      // Update session with verified result
      const isMinor = !result.meetsAgeThreshold;
      const needsGuardianConsent = isMinor && minorHandling === 'guardian_consent';

      await updateSessionVerified(supabase, session.id, {
        verified_age: result.age!,
        document_type: result.documentType,
        consent_artifact_ref: result.consentArtifactRef,
        requires_guardian_consent: needsGuardianConsent,
        guardian_consent_status: needsGuardianConsent ? 'pending' : 'not_required',
      });

      await logSuccess(
        widgetConfig?.user_id || '',
        'age_verification.completed',
        'age_verification_session',
        session.session_id,
        {
          age: result.age,
          is_minor: isMinor,
          requires_guardian_consent: needsGuardianConsent,
          mock_mode: true,
        }
      );

      return redirectToWidget(session.return_url, session.session_id, 'verified');
    }

    // Real DigiLocker verification
    if (!code) {
      await updateSessionFailed(supabase, session.id, 'Missing authorization code');
      return redirectWithError('missing_code', 'Missing authorization code');
    }

    // Validate state token (CSRF protection)
    if (!apiSetuService.validateStateToken(state, session.state_token)) {
      await updateSessionFailed(supabase, session.id, 'Invalid state token');
      return redirectWithError('invalid_state', 'State token mismatch - possible CSRF attack');
    }

    // Complete verification with PKCE (exchange code using verifier, call AVS endpoint)
    const result = await apiSetuService.completeVerification(code, codeVerifier, threshold);

    if (!result.success) {
      await updateSessionFailed(supabase, session.id, result.error || 'Verification failed');
      await logFailure(
        widgetConfig?.user_id,
        'age_verification.failed',
        'age_verification_session',
        result.error || 'Verification failed',
        request
      );
      return redirectWithError('verification_failed', result.error || 'Verification failed');
    }

    // Determine if guardian consent is needed based on AVS result
    const isMinor = !result.meetsAgeThreshold;
    const needsGuardianConsent = isMinor && minorHandling === 'guardian_consent';

    // Update session with verified age
    await updateSessionVerified(supabase, session.id, {
      verified_age: result.age!,
      document_type: result.documentType,
      consent_artifact_ref: result.consentArtifactRef,
      requires_guardian_consent: needsGuardianConsent,
      guardian_consent_status: needsGuardianConsent ? 'pending' : 'not_required',
    });

    // Log success
    await logSuccess(
      widgetConfig?.user_id || '',
      'age_verification.completed',
      'age_verification_session',
      session.session_id,
      {
        age: result.age,
        is_minor: isMinor,
        requires_guardian_consent: needsGuardianConsent,
        document_type: result.documentType,
      }
    );

    // Redirect back to widget
    return redirectToWidget(session.return_url, session.session_id, 'verified');
  } catch (error) {
    console.error('[Age Verification Callback] Unexpected error:', error);
    return redirectWithError(
      'internal_error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateSessionStatus(
  supabase: any,
  sessionId: string,
  status: string
) {
  await supabase
    .from('age_verification_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateSessionFailed(
  supabase: any,
  sessionId: string,
  error: string
) {
  await supabase
    .from('age_verification_sessions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateSessionVerified(
  supabase: any,
  sessionId: string,
  data: {
    verified_age: number;
    document_type: string | null;
    consent_artifact_ref: string | null;
    requires_guardian_consent: boolean;
    guardian_consent_status: string;
  }
) {
  await supabase
    .from('age_verification_sessions')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    })
    .eq('id', sessionId);
}

function redirectWithError(errorCode: string, errorMessage: string): NextResponse {
  // Redirect to a generic error page or back to widget with error
  const errorUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://consently.in');
  errorUrl.pathname = '/age-verification-error';
  errorUrl.searchParams.set('error', errorCode);
  errorUrl.searchParams.set('message', errorMessage);

  return NextResponse.redirect(errorUrl.toString());
}

function redirectToWidget(
  returnUrl: string | null,
  sessionId: string,
  status: string
): NextResponse {
  if (!returnUrl) {
    // Fallback to success page
    const successUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://consently.in');
    successUrl.pathname = '/age-verification-complete';
    successUrl.searchParams.set('session', sessionId);
    successUrl.searchParams.set('status', status);
    return NextResponse.redirect(successUrl.toString());
  }

  // Append session info to return URL
  const redirectUrl = new URL(returnUrl);
  redirectUrl.searchParams.set('age_verification_session', sessionId);
  redirectUrl.searchParams.set('age_verification_status', status);

  return NextResponse.redirect(redirectUrl.toString());
}

// ============================================================================
// OPTIONS - CORS Preflight (not typically needed for redirects)
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
