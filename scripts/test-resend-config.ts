#!/usr/bin/env tsx

/**
 * Test Resend Configuration
 * This script checks if Resend is properly configured
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log('🔍 Checking Resend Configuration...\n');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

console.log('Environment Variables:');
console.log('  RESEND_API_KEY:', apiKey ? `✅ Set (${apiKey.substring(0, 10)}...)` : '❌ NOT SET');
console.log('  RESEND_FROM_EMAIL:', fromEmail ? `✅ ${fromEmail}` : '⚠️  Not set (will use default)');

if (!apiKey) {
  console.log('\n❌ ERROR: RESEND_API_KEY is not set!');
  console.log('\nTo fix:');
  console.log('1. Sign up at https://resend.com');
  console.log('2. Get your API key from the dashboard');
  console.log('3. Add to .env.local:');
  console.log('   RESEND_API_KEY=re_xxxxxxxxxxxxx');
  console.log('4. Restart your dev server');
  process.exit(1);
}

if (!apiKey.startsWith('re_')) {
  console.log('\n⚠️  WARNING: API key doesn\'t start with "re_" - this might be invalid');
}

console.log('\n✅ Resend configuration looks good!');
console.log('\nNext step: Test sending an email');
console.log('Run: npx tsx scripts/test-send-otp.ts');

