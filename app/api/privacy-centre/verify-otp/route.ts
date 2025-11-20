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
    
    const supabase = await createServiceClient();
    const body: VerifyOTPRequest = await request.json();

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
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

    // Find the most recent unverified OTP for this email/visitor/widget
    const { data: otpRecords, error: fetchError } = await supabase
      .from('email_verification_otps')
      .select('*')
      .eq('email_hash', emailHash)
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching OTP:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
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
      await supabase.from('email_verification_events').insert({
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
      }).catch(err => console.error('[Verify OTP] Failed to track event:', err));
      
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
    await supabase.from('email_verification_events').insert({
      widget_id: widgetId,
      visitor_id: visitorId,
      event_type: 'otp_verified',
      email_hash: emailHash,
      metadata: { 
        otp_id: otpRecord.id,
        attempts: otpRecord.attempts + 1,
        time_to_verify_seconds: Math.round((Date.now() - new Date(otpRecord.created_at).getTime()) / 1000)
      },
    }).catch(err => console.error('[Verify OTP] Failed to track event:', err));

    if (updateError) {
      console.error('Error marking OTP as verified:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
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
      const { error: linkError } = await supabase
        .from('visitor_consent_preferences')
        .update({ 
          visitor_email_hash: emailHash,
          updated_at: new Date().toISOString()
        })
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId);

      if (linkError) {
        console.error('Error linking preferences:', linkError);
        return NextResponse.json(
          { error: 'Failed to link preferences to email' },
          { status: 500 }
        );
      }
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

  } catch (error) {
    console.error('Error in verify-otp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

