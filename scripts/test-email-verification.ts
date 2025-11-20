#!/usr/bin/env node
/**
 * Test Email Verification Flow
 * 
 * This script tests the entire email verification flow:
 * 1. Check environment variables
 * 2. Test database connection
 * 3. Send OTP email
 * 4. Verify OTP
 */

// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Now import other modules (they will see the loaded env vars)
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Dynamic import for resend-email to ensure env vars are loaded
let sendOTPEmail: any;
let generateOTP: any;

async function loadResendModule() {
  const resendModule = await import('../lib/resend-email');
  sendOTPEmail = resendModule.sendOTPEmail;
  generateOTP = resendModule.generateOTP;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function checkEnvironmentVariables() {
  log('\n=== Step 1: Checking Environment Variables ===', colors.cyan);
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'RESEND_API_KEY',
  ];
  
  const optional = ['RESEND_FROM_EMAIL'];
  
  let allPresent = true;
  
  for (const varName of required) {
    if (process.env[varName]) {
      success(`${varName} is set`);
    } else {
      error(`${varName} is missing`);
      allPresent = false;
    }
  }
  
  for (const varName of optional) {
    if (process.env[varName]) {
      success(`${varName} is set: ${process.env[varName]}`);
    } else {
      warning(`${varName} is not set (will use default)`);
    }
  }
  
  if (!allPresent) {
    error('\nMissing required environment variables!');
    info('Please create a .env.local file with:');
    console.log(`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"
    `);
    process.exit(1);
  }
  
  return true;
}

async function checkDatabaseConnection() {
  log('\n=== Step 2: Checking Database Connection ===', colors.cyan);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check if email_verification_otps table exists
    const { data, error: tableError } = await supabase
      .from('email_verification_otps')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') {
        error('Table email_verification_otps does not exist!');
        info('Please run the migration:');
        console.log('  supabase db push');
        console.log('  or manually run: supabase/migrations/20250119000001_create_email_verification_otp.sql');
        return false;
      }
      throw tableError;
    }
    
    success('Database connection successful');
    success('Table email_verification_otps exists');
    return true;
  } catch (err) {
    error(`Database error: ${err}`);
    return false;
  }
}

async function checkWidgetExists(supabase: any) {
  log('\n=== Step 3: Finding a Widget ===', colors.cyan);
  
  const { data: widgets, error } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, name, domain')
    .limit(5);
  
  if (error) {
    error(`Failed to fetch widgets: ${error.message}`);
    return null;
  }
  
  if (!widgets || widgets.length === 0) {
    error('No widgets found in database!');
    info('Please create a widget first through the dashboard');
    return null;
  }
  
  success(`Found ${widgets.length} widget(s)`);
  const widget = widgets[0];
  info(`Using widget: ${widget.widget_id} (${widget.name || widget.domain})`);
  
  return widget;
}

async function testSendOTP(email: string, visitorId: string, widgetId: string) {
  log('\n=== Step 4: Testing Send OTP ===', colors.cyan);
  
  // Ensure resend module is loaded
  if (!generateOTP || !sendOTPEmail) {
    await loadResendModule();
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Generate OTP
    const otpCode = generateOTP();
    info(`Generated OTP: ${otpCode}`);
    
    // Hash email
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    
    // Store in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
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
      error(`Failed to store OTP: ${insertError.message}`);
      return null;
    }
    
    success('OTP stored in database');
    
    // Send email
    info('Sending OTP email...');
    const emailResult = await sendOTPEmail(email, otpCode, 10);
    
    if (!emailResult.success) {
      error(`Failed to send email: ${emailResult.error}`);
      return null;
    }
    
    success(`Email sent successfully to ${email}`);
    info(`Email ID: ${emailResult.id}`);
    
    return { otpCode, otpRecord };
  } catch (err) {
    error(`Error in testSendOTP: ${err}`);
    return null;
  }
}

async function testVerifyOTP(email: string, otpCode: string, visitorId: string, widgetId: string) {
  log('\n=== Step 5: Testing Verify OTP ===', colors.cyan);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    
    // Find OTP record
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
      error(`Failed to fetch OTP: ${fetchError.message}`);
      return false;
    }
    
    if (!otpRecords || otpRecords.length === 0) {
      error('OTP not found or expired');
      return false;
    }
    
    const otpRecord = otpRecords[0];
    info(`Found OTP record: ${otpRecord.id}`);
    
    // Verify code
    if (otpRecord.otp_code !== otpCode) {
      error('OTP code mismatch!');
      return false;
    }
    
    success('OTP code is valid');
    
    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verification_otps')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', otpRecord.id);
    
    if (updateError) {
      error(`Failed to mark OTP as verified: ${updateError.message}`);
      return false;
    }
    
    success('OTP marked as verified');
    
    // Update visitor preferences
    const { data: existingPreferences } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);
    
    if (existingPreferences && existingPreferences.length > 0) {
      const { error: linkError } = await supabase
        .from('visitor_consent_preferences')
        .update({
          visitor_email_hash: emailHash,
          updated_at: new Date().toISOString(),
        })
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId);
      
      if (linkError) {
        error(`Failed to link preferences: ${linkError.message}`);
        return false;
      }
      
      success(`Linked ${existingPreferences.length} preference(s) to email`);
    } else {
      warning('No existing preferences found for this visitor');
    }
    
    return true;
  } catch (err) {
    error(`Error in testVerifyOTP: ${err}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════╗', colors.cyan);
  log('║  Email Verification Flow Test                 ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com';
  const visitorId = `test-${Date.now()}`;
  
  info(`Test Email: ${testEmail}`);
  info(`Visitor ID: ${visitorId}`);
  
  // Step 1: Check environment variables
  const envOk = await checkEnvironmentVariables();
  if (!envOk) return;
  
  // Step 2: Check database connection
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) return;
  
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 3: Find a widget
  const widget = await checkWidgetExists(supabase);
  if (!widget) return;
  
  // Step 4: Test send OTP
  const otpResult = await testSendOTP(testEmail, visitorId, widget.widget_id);
  if (!otpResult) {
    error('\nOTP sending failed!');
    return;
  }
  
  // Step 5: Test verify OTP
  const verifyOk = await testVerifyOTP(testEmail, otpResult.otpCode, visitorId, widget.widget_id);
  
  if (verifyOk) {
    log('\n' + '='.repeat(50), colors.cyan);
    success('All tests passed! Email verification is working correctly.');
    log('='.repeat(50) + '\n', colors.cyan);
    
    info('Next steps:');
    console.log('1. Check your email inbox for the OTP email');
    console.log('2. Test the full flow in the browser');
    console.log('3. Navigate to: /privacy-centre/' + widget.widget_id + '?visitorId=' + visitorId);
  } else {
    log('\n' + '='.repeat(50), colors.red);
    error('Some tests failed. Please check the errors above.');
    log('='.repeat(50) + '\n', colors.red);
  }
}

// Run the tests
main().catch((err) => {
  error(`Unhandled error: ${err}`);
  process.exit(1);
});

