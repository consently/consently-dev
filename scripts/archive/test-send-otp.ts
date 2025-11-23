#!/usr/bin/env tsx

/**
 * Test OTP Email Sending
 * This script tests if OTP emails can be sent successfully
 */

import dotenv from 'dotenv';
import path from 'path';
import { sendOTPEmail } from '../lib/resend-email';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testOTPEmail() {
  console.log('🧪 Testing OTP Email Sending...\n');

  const testEmail = process.argv[2] || 'test@example.com';
  const testOTP = '123456';

  console.log(`📧 Sending OTP to: ${testEmail}`);
  console.log(`🔢 OTP Code: ${testOTP}\n`);

  try {
    const result = await sendOTPEmail(testEmail, testOTP, 10);

    if (result.success) {
      console.log('✅ SUCCESS! OTP email sent successfully');
      console.log(`📬 Email ID: ${result.id}`);
      console.log('\nCheck your inbox (and spam folder) for the email.');
      process.exit(0);
    } else {
      console.log('❌ FAILED to send OTP email');
      console.log(`Error: ${result.error}`);
      
      if (result.error?.includes('API key')) {
        console.log('\n💡 Tip: Check your RESEND_API_KEY in .env.local');
      }
      
      process.exit(1);
    }
  } catch (error: any) {
    console.log('❌ ERROR occurred while sending email:');
    console.error(error);
    process.exit(1);
  }
}

console.log('🚀 Starting OTP Email Test...\n');
testOTPEmail();

