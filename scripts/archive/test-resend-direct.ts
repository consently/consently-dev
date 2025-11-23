#!/usr/bin/env tsx

/**
 * Direct Resend API Test
 * This tests the Resend API directly without our wrapper
 */

import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testResendDirect() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Consently <onboarding@resend.dev>';

  console.log('🔑 API Key:', apiKey ? '✅ Set' : '❌ Not set');
  console.log('📧 From Email:', fromEmail);
  console.log();

  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not set in .env.local');
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  console.log('📤 Attempting to send test email via Resend API...\n');

  try {
    const testEmail = process.argv[2] || 'delivered@resend.dev'; // Use Resend's test inbox
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: 'Test Email from Consently',
      html: '<h1>Test Email</h1><p>This is a test email from Consently.</p>',
    });

    if (error) {
      console.log('❌ Resend API Error:');
      console.log(JSON.stringify(error, null, 2));
      
      if (error.message?.includes('domain') || error.message?.includes('verify')) {
        console.log('\n💡 SOLUTION: Your domain needs to be verified!');
        console.log('\n📋 Steps to fix:');
        console.log('   1. Go to https://resend.com/domains');
        console.log('   2. Add and verify your domain: consently.in');
        console.log('   3. OR use the default test email:');
        console.log('      RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"');
        console.log('\n   Then restart your dev server.');
      }
      
      process.exit(1);
    }

    console.log('✅ SUCCESS! Email sent via Resend');
    console.log('📬 Email ID:', data?.id);
    console.log('\n✅ Your Resend configuration is working correctly!');
    console.log('✅ The OTP API should work now.');
  } catch (err: any) {
    console.log('❌ Unexpected Error:');
    console.error(err);
    process.exit(1);
  }
}

console.log('🚀 Testing Resend API directly...\n');
testResendDirect();

