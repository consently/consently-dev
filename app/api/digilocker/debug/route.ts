/**
 * DigiLocker Debug Endpoint
 * 
 * GET /api/digilocker/debug
 * 
 * Returns diagnostic information about the DigiLocker configuration
 * to help troubleshoot integration issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDigiLockerConfig, generatePKCEAsync } from '@/lib/digilocker';
import { redis } from '@/lib/redis';
import { features } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  // 1. Check environment configuration
  try {
    const config = getDigiLockerConfig();
    diagnostics.configuration = {
      env: config.env,
      clientId: config.clientId ? `${config.clientId.substring(0, 8)}...` : 'MISSING',
      clientIdLength: config.clientId?.length,
      clientSecret: config.clientSecret ? '***present***' : 'MISSING',
      redirectUri: config.redirectUri,
      issuerId: config.issuerId,
      scope: config.scope,
      acr: config.acr,
    };
  } catch (error) {
    diagnostics.configuration = {
      error: error instanceof Error ? error.message : 'Unknown error',
      fix: 'Set DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI in environment',
    };
  }

  // 2. Check Redis connection
  diagnostics.redis = {
    available: !!redis,
    status: redis ? 'connected' : 'not available',
  };

  // 3. Check feature flag
  diagnostics.featureFlag = {
    digilockerEnabled: features.digilocker,
  };

  // 4. Test PKCE generation
  try {
    const pkce = await generatePKCEAsync();
    diagnostics.pkce = {
      codeVerifierLength: pkce.codeVerifier.length,
      codeChallengeLength: pkce.codeChallenge.length,
      sampleVerifier: `${pkce.codeVerifier.substring(0, 10)}...`,
    };
  } catch (error) {
    diagnostics.pkce = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // 5. Parse current URL to check for common issues
  const url = new URL(request.url);
  diagnostics.request = {
    fullUrl: url.toString(),
    origin: url.origin,
    host: url.host,
    protocol: url.protocol,
  };

  // 6. Check redirect URI consistency
  const configuredRedirect = process.env.DIGILOCKER_REDIRECT_URI;
  const expectedRedirect = `${url.origin}/api/auth/digilocker/callback`;
  diagnostics.redirectUriCheck = {
    configured: configuredRedirect,
    expectedFromRequest: expectedRedirect,
    matches: configuredRedirect === expectedRedirect,
    note: configuredRedirect !== expectedRedirect 
      ? 'WARNING: Configured redirect URI does not match current origin. This will cause OAuth failures.'
      : 'OK: Redirect URI matches current origin',
  };

  // 7. Common issues checklist
  diagnostics.commonIssues = {
    missingClientId: !process.env.DIGILOCKER_CLIENT_ID,
    missingClientSecret: !process.env.DIGILOCKER_CLIENT_SECRET,
    missingRedirectUri: !process.env.DIGILOCKER_REDIRECT_URI,
    redirectUriMismatch: configuredRedirect !== expectedRedirect && !configuredRedirect?.includes('localhost'),
    redisNotConfigured: !redis,
  };

  // 8. Return full diagnostics
  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
