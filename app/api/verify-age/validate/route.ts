import { NextRequest, NextResponse } from 'next/server';
import { verifyAgeVerificationToken } from '@/lib/age-verification-token';

/**
 * POST /api/verify-age/validate
 *
 * Optional server-side token validation endpoint.
 * Clients can call this to verify a stored JWT is still valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.token || !body.widgetId) {
      return NextResponse.json(
        { error: 'token and widgetId are required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const claims = await verifyAgeVerificationToken(body.token, body.widgetId);

    if (!claims) {
      return NextResponse.json(
        { valid: false, isAdult: false, expiresAt: null },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        isAdult: claims.isAdult,
        expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : null,
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[verify-age/validate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
