/**
 * Backfill Script: Sync Verified Emails from visitor_consent_preferences to dpdpa_consent_records
 * 
 * This script syncs verified emails from visitor_consent_preferences to dpdpa_consent_records
 * for users who verified their emails before the sync logic was added.
 * 
 * Usage:
 *   node scripts/backfill-sync-emails-from-preferences.js
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

async function backfillEmailsFromPreferences() {
    console.log('🚀 Starting email sync from visitor_consent_preferences to dpdpa_consent_records...\n');

    try {
        // Step 1: Get statistics
        console.log('📊 Gathering statistics...');

        // Count visitors with verified emails in preferences
        const { count: visitorsWithEmail } = await supabase
            .from('visitor_consent_preferences')
            .select('visitor_id', { count: 'exact', head: true })
            .not('visitor_email', 'is', null);

        // Count consent records missing email
        const { count: recordsMissingEmail } = await supabase
            .from('dpdpa_consent_records')
            .select('id', { count: 'exact', head: true })
            .or('visitor_email.is.null,visitor_email_hash.is.null');

        console.log(`   Visitors with verified emails in preferences: ${visitorsWithEmail}`);
        console.log(`   Consent records missing email: ${recordsMissingEmail}\n`);

        if (visitorsWithEmail === 0) {
            console.log('✅ No verified emails found in preferences. Nothing to sync.');
            return;
        }

        // Step 2: Get all unique visitor_id + widget_id combinations with emails
        console.log('🔍 Fetching verified emails from preferences...');
        const { data: preferencesWithEmail, error: fetchPrefsError } = await supabase
            .from('visitor_consent_preferences')
            .select('visitor_id, widget_id, visitor_email, visitor_email_hash')
            .not('visitor_email', 'is', null)
            .not('visitor_email_hash', 'is', null);

        if (fetchPrefsError) {
            throw new Error(`Failed to fetch preferences: ${fetchPrefsError.message}`);
        }

        if (!preferencesWithEmail || preferencesWithEmail.length === 0) {
            console.log('✅ No preferences with emails found.');
            return;
        }

        // Create a map: visitor_id + widget_id -> email info
        const emailMap = new Map();
        preferencesWithEmail.forEach(pref => {
            const key = `${pref.visitor_id}|${pref.widget_id}`;
            if (!emailMap.has(key)) {
                emailMap.set(key, {
                    visitor_email: pref.visitor_email,
                    visitor_email_hash: pref.visitor_email_hash
                });
            }
        });

        console.log(`   Found ${emailMap.size} unique visitor+widget combinations with verified emails\n`);

        // Step 3: Find consent records that need updating
        console.log('🔍 Finding consent records that need email updates...');
        
        const visitorWidgetPairs = Array.from(emailMap.keys()).map(key => {
            const [visitor_id, widget_id] = key.split('|');
            return { visitor_id, widget_id };
        });

        // Process in batches to avoid query size limits
        const BATCH_SIZE = 50;
        let totalUpdated = 0;
        let totalSkipped = 0;

        for (let i = 0; i < visitorWidgetPairs.length; i += BATCH_SIZE) {
            const batch = visitorWidgetPairs.slice(i, i + BATCH_SIZE);
            
            // Build OR conditions for this batch
            const orConditions = batch.map(pair => 
                `(visitor_id.eq.${pair.visitor_id},widget_id.eq.${pair.widget_id})`
            ).join(',');

            // Fetch consent records for this batch that need updating
            const { data: recordsToUpdate, error: fetchRecordsError } = await supabase
                .from('dpdpa_consent_records')
                .select('id, visitor_id, widget_id')
                .or(`visitor_email.is.null,visitor_email_hash.is.null`)
                .or(orConditions);

            if (fetchRecordsError) {
                console.error(`   ⚠️  Error fetching records for batch ${i / BATCH_SIZE + 1}: ${fetchRecordsError.message}`);
                continue;
            }

            if (!recordsToUpdate || recordsToUpdate.length === 0) {
                continue;
            }

            // Update records in this batch
            for (const record of recordsToUpdate) {
                const key = `${record.visitor_id}|${record.widget_id}`;
                const emailInfo = emailMap.get(key);

                if (!emailInfo) {
                    totalSkipped++;
                    continue;
                }

                const { error: updateError } = await supabase
                    .from('dpdpa_consent_records')
                    .update({
                        visitor_email: emailInfo.visitor_email,
                        visitor_email_hash: emailInfo.visitor_email_hash,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', record.id)
                    .or('visitor_email.is.null,visitor_email_hash.is.null'); // Only update if missing

                if (updateError) {
                    console.error(`   ⚠️  Failed to update record ${record.id}: ${updateError.message}`);
                    totalSkipped++;
                } else {
                    totalUpdated++;
                    if (totalUpdated % 50 === 0) {
                        console.log(`   Progress: ${totalUpdated} records updated...`);
                    }
                }
            }
        }

        console.log('\n✅ Email sync complete!');
        console.log(`   Records updated: ${totalUpdated}`);
        console.log(`   Records skipped: ${totalSkipped}`);

        // Step 4: Verification
        console.log('\n📊 Verification statistics:');
        const { count: recordsWithEmail } = await supabase
            .from('dpdpa_consent_records')
            .select('id', { count: 'exact', head: true })
            .not('visitor_email', 'is', null);

        const { count: totalRecords } = await supabase
            .from('dpdpa_consent_records')
            .select('id', { count: 'exact', head: true });

        const coverage = totalRecords > 0 
            ? ((recordsWithEmail / totalRecords) * 100).toFixed(2) 
            : 0;

        console.log(`   Total consent records: ${totalRecords}`);
        console.log(`   Records with email: ${recordsWithEmail}`);
        console.log(`   Email coverage: ${coverage}%`);

    } catch (error) {
        console.error('\n❌ Error during backfill:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the backfill
backfillEmailsFromPreferences()
    .then(() => {
        console.log('\n✨ Backfill script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Backfill script failed:', error);
        process.exit(1);
    });










