/**
 * DigiLocker OAuth Callback Endpoint
 * 
 * GET /api/auth/digilocker/callback (as configured in DigiLocker portal)
 * 
 * Handles the OAuth callback from DigiLocker:
 * 1. Validates state parameter (CSRF protection)
 * 2. Handles user denial errors
 * 3. Retrieves code_verifier from Redis
 * 4. Exchanges authorization code for access token
 * 5. Parses DOB and calculates age
 * 6. Encrypts and stores tokens in database
 * 7. Redirects to frontend with verification result
 * 
 * Query Parameters (from DigiLocker):
 * - code: Authorization code (on success)
 * - state: State parameter from authorization request
 * - error: Error code (on failure)
 * - error_description: Error description (on failure)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  verifyAge,
  encryptToken,
  DigiLockerError,
  getErrorMessage,
} from '@/lib/digilocker';
import { redis } from '@/lib/redis';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { logSuccess, logError, AuditAction } from '@/lib/audit';
import { signAgeVerificationToken } from '@/lib/age-verification-token';

export const dynamic = 'force-dynamic';

// ============================================================================
// Anonymous age verification (popup) flow helpers
// ============================================================================

function postMessageHTML(data: Record<string, unknown>) {
  const json = JSON.stringify({ type: 'consently-age-verification', ...data });
  return new NextResponse(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Age Verification</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex; align-items: center; justify-content: center; min-height: 100vh;
    margin: 0; background: #f8fafc; color: #334155; }
  .card { text-align: center; padding: 2rem; }
  .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #4c8bf5;
    border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="card">
  <div class="spinner"></div>
  <p>Returning to the website...</p>
</div>
<script>
  (function() {
    try {
      if (window.opener) {
        window.opener.postMessage(${json}, '*');
      }
    } catch (e) { console.error('postMessage failed:', e); }
    setTimeout(function() { window.close(); }, 1500);
  })();
</script>
</body>
</html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Handle the anonymous widget age verification flow.
 * Called when the state matches a `verify-age:state:` Redis key.
 */
async function handleAnonymousAgeVerification(
  code: string,
  stateData: { codeVerifier: string; widgetId: string; ageThreshold: number; validityDays: number }
): Promise<NextResponse> {
  try {
    // Exchange code for token using the default registered redirect URI
    const tokenResponse = await exchangeCodeForToken(code, stateData.codeVerifier);

    if ('error' in tokenResponse) {
      throw new Error((tokenResponse as any).error_description || 'Token exchange failed');
    }

    if (!tokenResponse.dob) {
      return postMessageHTML({
        status: 'error',
        error: 'missing_dob',
        errorDescription: 'Could not retrieve date of birth from DigiLocker',
      });
    }

    const ageResult = verifyAge(tokenResponse.dob);
    const isAdult = ageResult.age >= stateData.ageThreshold;

    // Sign JWT — no database storage needed for anonymous flow
    const token = await signAgeVerificationToken({
      isAdult,
      ageThreshold: stateData.ageThreshold,
      widgetId: stateData.widgetId,
      validityDays: stateData.validityDays,
    });

    console.log('[DigiLocker Callback] Anonymous age verification complete:', {
      widgetId: stateData.widgetId,
      isAdult,
      age: ageResult.age,
      threshold: stateData.ageThreshold,
    });

    return postMessageHTML({ status: 'success', token, isAdult });
  } catch (err) {
    console.error('[DigiLocker Callback] Anonymous verification error:', err);
    const message = err instanceof Error ? err.message : 'Verification failed';
    return postMessageHTML({
      status: 'error',
      error: 'verification_failed',
      errorDescription: message,
    });
  }
}

