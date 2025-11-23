#!/usr/bin/env tsx

/**
 * Clean ALL OTP Records
 * ⚠️ FOR DEVELOPMENT/TESTING ONLY!
 * This removes all OTP records to reset rate limits
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function cleanupAllOTPs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase credentials');
    console.log('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧹 Cleaning ALL OTP records...');
  console.log('⚠️  This is for DEVELOPMENT/TESTING only!\n');

  const { data: deleted, error } = await supabase
    .from('email_verification_otps')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Match all records
    .select();

  if (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Deleted ${deleted?.length || 0} OTP record(s)`);
  console.log('✅ Rate limits have been reset!');
  console.log('\n🎉 You can now send OTP requests again!');
}

cleanupAllOTPs();

