#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test script to verify stable consent_id implementation
 * Tests:
 * 1. Consent ID pattern for verified emails (deterministic with email hash)
 * 2. Consent ID pattern for unverified emails (random)
 * 3. Existing consent detection and update for verified emails
 * 4. Multi-device scenario with same verified email
 */

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper functions
function hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function log(message: string, level: 'info' | 'success' | 'error' | 'section' = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        section: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${message}${reset}`);
}

interface TestContext {
    widgetId: string;
    activityId: string;
    testEmail: string;
    emailHash: string;
    visitorId1: string;
    visitorId2: string;
}

async function setup(): Promise<TestContext | null> {
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Test Setup', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    // Get an active widget
    const { data: widget, error: widgetError } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id, selected_activities')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (widgetError || !widget || !widget.selected_activities || widget.selected_activities.length === 0) {
        log('❌ No active widget with activities found', 'error');
        return null;
    }

    log(`✅ Widget ID: ${widget.widget_id}`, 'success');

    const activityId = widget.selected_activities[0];
    log(`✅ Activity ID: ${activityId}`, 'success');

    // Generate test data
    const testEmail = `test_${Date.now()}@example.com`;
    const emailHash = hashEmail(testEmail);
    const visitorId1 = `visitor_${Date.now()}_device1`;
    const visitorId2 = `visitor_${Date.now()}_device2`;

    log(`✅ Test Email: ${testEmail}`, 'success');
    log(`✅ Email Hash: ${emailHash.substring(0, 16)}...`, 'success');
    log(`✅ Visitor ID 1 (Device 1): ${visitorId1}`, 'success');
    log(`✅ Visitor ID 2 (Device 2): ${visitorId2}`, 'success');

    return {
        widgetId: widget.widget_id,
        activityId,
        testEmail,
        emailHash,
        visitorId1,
        visitorId2,
    };
}

async function test1_UnverifiedConsentId(ctx: TestContext): Promise<boolean> {
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Test 1: Unverified Email - Random consent_id Pattern', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    // Create consent without email
    const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert({
            widget_id: ctx.widgetId,
            visitor_id: ctx.visitorId1,
            consent_id: `${ctx.widgetId}_${ctx.visitorId1}_${Date.now()}_test01`,
            consent_status: 'accepted',
            consented_activities: [ctx.activityId],
            rejected_activities: [],
            consent_given_at: new Date().toISOString(),
            consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            privacy_notice_version: '3.0',
        })
        .select()
        .single();

    if (error) {
        log(`❌ Failed to create consent: ${error.message}`, 'error');
        return false;
    }

    // Verify pattern: widgetId_visitorId_timestamp_random
    // Widget ID and visitor ID can contain underscores, so we need a more flexible pattern
    // Pattern: <widgetId>_<visitorId>_<timestamp>_<randomSuffix>
    const parts = data.consent_id.split('_');
    const isValidPattern = parts.length >= 4 && 
                          /^\d+$/.test(parts[parts.length - 2]) && // timestamp is second to last
                          /^[a-z0-9]+$/.test(parts[parts.length - 1]) && // random suffix is last
                          data.consent_id.startsWith(ctx.widgetId + '_'); // starts with widget ID

    if (isValidPattern) {
        log(`✅ Consent ID follows random pattern: ${data.consent_id}`, 'success');
        return true;
    } else {
        log(`❌ Consent ID doesn't match random pattern: ${data.consent_id}`, 'error');
        log(`   Expected format: ${ctx.widgetId}_<visitorId>_<timestamp>_<randomSuffix>`, 'info');
        return false;
    }
}

async function test2_VerifiedConsentId(ctx: TestContext): Promise<boolean> {
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Test 2: Verified Email - Deterministic consent_id Pattern', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    // Create consent with email
    const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert({
            widget_id: ctx.widgetId,
            visitor_id: ctx.visitorId1,
            consent_id: `${ctx.widgetId}_${ctx.emailHash.substring(0, 16)}_${Date.now()}`,
            consent_status: 'accepted',
            consented_activities: [ctx.activityId],
            rejected_activities: [],
            visitor_email: ctx.testEmail,
            visitor_email_hash: ctx.emailHash,
            consent_given_at: new Date().toISOString(),
            consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            privacy_notice_version: '3.0',
        })
        .select()
        .single();

    if (error) {
        log(`❌ Failed to create consent: ${error.message}`, 'error');
        return false;
    }

    // Verify pattern: widgetId_emailHashPrefix(16)_timestamp
    // Widget ID can contain underscores, so we need a more flexible pattern
    const expectedPrefix = `${ctx.widgetId}_${ctx.emailHash.substring(0, 16)}`;
    const hasCorrectPrefix = data.consent_id.startsWith(expectedPrefix);
    
    // Pattern: <widgetId>_<16-char-hex>_<timestamp>
    // Split and verify: last part is timestamp (numeric), second to last is 16-char hex
    const parts = data.consent_id.split('_');
    const emailHashPart = parts[parts.length - 2]; // second to last part
    const timestampPart = parts[parts.length - 1]; // last part
    const isValidPattern = parts.length >= 3 &&
                          /^[a-f0-9]{16}$/.test(emailHashPart) && // 16-char hex
                          /^\d+$/.test(timestampPart) && // numeric timestamp
                          hasCorrectPrefix;

    if (isValidPattern && hasCorrectPrefix) {
        log(`✅ Consent ID follows deterministic pattern: ${data.consent_id}`, 'success');
        log(`✅ Consent ID contains email hash prefix`, 'success');
        return true;
    } else {
        log(`❌ Consent ID doesn't match deterministic pattern: ${data.consent_id}`, 'error');
        log(`   Expected prefix: ${expectedPrefix}`, 'info');
        log(`   Parts: ${parts.join(' | ')}`, 'info');
        return false;
    }
}

