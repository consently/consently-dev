#!/usr/bin/env npx tsx

/**
 * Quick Health Check for Supabase Instance
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkSupabaseHealth() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    console.log('🏥 Supabase Health Check\n');
    console.log(`Instance: ${url}\n`);

    try {
        const response = await fetch(`${url}/rest/v1/`, {
            method: 'HEAD',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
            console.log('✅ Supabase is HEALTHY and accessible\n');
            console.log('You can now:');
            console.log('  - Test login at https://www.consently.in/login');
            console.log('  - Run full diagnostics: npx tsx scripts/diagnostic-widget-api.ts');
            return true;
        } else if (response.status === 556) {
            console.log('❌ Supabase is PAUSED or UNREACHABLE\n');
            console.log('Action needed:');
            console.log('  1. Go to https://supabase.com/dashboard');
            console.log('  2. Select project: skjfzeunsqaayqarotjo');
            console.log('  3. Click "Restore project" if paused');
            console.log('  4. Wait 2-3 minutes, then re-run this check');
            return false;
        } else {
            console.log(`⚠️  Unexpected status: ${response.status}\n`);
            console.log('Check Supabase dashboard for issues');
            return false;
        }
    } catch (error: any) {
        console.log('💥 Network error:', error.message);
        return false;
    }
}

checkSupabaseHealth();