// ============================================================================
// Main callback handler
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check Redis is available
    if (!redis) {
      const errorUrl = new URL('/age-verification', request.url);
      errorUrl.searchParams.set('error', 'service_unavailable');
      errorUrl.searchParams.set('error_description', 'Session storage is not available');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Parse query parameters
    const url = new URL(request.url);
    const { searchParams } = url;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // ====================================================================
    // Check if this is an anonymous widget age verification (popup flow)
    // These use `verify-age:state:{state}` Redis keys set by /api/verify-age/init
    // ====================================================================
    if (state && redis) {
      const anonRaw = await redis.get(`verify-age:state:${state}`);
      if (anonRaw) {
        // Delete immediately to prevent replay
        await redis.del(`verify-age:state:${state}`);

        // Handle error from DigiLocker
        if (error) {
          console.error('[DigiLocker Callback] Anonymous flow - DigiLocker error:', error, errorDescription);
          return postMessageHTML({
            status: 'error',
            error: error,
            errorDescription: errorDescription || 'Verification was cancelled or failed',
          });
        }

        if (!code) {
          return postMessageHTML({
            status: 'error',
            error: 'invalid_request',
            errorDescription: 'Missing authorization code',
          });
        }

        const stateData = typeof anonRaw === 'string' ? JSON.parse(anonRaw) : anonRaw as any;
        return handleAnonymousAgeVerification(code, stateData);
      }
    }

    // Debug: Log full callback URL (mask sensitive data)
    console.log('[DigiLocker Callback] Full URL:', url.toString().replace(/code=[^&]+/, 'code=***'));
    console.log('[DigiLocker Callback] Query params:', {
      code: code ? `present (${code.length} chars)` : 'MISSING',
      state: state ? `present (${state.length} chars)` : 'MISSING',
      error: error || 'none',
      errorDescription: errorDescription || 'none',
      allParams: Array.from(searchParams.keys()),
    });

    // Get user session for logging
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Handle user denial or DigiLocker error
    if (error) {
      console.error(`[DigiLocker Callback] DigiLocker returned error:`, {
        error,
        errorDescription,
        state: state || 'MISSING',
        hasState: !!state,
      });
      
      // Log the error
      if (userId) {
        await logError(
          userId,
          'digilocker.callback' as AuditAction,
          'digilocker',
          `DigiLocker error: ${error}`,
          { error, error_description: errorDescription }
        );
      }

      // Parse state to get redirect URL if available
      let redirectTo = '/age-verification';
      if (state) {
        try {
          const stateData = await redis.get(`digilocker:state:${state}`);
          if (stateData) {
            // Upstash Redis may return parsed object or string
            const parsed = typeof stateData === 'string' ? JSON.parse(stateData) : stateData;
            redirectTo = parsed.redirectTo || redirectTo;
            // Clean up Redis
            await redis.del(`digilocker:state:${state}`);
          }
        } catch (parseError) {
          console.error('Failed to parse state data:', parseError);
          // Continue with default redirectTo
        }
      }

      // Redirect to frontend with error
      const errorUrl = new URL(redirectTo, request.url);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('error_description', errorDescription || 'Authentication failed');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[DigiLocker Callback] MISSING PARAMS:', {
        code: code ? 'present' : 'MISSING',
        state: state ? 'present' : 'MISSING',
        fullUrl: url.toString().replace(/code=[^&]+/, 'code=***'),
        searchParams: Object.fromEntries(searchParams.entries()),
      });
      
      const errorUrl = new URL('/age-verification', request.url);
      errorUrl.searchParams.set('error', 'invalid_request');
      errorUrl.searchParams.set('error_description', encodeURIComponent(`Missing required parameters: ${!code ? 'code ' : ''}${!state ? 'state' : ''}`));
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // CSRF Protection: Validate state and retrieve code_verifier
    const stateData = await redis.get<string>(`digilocker:state:${state}`);
    
    if (!stateData) {
      console.error('State not found in Redis - possible CSRF attack or expired session');
      
      if (userId) {
        await logError(
          userId,
          'digilocker.callback' as AuditAction,
          'digilocker',
          'Invalid or expired state parameter',
          { state }
        );
      }

      const errorUrl = new URL('/age-verification', request.url);
      errorUrl.searchParams.set('error', 'session_expired');
      errorUrl.searchParams.set('error_description', 'Your session has expired. Please try again.');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // Parse state data - Upstash Redis may return parsed object or string
    const parsedState = typeof stateData === 'string' ? JSON.parse(stateData) : stateData;
    
    const { codeVerifier, userId: stateUserId, redirectTo } = parsedState;

    // Verify user matches (security check)
    if (userId && stateUserId && userId !== stateUserId) {
      console.error('User ID mismatch in state');
      
      await logError(
        userId,
        'digilocker.callback' as AuditAction,
        'digilocker',
        'User ID mismatch in state parameter',
        { expected: stateUserId, received: userId }
      );

      const errorUrl = new URL('/age-verification', request.url);
      errorUrl.searchParams.set('error', 'security_error');
      errorUrl.searchParams.set('error_description', 'Security validation failed');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // Delete used PKCE to prevent replay attacks
    await redis.del(`digilocker:state:${state}`);

    const effectiveUserId = userId || stateUserId;
    
    if (!effectiveUserId) {
      console.error('No user ID found in state or session');
      
      const errorUrl = new URL('/age-verification', request.url);
      errorUrl.searchParams.set('error', 'unauthorized');
      errorUrl.searchParams.set('error_description', 'User authentication required');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // Step 1: Exchange code for token (returns DOB in DDMMYYYY format)
    const tokenData = await exchangeCodeForToken(code, codeVerifier);

    // Handle API errors in token response
    if ('error' in tokenData) {
      throw new DigiLockerError(
        (tokenData as any).error,
        (tokenData as any).error_description || 'Token exchange failed'
      );
    }

    // Log the DOB that will be used for verification
    console.log('[DigiLocker Callback] Final DOB for verifyAge:', tokenData.dob);
    console.log('[DigiLocker Callback] User info:', {
      digilockerid: tokenData.digilockerid,
      name: tokenData.name,
      gender: tokenData.gender,
    });

    // Step 2: Verify age (18+ logic)
    const ageVerification = verifyAge(tokenData.dob!);

    // Step 3: Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokenData.access_token);
    // refresh_token may not always be provided by DigiLocker
    const encryptedRefreshToken = tokenData.refresh_token 
      ? await encryptToken(tokenData.refresh_token)
      : '';

    // Step 4: Store verification data using service client (bypasses RLS)
    const serviceClient = await createServiceClient();
    
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const consentValidTill = tokenData.consent_valid_till 
      ? new Date(tokenData.consent_valid_till)
      : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // Default 31 days

    const { error: dbError } = await serviceClient
      .from('digilocker_verifications')
      .upsert({
        user_id: effectiveUserId,
        digilocker_id: tokenData.digilockerid,
        name: tokenData.name || 'Unknown',
        dob_raw: tokenData.dob,
        date_of_birth: ageVerification.birthDate.split('T')[0], // ISO date only
        age_at_verification: ageVerification.age,
        is_adult: ageVerification.isAdult,
        gender: tokenData.gender?.charAt(0).toUpperCase() as 'M' | 'F' | 'T' | 'O' | undefined,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        consent_valid_till: consentValidTill.toISOString(),
        reference_key: tokenData.reference_key,
        eaadhaar_linked: tokenData.eaadhaar === 'Y',
        issuer_id: 'in.consently',
      }, {
        onConflict: 'digilocker_id',
        ignoreDuplicates: false,
      });

    if (dbError) {
      console.error('Failed to save verification data:', dbError);
      throw new DigiLockerError('database_error', `Failed to save verification: ${dbError.message}`);
    }

    // Step 5: Log successful verification
    await logSuccess(
      effectiveUserId,
      'digilocker.verification_success' as AuditAction,
      'digilocker',
      effectiveUserId,
      {
        digilocker_id: tokenData.digilockerid,
        is_adult: ageVerification.isAdult,
        age: ageVerification.age,
        eaadhaar_linked: tokenData.eaadhaar === 'Y',
        duration_ms: Date.now() - startTime,
      }
    );

    // Step 6: Redirect to frontend with success params
    const successUrl = new URL(redirectTo || '/age-verification', request.url);
    successUrl.searchParams.set('verified', 'true');
    successUrl.searchParams.set('isAdult', ageVerification.isAdult.toString());
    successUrl.searchParams.set('age', ageVerification.age.toString());
    successUrl.searchParams.set('name', encodeURIComponent(tokenData.name || 'Unknown'));
    
    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('DigiLocker callback error:', error);
    
    const errorInfo = getErrorMessage(error instanceof Error ? error : new Error('Unknown error'));
    
    // Try to log error
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logError(
          user.id,
          'digilocker.callback' as AuditAction,
          'digilocker',
          errorInfo.message,
          { 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          }
        );
      }
    } catch {
      // Ignore logging errors
    }

    // Redirect to frontend with error
    const errorUrl = new URL('/age-verification', request.url);
    errorUrl.searchParams.set('error', error instanceof DigiLockerError ? error.code : 'server_error');
    errorUrl.searchParams.set('error_description', encodeURIComponent(errorInfo.message));
    
    return NextResponse.redirect(errorUrl.toString());
  }
}
