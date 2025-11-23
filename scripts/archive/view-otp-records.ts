#!/usr/bin/env tsx

/**
 * View OTP Records
 * Shows current OTP records in the database
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function viewOTPs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📋 Viewing OTP Records...\n');

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { data: otps, error } = await supabase
    .from('email_verification_otps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  if (!otps || otps.length === 0) {
    console.log('✅ No OTP records found. You can send OTP requests now!');
    process.exit(0);
  }

  console.log(`Found ${otps.length} OTP record(s):\n`);

  otps.forEach((otp, index) => {
    const createdAt = new Date(otp.created_at);
    const expiresAt = new Date(otp.expires_at);
    const isExpired = expiresAt < new Date();
    const isOld = createdAt < oneHourAgo;
    const ageMinutes = Math.floor((Date.now() - createdAt.getTime()) / 1000 / 60);

    console.log(`${index + 1}. ${otp.email}`);
    console.log(`   ID: ${otp.id}`);
    console.log(`   OTP: ${otp.otp_code}`);
    console.log(`   Widget: ${otp.widget_id}`);
    console.log(`   Visitor: ${otp.visitor_id}`);
    console.log(`   Created: ${ageMinutes} minutes ago`);
    console.log(`   Expires: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    console.log(`   Verified: ${otp.verified ? '✅ Yes' : '⏳ No'}`);
    console.log(`   Age: ${isOld ? '🕐 > 1 hour (not blocking)' : '⚠️  < 1 hour (counts toward rate limit)'}`);
    console.log();
  });

  // Count how many are within the last hour (for rate limiting)
  const recentOTPs = otps.filter(otp => {
    const createdAt = new Date(otp.created_at);
    return createdAt >= oneHourAgo;
  });

  console.log(`\n📊 Rate Limit Status:`);
  console.log(`   OTPs in last hour: ${recentOTPs.length}/3`);
  
  if (recentOTPs.length >= 3) {
    console.log(`   ⚠️  RATE LIMITED - Wait or clean records`);
    console.log(`\n💡 To clean these records (FOR TESTING ONLY):`);
    console.log(`   npx tsx scripts/cleanup-all-otps.ts`);
  } else {
    console.log(`   ✅ Can send ${3 - recentOTPs.length} more OTP(s)`);
  }
}

viewOTPs();

