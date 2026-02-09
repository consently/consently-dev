import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { env } from '@/lib/env';
import { exchangeCodeForToken, verifyAge } from '@/lib/digilocker';
import { signAgeVerificationToken } from '@/lib/age-verification-token';

/**
 * GET /api/verify-age/callback
 *
 * DigiLocker OAuth callback. Runs inside the popup window.
 * Exchanges the code for tokens, verifies age, signs a JWT,
 * and posts the result back to the opener via postMessage.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Helper: return an HTML page that posts a message to the opener and closes
  function htmlResponse(html: string, status = 200) {
    return new NextResponse(html, {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  function postMessageHTML(data: Record<string, unknown>) {
    const json = JSON.stringify({ type: 'consently-age-verification', ...data });
    return htmlResponse(`<!DOCTYPE html>
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
  .success { color: #16a34a; }
  .error { color: #dc2626; }
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
</html>`);
  }

  // Handle DigiLocker error callback
  if (error) {
    console.error('[verify-age/callback] DigiLocker error:', error, errorDescription);
    return postMessageHTML({
      status: 'error',
      error: error,
      errorDescription: errorDescription || 'Verification was cancelled or failed',
    });
  }

  // Validate required params
  if (!code || !state) {
    return postMessageHTML({
      status: 'error',
      error: 'invalid_request',
      errorDescription: 'Missing authorization code or state',
    });
  }

  // Retrieve and delete state from Redis (one-time use for replay prevention)
  if (!redis) {
    console.error('[verify-age/callback] Redis not available');
    return postMessageHTML({
      status: 'error',
      error: 'server_error',
      errorDescription: 'Server configuration error',
    });
  }

  let stateData: {
    codeVerifier: string;
    widgetId: string;
    ageThreshold: number;
    validityDays: number;
  } | null = null;

  try {
    const raw = await redis.get(`verify-age:state:${state}`);
    if (!raw) {
      return postMessageHTML({
        status: 'error',
        error: 'invalid_state',
        errorDescription: 'Verification session expired or invalid. Please try again.',
      });
    }
    // Delete immediately to prevent replay
    await redis.del(`verify-age:state:${state}`);
    stateData = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as typeof stateData;
  } catch (err) {
    console.error('[verify-age/callback] Redis error:', err);
    return postMessageHTML({
      status: 'error',
      error: 'server_error',
      errorDescription: 'Failed to validate session',
    });
  }

  if (!stateData) {
    return postMessageHTML({
      status: 'error',
      error: 'invalid_state',
      errorDescription: 'Invalid verification session',
    });
  }

  try {
    const publicRedirectUri = env.DIGILOCKER_PUBLIC_REDIRECT_URI;
    if (!publicRedirectUri) {
      throw new Error('DIGILOCKER_PUBLIC_REDIRECT_URI not configured');
    }

    // Exchange code for token using the public redirect URI
    const tokenResponse = await exchangeCodeForToken(
      code,
      stateData.codeVerifier,
      publicRedirectUri
    );

    // Extract DOB and verify age
    if (!tokenResponse.dob) {
      return postMessageHTML({
        status: 'error',
        error: 'missing_dob',
        errorDescription: 'Could not retrieve date of birth from DigiLocker',
      });
    }

    const ageResult = verifyAge(tokenResponse.dob);
    const isAdult = ageResult.age >= stateData.ageThreshold;

    // Sign JWT
    const token = await signAgeVerificationToken({
      isAdult,
      ageThreshold: stateData.ageThreshold,
      widgetId: stateData.widgetId,
      validityDays: stateData.validityDays,
    });

    console.log('[verify-age/callback] Verification complete:', {
      widgetId: stateData.widgetId,
      isAdult,
      age: ageResult.age,
      threshold: stateData.ageThreshold,
    });

    return postMessageHTML({
      status: 'success',
      token,
      isAdult,
    });
  } catch (err) {
    console.error('[verify-age/callback] Token exchange / verification error:', err);
    const message = err instanceof Error ? err.message : 'Verification failed';
    return postMessageHTML({
      status: 'error',
      error: 'verification_failed',
      errorDescription: message,
    });
  }
}
