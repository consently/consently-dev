import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPreferencesLinkedEmail } from '@/lib/resend-email';
import crypto from 'crypto';

/**
 * API endpoint to verify OTP and link email to visitor preferences
 * 
 * POST /api/privacy-centre/verify-otp
 * 
 * NOTE: Uses service role client to bypass RLS - this is a public endpoint
 * that allows anonymous visitors to verify OTP and link preferences.
 */

interface VerifyOTPRequest {
  email: string;
  otpCode: string;
  visitorId: string;
  widgetId: string;
}

const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    console.log('[Verify OTP] Request received');

    // Check critical environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Verify OTP] CRITICAL: Supabase environment variables not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('[Verify OTP] Creating Supabase client...');
    let supabase;
    try {
      supabase = await createServiceClient();
      console.log('[Verify OTP] ✅ Supabase client created successfully');
    } catch (clientError: any) {
      console.error('[Verify OTP] ❌ FAILED to create Supabase client:', clientError);
      console.error('[Verify OTP] Error stack:', clientError.stack);
      return NextResponse.json(
        {
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? clientError.message : undefined
        },
        { status: 500 }
      );
    }

    let body: VerifyOTPRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Verify OTP] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, otpCode, visitorId, widgetId } = body;

    console.log('[Verify OTP] Request data:', {
      email: email ? email.substring(0, 3) + '***' : 'missing',
      otpCode: otpCode ? '******' : 'missing',
      visitorId: visitorId ? visitorId.substring(0, 10) + '...' : 'missing',
      widgetId: widgetId || 'missing'
    });

    // Validate input
    if (!email || !otpCode || !visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'email, otpCode, visitorId, and widgetId are required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Hash email for lookup
    console.log('[Verify OTP] Hashing email for lookup...');
    let emailHash;
    try {
      emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
      console.log('[Verify OTP] ✅ Email hash generated:', emailHash.substring(0, 16) + '...');
    } catch (hashError: any) {
      console.error('[Verify OTP] ❌ FAILED to hash email:', hashError);
      return NextResponse.json(
        { error: 'Failed to process email', details: hashError.message },
        { status: 500 }
      );
    }

    // Find the most recent unverified OTP for this email/visitor/widget
    console.log('[Verify OTP] Querying database for OTP record...');
    console.log('[Verify OTP] Query params:', {
      emailHash: emailHash.substring(0, 16) + '...',
      visitorId,
      widgetId,
    });

    let otpRecords, fetchError;
    try {
      const result = await supabase
        .from('email_verification_otps')
        .select('*')
        .eq('email_hash', emailHash)
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      otpRecords = result.data;
      fetchError = result.error;

      console.log('[Verify OTP] ✅ Database query completed');
      console.log('[Verify OTP] Records found:', otpRecords?.length || 0);
    } catch (queryError: any) {
      console.error('[Verify OTP] ❌ EXCEPTION during database query:', queryError);
      console.error('[Verify OTP] Error stack:', queryError.stack);
      return NextResponse.json(
        { error: 'Database query failed', details: queryError.message },
        { status: 500 }
      );
    }

    if (fetchError) {
      console.error('[Verify OTP] ❌ Database query returned error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify OTP', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid or expired OTP. Please request a new one.',
          code: 'OTP_NOT_FOUND'
        },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error: 'Maximum verification attempts exceeded. Please request a new OTP.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        },
        { status: 400 }
      );
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otpCode) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await supabase
        .from('email_verification_otps')
        .update({
          attempts: newAttempts,
          updated_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - newAttempts;

      // Track failed attempt
      const { error: eventError } = await supabase.from('email_verification_events').insert({
        widget_id: widgetId,
        visitor_id: visitorId,
        event_type: 'otp_failed',
        email_hash: emailHash,
        metadata: {
          otp_id: otpRecord.id,
          attempt_number: newAttempts,
          remaining_attempts: Math.max(0, remainingAttempts),
          reason: 'Invalid OTP code'
        },
      });

      if (eventError) {
        console.error('[Verify OTP] Failed to track event:', eventError);
      }

      return NextResponse.json(
        {
          error: 'Invalid OTP code.',
          code: 'INVALID_OTP',
          remainingAttempts: Math.max(0, remainingAttempts),
          maxAttemptsExceeded: remainingAttempts <= 0
        },
        { status: 400 }
      );
    }

    // OTP is valid! Mark as verified
    const { error: updateError } = await supabase
      .from('email_verification_otps')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', otpRecord.id);

    // Track verification event
    const { error: verifyEventError } = await supabase.from('email_verification_events').insert({
      widget_id: widgetId,
      visitor_id: visitorId,
      event_type: 'otp_verified',
      email_hash: emailHash,
      metadata: {
        otp_id: otpRecord.id,
        attempts: otpRecord.attempts + 1,
        time_to_verify_seconds: Math.round((Date.now() - new Date(otpRecord.created_at).getTime()) / 1000)
      },
    });

    if (verifyEventError) {
      console.error('[Verify OTP] Failed to track event:', verifyEventError);
    }

    if (updateError) {
      console.error('Error marking OTP as verified:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify OTP', details: updateError.message },
        { status: 500 }
      );
    }

    // Update visitor preferences to link with this email
    const { data: existingPreferences, error: prefsError } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
    }

    // Update all preferences for this visitor with the email hash
    if (existingPreferences && existingPreferences.length > 0) {
      console.log('[Verify OTP] Updating preferences with email hash. Count:', existingPreferences.length);
      const { error: linkError, data: updatedData } = await supabase
        .from('visitor_consent_preferences')
        .update({
          visitor_email_hash: emailHash,
          last_updated: new Date().toISOString()
        })
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId)
        .select();

      if (linkError) {
        console.error('[Verify OTP] ❌ Error linking preferences:', linkError);
        console.error('[Verify OTP] Error details:', JSON.stringify(linkError, null, 2));
        return NextResponse.json(
          { error: 'Failed to link preferences to email', details: linkError.message, code: linkError.code },
          { status: 500 }
        );
      }
      
      console.log('[Verify OTP] ✅ Successfully linked preferences. Updated rows:', updatedData?.length || 0);
    } else {
      console.log('[Verify OTP] No existing preferences found to link');
    }

    // Count devices (unique visitor IDs) with this email hash
    let uniqueDevices = 1;
    try {
      const { data: linkedDevices, error: deviceCountError } = await supabase
        .from('visitor_consent_preferences')
        .select('visitor_id')
        .eq('visitor_email_hash', emailHash)
        .eq('widget_id', widgetId);

      if (deviceCountError) {
        console.warn('Error counting linked devices (non-critical):', deviceCountError);
      } else if (linkedDevices) {
        uniqueDevices = new Set(linkedDevices.map(d => d.visitor_id)).size;
      }
    } catch (countError: any) {
      console.warn('Failed to count linked devices (non-critical):', countError?.message || countError);
    }

    // Send confirmation email (non-blocking - don't fail if this fails)
    try {
      await sendPreferencesLinkedEmail(email, uniqueDevices);
      console.log(`✅ Confirmation email sent to ${email}`);
    } catch (emailError: any) {
      console.error('Failed to send confirmation email (non-critical):', emailError?.message || emailError);
      // Don't fail the verification if email sending fails
    }

    console.log(`✅ Email verified and linked for visitor ${visitorId}`);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      linkedDevices: uniqueDevices,
      verified_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in verify-otp endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

