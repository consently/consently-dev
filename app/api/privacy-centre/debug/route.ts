import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment configuration
 * Safe for production - doesn't expose sensitive data
 * 
 * DELETE THIS FILE after debugging is complete!
 */

export async function GET(request: NextRequest) {
  try {
    const checks = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend_api_key: !!process.env.RESEND_API_KEY,
      resend_from_email: !!process.env.RESEND_FROM_EMAIL,
      node_env: process.env.NODE_ENV,
    };

    // Only show prefixes in development
    const isDev = process.env.NODE_ENV === 'development';
    
    const detailedInfo = isDev ? {
      supabase_url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'missing',
      service_key_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'missing',
      resend_key_prefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'missing',
      resend_from: process.env.RESEND_FROM_EMAIL || 'not set',
    } : {
      note: 'Detailed info hidden in production for security'
    };

    const missingVars = [];
    if (!checks.supabase_url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!checks.supabase_anon_key) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!checks.supabase_service_role_key) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!checks.resend_api_key) missingVars.push('RESEND_API_KEY');

    const allConfigured = checks.supabase_url && 
                         checks.supabase_anon_key && 
                         checks.supabase_service_role_key && 
                         checks.resend_api_key;

    return NextResponse.json({
      status: allConfigured ? 'ok' : 'error',
      environment_checks: checks,
      missing_variables: missingVars,
      all_configured: allConfigured,
      message: allConfigured 
        ? '✅ All critical environment variables are set' 
        : `❌ Missing ${missingVars.length} required environment variable(s)`,
      detailed_info: detailedInfo,
      instructions: missingVars.length > 0 ? {
        step1: 'Go to your deployment platform (Vercel/etc)',
        step2: 'Navigate to Project Settings → Environment Variables',
        step3: `Add these missing variables: ${missingVars.join(', ')}`,
        step4: 'Get SUPABASE_SERVICE_ROLE_KEY from: Supabase Dashboard → Settings → API → service_role key',
        step5: 'Get RESEND_API_KEY from: https://resend.com/api-keys',
        step6: 'Redeploy your application after adding the variables'
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to check environment',
      details: process.env.NODE_ENV === 'development' ? error?.message : 'Internal error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

