#!/usr/bin/env tsx

/**
 * Cleanup Test OTP Records
 * Use this during development to reset rate limits for testing
 * DO NOT use this in production!
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function cleanupOTPs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase credentials');
    console.log('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧹 Cleaning up OTP records...\n');

  // Option 1: Clean all expired OTPs
  const { data: expired, error: expiredError } = await supabase
    .from('email_verification_otps')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select();

  if (expiredError) {
    console.log('⚠️  Error cleaning expired OTPs:', expiredError.message);
  } else {
    console.log(`✅ Deleted ${expired?.length || 0} expired OTP records`);
  }

  // Option 2: If you want to clean ALL OTPs for a specific email (for testing)
  const emailToClean = process.argv[2];
  
  if (emailToClean) {
    const emailHash = crypto.createHash('sha256')
      .update(emailToClean.toLowerCase().trim())
      .digest('hex');

    const { data: userOTPs, error: userError } = await supabase
      .from('email_verification_otps')
      .delete()
      .eq('email_hash', emailHash)
      .select();

    if (userError) {
      console.log(`⚠️  Error cleaning OTPs for ${emailToClean}:`, userError.message);
    } else {
      console.log(`✅ Deleted ${userOTPs?.length || 0} OTP records for ${emailToClean}`);
    }
  }

  // Option 3: Clean old unverified OTPs (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { data: oldOTPs, error: oldError } = await supabase
    .from('email_verification_otps')
    .delete()
    .eq('verified', false)
    .lt('created_at', oneHourAgo.toISOString())
    .select();

  if (oldError) {
    console.log('⚠️  Error cleaning old OTPs:', oldError.message);
  } else {
    console.log(`✅ Deleted ${oldOTPs?.length || 0} old unverified OTP records`);
  }

  console.log('\n✅ Cleanup complete! Rate limits have been reset.');
  console.log('   You can now send OTP requests again.');
}

console.log('🚀 Starting OTP Cleanup...\n');
console.log('Usage: npx tsx scripts/cleanup-test-otps.ts [email@example.com]\n');
cleanupOTPs();

