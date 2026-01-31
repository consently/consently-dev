/**
 * DigiLocker OAuth Initiation Endpoint
 * 
 * GET /api/digilocker/init
 * 
 * Initiates the DigiLocker OAuth flow by:
 * 1. Generating PKCE pair (code_verifier, code_challenge)
 * 2. Storing code_verifier in Redis (10 min TTL)
 * 3. Generating state parameter for CSRF protection
 * 4. Redirecting to DigiLocker authorization URL
 * 
 * Query Parameters:
 * - redirect_to: URL to redirect after callback (optional, defaults to /age-verification)
 * - purpose: Purpose of verification (kyc|verification|compliance|availing_services|educational)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePKCEAsync, buildAuthorizationUrl } from '@/lib/digilocker';
import { redis } from '@/lib/redis';
import { createClient } from '@/lib/supabase/server';
import { logSuccess, logError, AuditAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// PKCE code verifier TTL in seconds (10 minutes)
const PKCE_TTL = 600;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect_to') || '/age-verification';
    const purpose = searchParams.get('purpose') as 'kyc' | 'verification' | 'compliance' | 'availing_services' | 'educational' || 'kyc';

    // Validate redirect_to to prevent open redirect vulnerabilities
    const allowedDomains = [
      'localhost',
      'consently.in',
      'www.consently.in',
    ];
    
    const redirectUrl = new URL(redirectTo, request.url);
    const isAllowedDomain = allowedDomains.some(domain => 
      redirectUrl.hostname === domain || redirectUrl.hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain && redirectTo.startsWith('http')) {
      return NextResponse.json(
        { error: 'invalid_redirect', message: 'Invalid redirect URL' },
        { status: 400 }
      );
    }

    // Generate PKCE pair
    const { codeVerifier, codeChallenge } = await generatePKCEAsync();

    // Check Redis is available
    if (!redis) {
      return NextResponse.json(
        { error: 'service_unavailable', message: 'Session storage is not available' },
        { status: 503 }
      );
    }

    // Generate state parameter (CSRF protection + session tracking)
    const state = crypto.randomUUID();

    // Store code verifier and metadata in Redis
    const stateData = {
      codeVerifier,
      userId: user.id,
      redirectTo: redirectTo.startsWith('http') ? redirectTo : redirectUrl.pathname + redirectUrl.search,
      purpose,
      createdAt: new Date().toISOString(),
    };

    await redis.setex(`digilocker:state:${state}`, PKCE_TTL, JSON.stringify(stateData));

    // Log initiation
    await logSuccess(
      user.id,
      'digilocker.init' as AuditAction,
      'digilocker',
      user.id,
      { purpose, redirectTo }
    );

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(codeChallenge, state, purpose);

    // Redirect to DigiLocker
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('DigiLocker init error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to log error if we have user context
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logError(
          user.id,
          'digilocker.init' as AuditAction,
          'digilocker',
          errorMessage,
          { error: errorMessage }
        );
      }
    } catch {
      // Ignore logging errors
    }

    // Redirect to error page with details
    const errorUrl = new URL('/age-verification', request.url);
    errorUrl.searchParams.set('error', 'init_failed');
    errorUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
    
    return NextResponse.redirect(errorUrl.toString());
  }
}
