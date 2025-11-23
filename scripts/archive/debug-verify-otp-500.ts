/**
 * Debug script for verify-otp 500 error
 * Run with: npx tsx scripts/debug-verify-otp-500.ts
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

async function debugVerifyOTP() {
    console.log('🔍 Debugging verify-otp 500 error\n');

    // Step 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
        return;
    }
    if (!serviceRoleKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
        return;
    }

    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...');
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey.substring(0, 20) + '...');

    // Step 2: Test Supabase connection
    console.log('\n2️⃣ Testing Supabase connection...');
    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });

        // Test a simple query
        const { data, error } = await supabase
            .from('email_verification_otps')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection error:', error);
            return;
        }

        console.log('✅ Supabase connection successful');
    } catch (error: any) {
        console.error('❌ Exception connecting to Supabase:', error.message);
        return;
    }

    // Step 3: Check if email_verification_otps table exists
    console.log('\n3️⃣ Checking email_verification_otps table...');
    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });

        const { data, error } = await supabase
            .from('email_verification_otps')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing email_verification_otps:', error);
            return;
        }

        console.log('✅ email_verification_otps table accessible');
        console.log('   Sample record count:', data?.length || 0);
    } catch (error: any) {
        console.error('❌ Exception:', error.message);
        return;
    }

    // Step 4: Test email hash generation
    console.log('\n4️⃣ Testing email hash generation...');
    const testEmail = 'test@example.com';
    const emailHash = crypto.createHash('sha256').update(testEmail.toLowerCase().trim()).digest('hex');
    console.log('✅ Email hash generated:', emailHash.substring(0, 20) + '...');

    // Step 5: Check visitor_consent_preferences table
    console.log('\n5️⃣ Checking visitor_consent_preferences table...');
    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });

        const { data, error } = await supabase
            .from('visitor_consent_preferences')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing visitor_consent_preferences:', error);
            return;
        }

        console.log('✅ visitor_consent_preferences table accessible');
        console.log('   Sample record count:', data?.length || 0);
    } catch (error: any) {
        console.error('❌ Exception:', error.message);
        return;
    }

    // Step 6: Check email_verification_events table
    console.log('\n6️⃣ Checking email_verification_events table...');
    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });

        const { data, error } = await supabase
            .from('email_verification_events')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing email_verification_events:', error);
            return;
        }

        console.log('✅ email_verification_events table accessible');
        console.log('   Sample record count:', data?.length || 0);
    } catch (error: any) {
        console.error('❌ Exception:', error.message);
        return;
    }

    console.log('\n✅ All diagnostic checks passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check your development server logs for the actual error');
    console.log('   2. Look for any uncaught exceptions or database errors');
    console.log('   3. Verify the request payload matches the expected format');
}

debugVerifyOTP().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
