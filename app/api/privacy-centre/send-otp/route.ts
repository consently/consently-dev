import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendOTPEmail, generateOTP, checkResendConfig } from '@/lib/resend-email';
import crypto from 'crypto';

/**
 * API endpoint to send OTP for email verification
 * Used for linking preferences across devices
 * 
 * POST /api/privacy-centre/send-otp
 * 
 * NOTE: Uses service role client to bypass RLS - this is a public endpoint
 * that allows anonymous visitors to request OTP verification.
 */

interface SendOTPRequest {
  email: string;
  visitorId: string;
  widgetId: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Send OTP] Request received');

    // Check critical environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Send OTP] CRITICAL: NEXT_PUBLIC_SUPABASE_URL not set');
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: process.env.NODE_ENV === 'development' ? 'NEXT_PUBLIC_SUPABASE_URL not configured' : 'Database not configured'
        },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Send OTP] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set in environment');
      console.error('[Send OTP] This is required for the service client to work');
      console.error('[Send OTP] Please add SUPABASE_SERVICE_ROLE_KEY to your deployment environment variables');
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: process.env.NODE_ENV === 'development'
            ? 'SUPABASE_SERVICE_ROLE_KEY not configured. Add it to .env.local'
            : 'Database service key not configured. Contact support.'
        },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Send OTP] CRITICAL: RESEND_API_KEY not set');
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: process.env.NODE_ENV === 'development' ? 'RESEND_API_KEY not configured' : 'Email service not configured'
        },
        { status: 500 }
      );
    }

    const supabase = await createServiceClient();

    let body: SendOTPRequest;
    try {
      body = await request.json();
      console.log('[Send OTP] Request body parsed:', {
        email: body.email ? body.email.substring(0, 3) + '***' : 'missing',
        visitorId: body.visitorId ? body.visitorId.substring(0, 10) + '...' : 'missing',
        widgetId: body.widgetId || 'missing'
      });
    } catch (parseError: any) {
      console.error('[Send OTP] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: process.env.NODE_ENV === 'development' ? parseError?.message : undefined },
        { status: 400 }
      );
    }

    const { email, visitorId, widgetId } = body;

    // Validate input
    if (!email || !visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'email, visitorId, and widgetId are required' },
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

    // Verify widget exists and get OTP expiration config
    // Use a more flexible query that handles missing columns gracefully
    const { data: widget, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, domain, name')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError || !widget) {
      console.error('[Send OTP] Widget lookup error:', widgetError);
      return NextResponse.json(
        { error: 'Widget not found', details: process.env.NODE_ENV === 'development' ? widgetError?.message : undefined },
        { status: 404 }
      );
    }

    // Try to get OTP expiration from widget config (default 10 minutes if not set or column doesn't exist)
    let otpExpirationMinutes = 10;
    try {
      const { data: widgetConfig, error: configError } = await supabase
        .from('dpdpa_widget_configs')
        .select('otp_expiration_minutes')
        .eq('widget_id', widgetId)
        .single();

      // Only use the value if we got it successfully and it's a valid number
      if (!configError && widgetConfig?.otp_expiration_minutes && typeof widgetConfig.otp_expiration_minutes === 'number') {
        otpExpirationMinutes = widgetConfig.otp_expiration_minutes;
      }
    } catch (err: any) {
      // Column might not exist or query failed - use default
      // This is non-critical, so we just log and continue
      if (err?.message && !err.message.includes('column') && !err.message.includes('does not exist')) {
        console.warn('[Send OTP] Could not fetch otp_expiration_minutes, using default 10 minutes:', err?.message);
      }
    }

    // Check rate limiting - max 3 OTP requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

    const { data: recentOTPs, error: countError } = await supabase
      .from('email_verification_otps')
      .select('id')
      .eq('email_hash', emailHash)
      .eq('widget_id', widgetId)
      .gte('created_at', oneHourAgo.toISOString());

    if (countError) {
      console.error('[Send OTP] Error checking rate limit:', JSON.stringify(countError, null, 2));
      console.error('[Send OTP] Rate limit check details:', {
        emailHash: emailHash.substring(0, 10) + '...',
        widgetId,
        errorCode: countError.code,
        errorMessage: countError.message,
        errorDetails: countError.details,
        errorHint: countError.hint
      });

      // Check if table doesn't exist (common production issue)
      if (countError.message?.includes('relation') && countError.message?.includes('does not exist')) {
        console.error('[Send OTP] CRITICAL: email_verification_otps table does not exist!');
        return NextResponse.json(
          {
            error: 'Database configuration error. The email verification table is missing.',
            details: process.env.NODE_ENV === 'development' ? {
              message: countError.message,
              hint: 'Run migration: 20250119000001_create_email_verification_otp.sql'
            } : undefined
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to verify rate limit',
          details: process.env.NODE_ENV === 'development' ? countError.message : undefined
        },
        { status: 500 }
      );
    }

    if (recentOTPs && recentOTPs.length >= 3) {
      // Track rate limit event (non-blocking)
      try {
        await supabase.from('email_verification_events').insert({
          widget_id: widgetId,
          visitor_id: visitorId,
          event_type: 'rate_limited',
          email_hash: emailHash,
          metadata: { reason: 'Max OTP requests per hour exceeded' },
        });
      } catch (eventError: any) {
        console.warn('[Send OTP] Failed to track rate limit event (non-critical):', eventError?.message || eventError);
      }

      return NextResponse.json(
        {
          error: 'Too many OTP requests. Please try again later.',
          retryAfter: 3600 // seconds
        },
        { status: 429 }
      );
    }

    // Generate OTP (6 digits)
    const otpCode = generateOTP();

    // Set expiration using widget config
    const expiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

    console.log('[Send OTP] Attempting to insert OTP:', {
      email: email.substring(0, 3) + '***',
      emailHash: emailHash.substring(0, 10) + '...',
      widgetId,
      visitorId: visitorId.substring(0, 10) + '...',
      expiresAt: expiresAt.toISOString()
    });

    // Store OTP in database
    const { data: otpRecord, error: insertError } = await supabase
      .from('email_verification_otps')
      .insert({
        email,
        email_hash: emailHash,
        otp_code: otpCode,
        visitor_id: visitorId,
        widget_id: widgetId,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Send OTP] Error storing OTP:', JSON.stringify(insertError, null, 2));
      console.error('[Send OTP] OTP insert failure details:', {
        email: email.substring(0, 3) + '***',
        visitorId,
        widgetId,
        emailHash: emailHash.substring(0, 10) + '...',
        errorCode: insertError.code,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        errorHint: insertError.hint,
        fullError: JSON.stringify(insertError, null, 2),
      });

      // Check for common production issues
      if (insertError.message?.includes('relation') && insertError.message?.includes('does not exist')) {
        console.error('[Send OTP] CRITICAL: email_verification_otps table does not exist in production!');
        return NextResponse.json(
          {
            error: 'Database configuration error. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? {
              message: insertError.message,
              hint: 'Run migration: 20250119000001_create_email_verification_otp.sql'
            } : undefined
          },
          { status: 500 }
        );
      }

      if (insertError.code === '42501' || insertError.message?.includes('permission denied') || insertError.message?.includes('row-level security')) {
        console.error('[Send OTP] CRITICAL: RLS policy blocking insert!');
        return NextResponse.json(
          {
            error: 'Database permission error. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? {
              message: insertError.message,
              code: insertError.code,
              hint: 'RLS policies may not be configured correctly'
            } : undefined
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate OTP',
          details: process.env.NODE_ENV === 'development' ? {
            message: insertError.message,
            code: insertError.code,
            hint: insertError.hint,
            details: insertError.details
          } : undefined
        },
        { status: 500 }
      );
    }

    console.log('[Send OTP] OTP stored successfully:', { otpRecordId: otpRecord.id });

    // Send OTP email with dynamic expiration
    const emailResult = await sendOTPEmail(email, otpCode, otpExpirationMinutes);

    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);

      // Run diagnostics to help debug the issue
      const config = checkResendConfig();
      console.error('📋 Resend Configuration Check:', {
        apiKeyConfigured: config.apiKeyConfigured,
        apiKeyFormatValid: config.apiKeyFormatValid,
        fromEmailConfigured: config.fromEmailConfigured,
        clientInitialized: config.clientInitialized,
        fromEmail: config.fromEmail,
        apiKeyPrefix: config.apiKeyPrefix,
      });

      console.error('Email send failure details:', {
        email: email.substring(0, 3) + '***', // Partial email for logging
        otpRecordId: otpRecord.id,
        error: emailResult.error,
      });

      // Delete the OTP record since we couldn't send the email
      const { error: deleteError } = await supabase
        .from('email_verification_otps')
        .delete()
        .eq('id', otpRecord.id);

      if (deleteError) {
        console.error('Failed to delete OTP record after email failure:', deleteError);
      }

      // Check if it's a configuration issue
      if (emailResult.error?.includes('not configured') ||
        emailResult.error?.includes('RESEND_API_KEY') ||
        !config.apiKeyConfigured ||
        !config.clientInitialized) {
        return NextResponse.json(
          {
            error: 'Email service is not properly configured. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? {
              configCheck: config,
              error: emailResult.error
            } : undefined
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to send OTP email. Please try again.',
          details: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
        },
        { status: 500 }
      );
    }

    console.log(`✅ OTP sent to ${email.substring(0, 3)}*** for visitor ${visitorId}`);

    // Track OTP sent event (non-blocking - don't fail if this fails)
    try {
      await supabase.from('email_verification_events').insert({
        widget_id: widgetId,
        visitor_id: visitorId,
        event_type: 'otp_sent',
        email_hash: emailHash,
        metadata: {
          otp_id: otpRecord.id,
          expiration_minutes: otpExpirationMinutes
        },
      });
    } catch (eventError: any) {
      // Log but don't fail - event tracking is non-critical
      console.warn('[Send OTP] Failed to track event (non-critical):', eventError?.message || eventError);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: otpExpirationMinutes * 60,
      expiresInMinutes: otpExpirationMinutes,
    });

  } catch (error: any) {
    console.error('[Send OTP] Unhandled error in send-otp endpoint:', error);
    console.error('[Send OTP] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    });

    // Check for common production issues
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';

    // Database/table doesn't exist
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      console.error('[Send OTP] CRITICAL: Table does not exist in production database!');
      return NextResponse.json(
        {
          error: 'Database configuration error. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            hint: 'The email_verification_otps table may not exist. Run migrations.'
          } : undefined
        },
        { status: 500 }
      );
    }

    // RLS policy issue
    if (errorCode.includes('42501') || errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
      console.error('[Send OTP] CRITICAL: RLS policy blocking insert!');
      return NextResponse.json(
        {
          error: 'Database permission error. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            code: error?.code,
            hint: 'RLS policies may not be configured correctly'
          } : undefined
        },
        { status: 500 }
      );
    }

    // Resend configuration issue
    if (errorMessage.includes('resend') || errorMessage.includes('api key') || !process.env.RESEND_API_KEY) {
      console.error('[Send OTP] CRITICAL: Resend API key not configured!');
      return NextResponse.json(
        {
          error: 'Email service configuration error. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            resendConfigured: !!process.env.RESEND_API_KEY
          } : undefined
        },
        { status: 500 }
      );
    }

    // Database connection issue
    if (errorMessage.includes('database') || errorMessage.includes('supabase') || errorCode.includes('PGRST') || errorCode.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: 'Database connection error. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            code: error?.code,
            hint: error?.hint
          } : undefined
        },
        { status: 500 }
      );
    }

    // Generic error with better logging
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          name: error?.name,
          code: error?.code,
          stack: error?.stack?.split('\n').slice(0, 5).join('\n')
        } : 'An unexpected error occurred. Please try again or contact support.'
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

