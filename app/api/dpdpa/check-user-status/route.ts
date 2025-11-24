import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

/**
 * API Endpoint: /api/dpdpa/check-user-status
 * 
 * Checks if a user (identified by email hash) has already given consent
 * or is a verified user.
 * 
 * Used by the widget to provide a "Welcome Back" experience.
 */

const requestSchema = z.object({
  emailHash: z.string().length(64), // SHA-256 hex string
  widgetId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const rateLimitResult = checkRateLimit({
      max: 60, // 60 checks per minute per IP
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': (rateLimitResult.retryAfter || 60).toString() } }
      );
    }

    // 2. Parse and Validate Request
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }

    const { emailHash, widgetId } = validation.data;

    // 3. Check User Status
    // We use a public client here because this is a public widget API
    // However, we only return non-sensitive status info
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check for existing consent record with this email hash
    const { data: existingConsent, error } = await supabase
      .from('dpdpa_consent_records')
      .select('id, consent_status, visitor_email')
      .eq('widget_id', widgetId)
      .eq('visitor_email_hash', emailHash)
      .order('consent_given_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('[Check User Status] Database error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (existingConsent) {
      // User found!
      return NextResponse.json({
        status: 'verified',
        consentId: existingConsent.id,
        // We don't return the email itself, just the masked version if needed, 
        // but for now just the status is enough.
        hasConsent: true
      });
    }

    // Also check visitor_consent_preferences if not found in records
    // This handles cases where they might have preferences but no specific consent record for this session yet
    const { data: existingPref, error: prefError } = await supabase
        .from('visitor_consent_preferences')
        .select('visitor_id')
        .eq('widget_id', widgetId)
        .eq('visitor_email_hash', emailHash)
        .single();
    
    if (existingPref) {
         return NextResponse.json({
            status: 'verified',
            hasConsent: true
          });
    }

    // User not found
    return NextResponse.json({
      status: 'new',
      hasConsent: false
    });

  } catch (error) {
    console.error('[Check User Status] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
