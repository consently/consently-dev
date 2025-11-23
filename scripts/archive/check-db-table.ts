#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking if email_verification_otps table exists...\n');

  try {
    const { data, error } = await supabase
      .from('email_verification_otps')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Table email_verification_otps does NOT exist!');
        console.log('\n📋 You need to run the database migration:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Run the migration file: supabase/migrations/20250119000001_create_email_verification_otp.sql');
        console.log('   OR');
        console.log('   3. Run: supabase db push');
        process.exit(1);
      }
      console.log('❌ Database error:', error.message);
      process.exit(1);
    }

    console.log('✅ Table email_verification_otps exists!');
    console.log('✅ Database is ready');
  } catch (err: any) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

checkTable();