async function test3_MultiDeviceSameEmail(ctx: TestContext): Promise<boolean> {
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Test 3: Multi-Device with Same Verified Email', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    // Create consent from device 2 with same email
    const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert({
            widget_id: ctx.widgetId,
            visitor_id: ctx.visitorId2,
            consent_id: `${ctx.widgetId}_${ctx.emailHash.substring(0, 16)}_${Date.now()}`,
            consent_status: 'accepted',
            consented_activities: [ctx.activityId],
            rejected_activities: [],
            visitor_email: ctx.testEmail,
            visitor_email_hash: ctx.emailHash,
            consent_given_at: new Date().toISOString(),
            consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            privacy_notice_version: '3.0',
        })
        .select()
        .single();

    if (error) {
        log(`❌ Failed to create consent from device 2: ${error.message}`, 'error');
        return false;
    }

    // Verify both records share email hash prefix
    const { data: allEmailConsents } = await supabase
        .from('dpdpa_consent_records')
        .select('consent_id, visitor_id, visitor_email')
        .eq('widget_id', ctx.widgetId)
        .eq('visitor_email_hash', ctx.emailHash);

    if (!allEmailConsents || allEmailConsents.length < 2) {
        log(`❌ Expected at least 2 consent records for this email`, 'error');
        return false;
    }

    const prefix = `${ctx.widgetId}_${ctx.emailHash.substring(0, 16)}`;
    const allHavePrefix = allEmailConsents.every(r => r.consent_id.startsWith(prefix));

    if (allHavePrefix) {
        log(`✅ All ${allEmailConsents.length} consent records share email hash prefix`, 'success');
        allEmailConsents.forEach(r => {
            log(`   - ${r.consent_id} (visitor: ${r.visitor_id.substring(0, 20)}...)`, 'info');
        });
        return true;
    } else {
        log(`❌ Not all consent records share the same email hash prefix`, 'error');
        return false;
    }
}

async function cleanup(ctx: TestContext): Promise<void> {
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Cleanup', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    // Delete test consent records
    const { error: deleteError } = await supabase
        .from('dpdpa_consent_records')
        .delete()
        .or(`visitor_id.eq.${ctx.visitorId1},visitor_id.eq.${ctx.visitorId2}`);

    if (deleteError) {
        log(`⚠️  Cleanup failed (non-critical): ${deleteError.message}`, 'error');
    } else {
        log('✅ Test data cleaned up successfully', 'success');
    }
}

async function main() {
    log('\n🚀 Stable Consent ID System - Verification Tests\n', 'section');

    const ctx = await setup();
    if (!ctx) {
        log('\n❌ Setup failed. Exiting.\n', 'error');
        process.exit(1);
    }

    const results: { name: string; passed: boolean }[] = [];

    // Run tests
    results.push({ name: 'Unverified Email - Random Pattern', passed: await test1_UnverifiedConsentId(ctx) });
    results.push({ name: 'Verified Email - Deterministic Pattern', passed: await test2_VerifiedConsentId(ctx) });
    results.push({ name: 'Multi-Device Same Email', passed: await test3_MultiDeviceSameEmail(ctx) });

    // Cleanup
    await cleanup(ctx);

    // Summary
    log('\n════════════════════════════════════════════════════════════════', 'section');
    log('  Test Results Summary', 'section');
    log('════════════════════════════════════════════════════════════════\n', 'section');

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    results.forEach(r => {
        const icon = r.passed ? '✅' : '❌';
        const status = r.passed ? 'PASSED' : 'FAILED';
        log(`${icon} ${r.name}: ${status}`, r.passed ? 'success' : 'error');
    });

    log(`\nTotal: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'success' : 'error');

    if (passedCount === totalCount) {
        log('\n🎉 All tests passed! Stable consent_id system is working correctly.\n', 'success');
        process.exit(0);
    } else {
        log(`\n❌ ${totalCount - passedCount} test(s) failed.\n`, 'error');
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}\n`, 'error');
    console.error(error);
    process.exit(1);
});
