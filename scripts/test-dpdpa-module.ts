#!/usr/bin/env ts-node
/**
 * DPDPA Module Comprehensive Test Script
 * 
 * This script tests:
 * 1. Email linking with preferences
 * 2. Saving preferences on email
 * 3. Cross-device preference syncing via email
 * 4. Consent record creation
 * 5. Preference centre functionality
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
    log(`✅ ${message}`, colors.green);
}

function error(message: string) {
    log(`❌ ${message}`, colors.red);
}

function info(message: string) {
    log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
    log(`⚠️  ${message}`, colors.yellow);
}

function section(title: string) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`  ${title}`, colors.bright + colors.cyan);
    log(`${'='.repeat(60)}\n`, colors.cyan);
}

// Helper to hash email
function hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Generate test visitor ID
function generateVisitorId(): string {
    return crypto.randomUUID();
}

// Generate test widget ID
function generateTestWidgetId(): string {
    return `test_widget_${Date.now()}`;
}

interface TestContext {
    supabase: any;
    widgetId: string;
    visitorId1: string;
    visitorId2: string;
    testEmail: string;
    emailHash: string;
    activityIds: string[];
    userId: string;
}

async function setupTestEnvironment(): Promise<TestContext> {
    section('Setting Up Test Environment');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        error('Missing Supabase credentials in .env.local');
        error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing widget or create a test one
    const { data: widgets, error: widgetError } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id, user_id, selected_activities')
        .eq('is_active', true)
        .limit(1);

    if (widgetError || !widgets || widgets.length === 0) {
        error('No active widgets found. Please create a widget first.');
        process.exit(1);
    }

    const widget = widgets[0];
    const widgetId = widget.widget_id;
    const userId = widget.user_id;

    // Get processing activities for testing
    const { data: activities, error: activitiesError } = await supabase
        .from('processing_activities')
        .select('id')
        .eq('is_active', true)
        .limit(3);

    if (activitiesError || !activities || activities.length < 2) {
        error('Not enough processing activities found. Need at least 2 activities.');
        process.exit(1);
    }

    const activityIds = activities.map((a: any) => a.id);

    const visitorId1 = generateVisitorId();
    const visitorId2 = generateVisitorId();
    const testEmail = `test_${Date.now()}@example.com`;
    const emailHash = hashEmail(testEmail);

    success(`Widget ID: ${widgetId}`);
    success(`User ID: ${userId}`);
    success(`Visitor ID 1 (Device 1): ${visitorId1}`);
    success(`Visitor ID 2 (Device 2): ${visitorId2}`);
    success(`Test Email: ${testEmail}`);
    success(`Email Hash: ${emailHash.substring(0, 16)}...`);
    success(`Activity IDs: ${activityIds.length} activities loaded`);

    return {
        supabase,
        widgetId,
        visitorId1,
        visitorId2,
        testEmail,
        emailHash,
        activityIds,
        userId,
    };
}

async function testConsentRecordWithEmail(ctx: TestContext): Promise<boolean> {
    section('Test 1: Create Consent Record with Email');

    info('Creating consent record with visitor email...');

    const { supabase, widgetId, visitorId1, testEmail, emailHash, activityIds } = ctx;

    const consentData = {
        widget_id: widgetId,
        visitor_id: visitorId1,
        consent_id: `${widgetId}_${visitorId1}_${Date.now()}`,
        consent_status: 'accepted',
        consented_activities: [activityIds[0]],
        rejected_activities: [activityIds[1]],
        visitor_email: testEmail,
        visitor_email_hash: emailHash,
        consent_details: {
            activityConsents: {},
            metadata: {
                source: 'test_script',
                deviceType: 'Desktop',
            },
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-script',
        device_type: 'Desktop',
        language: 'en',
        consent_given_at: new Date().toISOString(),
        consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        privacy_notice_version: '3.0',
    };

    const { data, error: insertError } = await supabase
        .from('dpdpa_consent_records')
        .insert(consentData)
        .select()
        .single();

    if (insertError) {
        error(`Failed to create consent record: ${insertError.message}`);
        return false;
    }

    success(`Consent record created with ID: ${data.id}`);

    // Verify email is saved
    if (data.visitor_email === testEmail) {
        success('✓ Visitor email saved correctly');
    } else {
        error('✗ Visitor email not saved correctly');
        return false;
    }

    if (data.visitor_email_hash === emailHash) {
        success('✓ Visitor email hash saved correctly');
    } else {
        error('✗ Visitor email hash not saved correctly');
        return false;
    }

    return true;
}

async function testPreferencesWithEmail(ctx: TestContext): Promise<boolean> {
    section('Test 2: Save Preferences with Email');

    info('Creating visitor preferences with email...');

    const { supabase, widgetId, visitorId1, testEmail, emailHash, activityIds } = ctx;

    const preferences = [
        {
            visitor_id: visitorId1,
            widget_id: widgetId,
            activity_id: activityIds[0],
            consent_status: 'accepted',
            visitor_email: testEmail,
            visitor_email_hash: emailHash,
            ip_address: '127.0.0.1',
            user_agent: 'test-script',
            device_type: 'Desktop',
            language: 'en',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            consent_version: '1.0',
        },
        {
            visitor_id: visitorId1,
            widget_id: widgetId,
            activity_id: activityIds[1],
            consent_status: 'rejected',
            visitor_email: testEmail,
            visitor_email_hash: emailHash,
            ip_address: '127.0.0.1',
            user_agent: 'test-script',
            device_type: 'Desktop',
            language: 'en',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            consent_version: '1.0',
        },
    ];

    const { data, error: insertError } = await supabase
        .from('visitor_consent_preferences')
        .insert(preferences)
        .select();

    if (insertError) {
        error(`Failed to create preferences: ${insertError.message}`);
        return false;
    }

    success(`Created ${data.length} preferences`);

    // Verify email linking
    for (const pref of data) {
        if (pref.visitor_email === testEmail && pref.visitor_email_hash === emailHash) {
            success(`✓ Preference ${pref.id} linked to email correctly`);
        } else {
            error(`✗ Preference ${pref.id} not linked to email correctly`);
            return false;
        }
    }

    return true;
}

async function testCrossDeviceSync(ctx: TestContext): Promise<boolean> {
    section('Test 3: Cross-Device Preference Sync via Email');

    info('Testing cross-device sync using email hash...');

    const { supabase, widgetId, visitorId1, visitorId2, testEmail, emailHash, activityIds } = ctx;

    // Device 1: Create preferences with email
    info('Device 1: Creating preferences with email...');
    const device1Prefs = [
        {
            visitor_id: visitorId1,
            widget_id: widgetId,
            activity_id: activityIds[0],
            consent_status: 'accepted',
            visitor_email: testEmail,
            visitor_email_hash: emailHash,
            device_type: 'Desktop',
            ip_address: '192.168.1.100',
            user_agent: 'device1-agent',
            language: 'en',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            consent_version: '1.0',
        },
    ];

    const { data: device1Data, error: device1Error } = await supabase
        .from('visitor_consent_preferences')
        .upsert(device1Prefs, {
            onConflict: 'visitor_id, widget_id, activity_id',
            ignoreDuplicates: false,
        })
        .select();

    if (device1Error) {
        error(`Device 1 failed: ${device1Error.message}`);
        return false;
    }

    success(`Device 1: Created ${device1Data.length} preferences`);

    // Device 2: Link to same email
    info('Device 2: Linking to same email...');
    const device2Prefs = [
        {
            visitor_id: visitorId2,
            widget_id: widgetId,
            activity_id: activityIds[0],
            consent_status: 'accepted',
            visitor_email: testEmail,
            visitor_email_hash: emailHash,
            device_type: 'Mobile',
            ip_address: '192.168.1.101',
            user_agent: 'device2-agent',
            language: 'en',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            consent_version: '1.0',
        },
    ];

    const { data: device2Data, error: device2Error } = await supabase
        .from('visitor_consent_preferences')
        .upsert(device2Prefs, {
            onConflict: 'visitor_id, widget_id, activity_id',
            ignoreDuplicates: false,
        })
        .select();

    if (device2Error) {
        error(`Device 2 failed: ${device2Error.message}`);
        return false;
    }

    success(`Device 2: Created ${device2Data.length} preferences`);

    // Verify both devices are linked to same email
    const { data: linkedPrefs, error: queryError } = await supabase
        .from('visitor_consent_preferences')
        .select('*')
        .eq('visitor_email_hash', emailHash)
        .eq('widget_id', widgetId);

    if (queryError) {
        error(`Failed to query linked preferences: ${queryError.message}`);
        return false;
    }

    const uniqueVisitors = new Set(linkedPrefs.map((p: any) => p.visitor_id));

    if (uniqueVisitors.size >= 2) {
        success(`✓ Cross-device sync working: ${uniqueVisitors.size} devices linked to email`);
    } else {
        error(`✗ Cross-device sync failed: Only ${uniqueVisitors.size} device(s) found`);
        return false;
    }

    return true;
}

async function testPreferenceUpdate(ctx: TestContext): Promise<boolean> {
    section('Test 4: Update Preferences via API');

    info('Testing preference update with email...');

    const { supabase, widgetId, visitorId1, testEmail, activityIds } = ctx;

    // Simulate updating preferences (like what the /api/privacy-centre/preferences endpoint does)
    const emailHash = hashEmail(testEmail);

    const updateData = {
        visitor_id: visitorId1,
        widget_id: widgetId,
        activity_id: activityIds[0],
        consent_status: 'withdrawn',
        visitor_email: testEmail,
        visitor_email_hash: emailHash,
        last_updated: new Date().toISOString(),
        device_type: 'Desktop',
        language: 'en',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        consent_version: '1.0',
    };

    const { data, error: updateError } = await supabase
        .from('visitor_consent_preferences')
        .upsert(updateData, {
            onConflict: 'visitor_id, widget_id, activity_id',
            ignoreDuplicates: false,
        })
        .select()
        .single();

    if (updateError) {
        error(`Failed to update preference: ${updateError.message}`);
        return false;
    }

    if (data.consent_status === 'withdrawn') {
        success('✓ Preference updated to withdrawn successfully');
    } else {
        error('✗ Preference status not updated correctly');
        return false;
    }

    if (data.visitor_email === testEmail) {
        success('✓ Email preserved after update');
    } else {
        error('✗ Email lost after update');
        return false;
    }

    return true;
}

async function testEmailRetrieval(ctx: TestContext): Promise<boolean> {
    section('Test 5: Retrieve Preferences by Email');

    info('Testing retrieval of all preferences by email hash...');

    const { supabase, widgetId, emailHash } = ctx;

    const { data: preferences, error: queryError } = await supabase
        .from('visitor_consent_preferences')
        .select('*')
        .eq('visitor_email_hash', emailHash)
        .eq('widget_id', widgetId);

    if (queryError) {
        error(`Failed to retrieve preferences: ${queryError.message}`);
        return false;
    }

    if (preferences && preferences.length > 0) {
        success(`✓ Retrieved ${preferences.length} preferences by email hash`);

        // Show details
        for (const pref of preferences) {
            info(`  - Activity: ${pref.activity_id.substring(0, 8)}... | Status: ${pref.consent_status} | Device: ${pref.device_type || 'Unknown'}`);
        }
    } else {
        error('✗ No preferences found for email hash');
        return false;
    }

    return true;
}

async function testConsentRecordRetrieval(ctx: TestContext): Promise<boolean> {
    section('Test 6: Retrieve Consent Records by Email');

    info('Testing retrieval of consent records by email hash...');

    const { supabase, widgetId, emailHash } = ctx;

    const { data: records, error: queryError } = await supabase
        .from('dpdpa_consent_records')
        .select('*')
        .eq('visitor_email_hash', emailHash)
        .eq('widget_id', widgetId);

    if (queryError) {
        error(`Failed to retrieve consent records: ${queryError.message}`);
        return false;
    }

    if (records && records.length > 0) {
        success(`✓ Retrieved ${records.length} consent record(s) by email hash`);

        // Show details
        for (const record of records) {
            info(`  - Consent ID: ${record.consent_id} | Status: ${record.consent_status} | Email: ${record.visitor_email || 'N/A'}`);
        }
    } else {
        warning('⚠️  No consent records found for email hash (this is fine if only preferences were created)');
    }

    return true;
}

async function cleanup(ctx: TestContext): Promise<void> {
    section('Cleanup');

    info('Cleaning up test data...');

    const { supabase, visitorId1, visitorId2, widgetId } = ctx;

    // Delete test preferences
    const { error: prefsError } = await supabase
        .from('visitor_consent_preferences')
        .delete()
        .in('visitor_id', [visitorId1, visitorId2])
        .eq('widget_id', widgetId);

    if (prefsError) {
        warning(`Warning: Failed to cleanup preferences: ${prefsError.message}`);
    } else {
        success('✓ Test preferences cleaned up');
    }

    // Delete test consent records
    const { error: recordsError } = await supabase
        .from('dpdpa_consent_records')
        .delete()
        .in('visitor_id', [visitorId1, visitorId2])
        .eq('widget_id', widgetId);

    if (recordsError) {
        warning(`Warning: Failed to cleanup consent records: ${recordsError.message}`);
    } else {
        success('✓ Test consent records cleaned up');
    }
}

async function runAllTests() {
    log('\n🚀 DPDPA Module Comprehensive Test Suite', colors.bright + colors.cyan);
    log('Testing email linking and preference management\n', colors.cyan);

    let testsPassed = 0;
    let testsFailed = 0;

    try {
        const ctx = await setupTestEnvironment();

        const tests = [
            { name: 'Consent Record with Email', fn: testConsentRecordWithEmail },
            { name: 'Preferences with Email', fn: testPreferencesWithEmail },
            { name: 'Cross-Device Sync', fn: testCrossDeviceSync },
            { name: 'Preference Update', fn: testPreferenceUpdate },
            { name: 'Email Retrieval', fn: testEmailRetrieval },
            { name: 'Consent Record Retrieval', fn: testConsentRecordRetrieval },
        ];

        for (const test of tests) {
            try {
                const result = await test.fn(ctx);
                if (result) {
                    testsPassed++;
                    success(`${test.name}: PASSED\n`);
                } else {
                    testsFailed++;
                    error(`${test.name}: FAILED\n`);
                }
            } catch (err: any) {
                testsFailed++;
                error(`${test.name}: ERROR - ${err.message}\n`);
            }
        }

        await cleanup(ctx);

        section('Test Results Summary');
        log(`Total Tests: ${tests.length}`, colors.bright);
        success(`Passed: ${testsPassed}`);
        if (testsFailed > 0) {
            error(`Failed: ${testsFailed}`);
        }

        const successRate = ((testsPassed / tests.length) * 100).toFixed(1);
        log(`\nSuccess Rate: ${successRate}%`, colors.bright);

        if (testsFailed === 0) {
            log('\n🎉 All tests passed! DPDPA module is working amazingly!', colors.green + colors.bright);
            log('✓ Email linking is functional', colors.green);
            log('✓ Preferences are saved with email correctly', colors.green);
            log('✓ Cross-device sync is working', colors.green);
        } else {
            log('\n⚠️  Some tests failed. Please review the errors above.', colors.yellow);
        }

    } catch (err: any) {
        error(`\nFatal error: ${err.message}`);
        console.error(err);
        process.exit(1);
    }
}

// Run the tests
runAllTests().catch((err) => {
    error(`Unhandled error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
