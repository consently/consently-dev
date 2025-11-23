/**
 * Backfill Script: Populate visitor_email in existing consent records
 * 
 * This script populates the visitor_email field for existing consent records
 * by looking up emails in the email_verification_otps table using the email hash.
 * 
 * Usage:
 *   node scripts/backfill-visitor-emails.js
 * 
 * Environment variables required:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function backfillVisitorEmails() {
    console.log('🚀 Starting visitor_email backfill process...\n');

    try {
        // Step 1: Get statistics
        console.log('📊 Gathering statistics...');

        const { count: totalRecords } = await supabase
            .from('dpdpa_consent_records')
            .select('*', { count: 'exact', head: true });

        const { count: recordsWithHash } = await supabase
            .from('dpdpa_consent_records')
            .select('*', { count: 'exact', head: true })
            .not('visitor_email_hash', 'is', null);

        const { count: recordsNeedingBackfill } = await supabase
            .from('dpdpa_consent_records')
            .select('*', { count: 'exact', head: true })
            .not('visitor_email_hash', 'is', null)
            .is('visitor_email', null);

        console.log(`   Total consent records: ${totalRecords}`);
        console.log(`   Records with email hash: ${recordsWithHash}`);
        console.log(`   Records needing backfill: ${recordsNeedingBackfill}\n`);

        if (recordsNeedingBackfill === 0) {
            console.log('✅ No records need backfilling. All done!');
            return;
        }

        // Step 2: Get all records needing backfill
        console.log('🔍 Fetching records needing backfill...');
        const { data: recordsToUpdate, error: fetchError } = await supabase
            .from('dpdpa_consent_records')
            .select('id, visitor_email_hash')
            .not('visitor_email_hash', 'is', null)
            .is('visitor_email', null)
            .limit(1000); // Process in batches to avoid memory issues

        if (fetchError) {
            throw new Error(`Failed to fetch records: ${fetchError.message}`);
        }

        if (!recordsToUpdate || recordsToUpdate.length === 0) {
            console.log('✅ No records found to backfill.');
            return;
        }

        console.log(`   Found ${recordsToUpdate.length} records to process\n`);

        // Step 3: Get unique email hashes
        const uniqueHashes = [...new Set(recordsToUpdate.map(r => r.visitor_email_hash))];
        console.log(`🔍 Looking up ${uniqueHashes.length} unique email hashes in OTP table...\n`);

        // Step 4: Fetch emails from OTP table for all hashes
        const { data: otpRecords, error: otpError } = await supabase
            .from('email_verification_otps')
            .select('email_hash, email, verified, verified_at, created_at')
            .in('email_hash', uniqueHashes)
            .eq('verified', true)  // Only use verified emails
            .not('email', 'is', null)
            .order('verified_at', { ascending: false })
            .order('created_at', { ascending: false });

        if (otpError) {
            throw new Error(`Failed to fetch OTP records: ${otpError.message}`);
        }

        // Create a map of email_hash -> email (using most recent verified OTP per hash)
        const emailMap = new Map();
        (otpRecords || []).forEach(otp => {
            if (!emailMap.has(otp.email_hash)) {
                emailMap.set(otp.email_hash, otp.email);
            }
        });

        console.log(`   Found emails for ${emailMap.size} out of ${uniqueHashes.length} hashes\n`);

        // Step 5: Update records
        console.log('📝 Updating consent records...');
        let updatedCount = 0;
        let skippedCount = 0;

        for (const record of recordsToUpdate) {
            const email = emailMap.get(record.visitor_email_hash);

            if (!email) {
                skippedCount++;
                continue;
            }

            const { error: updateError } = await supabase
                .from('dpdpa_consent_records')
                .update({ visitor_email: email })
                .eq('id', record.id);

            if (updateError) {
                console.error(`   ⚠️  Failed to update record ${record.id}: ${updateError.message}`);
            } else {
                updatedCount++;
                if (updatedCount % 50 === 0) {
                    console.log(`   Progress: ${updatedCount}/${recordsToUpdate.length} records updated...`);
                }
            }
        }

        console.log('\n✅ Backfill complete!');
        console.log(`   Records updated: ${updatedCount}`);
        console.log(`   Records skipped (no email found): ${skippedCount}`);

        if (skippedCount > 0) {
            console.log('\n⚠️  Note: Some records could not be backfilled because:');
            console.log('   - The OTP was never verified');
            console.log('   - The OTP has been cleaned up/expired');
            console.log('   - The email was entered differently (case/whitespace)');
        }

    } catch (error) {
        console.error('\n❌ Error during backfill:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the backfill
backfillVisitorEmails()
    .then(() => {
        console.log('\n✨ Backfill script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Backfill script failed:', error);
        process.exit(1);
    });
