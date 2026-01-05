import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

/**
 * Email-Based Consent Lookup & Revocation API
 * 
 * Allows users to:
 * 1. Find all consent records associated with their email (GET)
 * 2. Revoke all consents for their email (POST with action: 'revoke')
 * 
 * This is the legally compliant way to enable cross-device consent management
 * while preserving privacy (emails are hashed, never stored in plain text)
 */

// Helper to hash email for privacy
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * GET /api/dpdpa/consent-by-email?email=user@example.com&widgetId=xxx
 * 
 * Lookup all consent records for a given email
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (prevent email enumeration attacks)
    const rateLimitResult = await checkRateLimit({
      max: 10, // 10 lookups per hour
      window: 3600000, // 1 hour
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const widgetId = searchParams.get('widgetId');

    if (!email || !widgetId) {
      return NextResponse.json(
        { error: 'email and widgetId are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);

    // Create public supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Look up consent records by email hash and widget
    const { data: consentRecords, error: fetchError } = await supabase
      .from('dpdpa_consent_records')
      .select('id, visitor_id, consent_id, consent_status, consented_activities, rejected_activities, consent_given_at, consent_expires_at, revoked_at')
      .eq('visitor_email_hash', emailHash)
      .eq('widget_id', widgetId)
      .order('consent_given_at', { ascending: false });

    if (fetchError) {
      console.error('[Email Consent Lookup] Error fetching records:', fetchError);
      return NextResponse.json(
        { error: 'Failed to lookup consent records' },
        { status: 500 }
      );
    }

    // Return results (empty array if no records found)
    return NextResponse.json({
      success: true,
      data: {
        records: consentRecords || [],
        totalRecords: consentRecords?.length || 0,
        emailHash: emailHash, // Return for verification purposes
      },
    });
  } catch (error) {
    console.error('[Email Consent Lookup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dpdpa/consent-by-email
 * 
 * Actions:
 * - action: 'revoke' - Revoke all consents for an email
 * 
 * Body: { email: string, widgetId: string, action: 'revoke', reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Apply stricter rate limiting for revocation (irreversible action)
    const rateLimitResult = await checkRateLimit({
      max: 5, // 5 revocations per hour
      window: 3600000, // 1 hour
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { email, widgetId, action, reason } = body;

    if (!email || !widgetId || !action) {
      return NextResponse.json(
        { error: 'email, widgetId, and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'revoke') {
      return NextResponse.json(
        { error: 'Only "revoke" action is supported' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);

    // Create public supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role for updates
    );

    // Revoke all consent records for this email + widget
    const { data: updatedRecords, error: updateError } = await supabase
      .from('dpdpa_consent_records')
      .update({
        consent_status: 'revoked',
        revoked_at: new Date().toISOString(),
        revocation_reason: reason || 'User revoked consent via email',
        updated_at: new Date().toISOString(),
      })
      .eq('visitor_email_hash', emailHash)
      .eq('widget_id', widgetId)
      .neq('consent_status', 'revoked') // Don't update already revoked
      .select('id, visitor_id, consent_id');

    if (updateError) {
      console.error('[Email Consent Revocation] Error updating records:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke consent records' },
        { status: 500 }
      );
    }

    // Also update visitor_consent_preferences to withdrawn
    const { error: preferencesError } = await supabase
      .from('visitor_consent_preferences')
      .update({
        consent_status: 'withdrawn',
        last_updated: new Date().toISOString(),
      })
      .eq('visitor_email_hash', emailHash)
      .eq('widget_id', widgetId)
      .neq('consent_status', 'withdrawn'); // Don't update already withdrawn

    if (preferencesError) {
      console.error('[Email Consent Revocation] Error updating preferences:', preferencesError);
      // Continue even if preferences update fails
    }

    return NextResponse.json({
      success: true,
      data: {
        revokedCount: updatedRecords?.length || 0,
        revokedRecords: updatedRecords || [],
        message: `Successfully revoked ${updatedRecords?.length || 0} consent record(s)`,
      },
    });
  } catch (error) {
    console.error('[Email Consent Revocation] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

