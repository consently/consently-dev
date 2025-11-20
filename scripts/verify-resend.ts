/**
 * Quick verification script for Resend email configuration
 * Run with: npx tsx scripts/verify-resend.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

function verify() {
  console.log('🔍 Verifying Resend Configuration...\n');
  
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  
  console.log('Environment Variables:');
  console.log('  RESEND_API_KEY:', apiKey ? `✅ Set (${apiKey.substring(0, 15)}...)` : '❌ NOT SET');
  console.log('  RESEND_FROM_EMAIL:', fromEmail ? `✅ ${fromEmail}` : '❌ NOT SET');
  console.log('');
  
  if (!apiKey) {
    console.log('❌ ERROR: RESEND_API_KEY is not set!');
    console.log('\nPlease add it to your .env.local file:');
    console.log('   RESEND_API_KEY=re_xxxxxxxxxxxxx');
    process.exit(1);
  }
  
  if (!apiKey.startsWith('re_')) {
    console.log('⚠️  WARNING: RESEND_API_KEY should start with "re_"');
    console.log('   Current value appears invalid');
  }
  
  if (!fromEmail) {
    console.log('⚠️  WARNING: RESEND_FROM_EMAIL is not set');
    console.log('   Will use default: onboarding@resend.dev');
  }
  
  console.log('✅ Configuration looks good!');
  console.log('\n💡 If you\'re still getting errors:');
  console.log('   1. Restart your Next.js dev server');
  console.log('   2. Clear your browser cache');
  console.log('   3. Try the test in a new incognito window');
}

verify();

