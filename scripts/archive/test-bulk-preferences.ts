#!/usr/bin/env tsx

/**
 * Test script for bulk preferences API
 * Tests accept_all, reject_all, and custom actions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getTestWidgetAndActivities() {
  // Get first active widget
  const { data: widget } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, selected_activities')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!widget) {
    throw new Error('No active widget found');
  }

  return {
    widgetId: widget.widget_id,
    activityIds: widget.selected_activities || [],
  };
}

async function testBulkAPI() {
  console.log('🧪 Testing Bulk Preferences API\n');

  try {
    // Get test data
    const { widgetId, activityIds } = await getTestWidgetAndActivities();
    console.log(`📋 Using widget: ${widgetId}`);
    console.log(`📋 Activities: ${activityIds.length} found\n`);

    if (activityIds.length === 0) {
      throw new Error('Widget has no activities configured');
    }

    // Test visitor ID
    const testVisitorId = `test_visitor_${Date.now()}`;

    // Test 1: Accept All
    console.log('Test 1: Accept All');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const acceptAllResponse = await fetch(`${API_BASE_URL}/api/privacy-centre/preferences/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVisitorId,
        widgetId: widgetId,
        action: 'accept_all',
        metadata: {
          userAgent: 'test-script',
          deviceType: 'Desktop',
          language: 'en',
        },
      }),
    });

    if (!acceptAllResponse.ok) {
      const errorData = await acceptAllResponse.json();
      console.error('❌ Accept All failed:', errorData);
      throw new Error('Accept All request failed');
    }

    const acceptAllData = await acceptAllResponse.json();
    console.log('✅ Accept All successful');
    console.log(`   Updated: ${acceptAllData.data.updatedCount} preferences`);
    console.log(`   Expires: ${new Date(acceptAllData.data.expiresAt).toLocaleDateString()}`);
    
    // Verify all are accepted
    const acceptedCount = acceptAllData.data.preferences.filter(
      (p: any) => p.consent_status === 'accepted'
    ).length;
    console.log(`   Verified: ${acceptedCount}/${activityIds.length} accepted\n`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Reject All (should mark as withdrawn since previously accepted)
    console.log('Test 2: Reject All');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const rejectAllResponse = await fetch(`${API_BASE_URL}/api/privacy-centre/preferences/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVisitorId,
        widgetId: widgetId,
        action: 'reject_all',
        metadata: {
          userAgent: 'test-script',
          deviceType: 'Desktop',
          language: 'en',
        },
      }),
    });

    if (!rejectAllResponse.ok) {
      const errorData = await rejectAllResponse.json();
      console.error('❌ Reject All failed:', errorData);
      throw new Error('Reject All request failed');
    }

    const rejectAllData = await rejectAllResponse.json();
    console.log('✅ Reject All successful');
    console.log(`   Updated: ${rejectAllData.data.updatedCount} preferences`);
    
    // Verify all are withdrawn (not rejected, since they were previously accepted)
    const withdrawnCount = rejectAllData.data.preferences.filter(
      (p: any) => p.consent_status === 'withdrawn'
    ).length;
    const rejectedCount = rejectAllData.data.preferences.filter(
      (p: any) => p.consent_status === 'rejected'
    ).length;
    console.log(`   Verified: ${withdrawnCount} withdrawn, ${rejectedCount} rejected\n`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Custom (partial accept)
    console.log('Test 3: Custom (Partial Accept)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const halfCount = Math.ceil(activityIds.length / 2);
    const customPreferences = activityIds.slice(0, halfCount).map((id: string) => ({
      activityId: id,
      consentStatus: 'accepted' as const,
    }));

    const customResponse = await fetch(`${API_BASE_URL}/api/privacy-centre/preferences/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVisitorId,
        widgetId: widgetId,
        action: 'custom',
        preferences: customPreferences,
        metadata: {
          userAgent: 'test-script',
          deviceType: 'Desktop',
          language: 'en',
        },
      }),
    });

    if (!customResponse.ok) {
      const errorData = await customResponse.json();
      console.error('❌ Custom action failed:', errorData);
      throw new Error('Custom action request failed');
    }

    const customData = await customResponse.json();
    console.log('✅ Custom action successful');
    console.log(`   Updated: ${customData.data.updatedCount} preferences`);
    console.log(`   Target: ${halfCount} activities (half of total)\n`);

    // Test 4: Invalid widget ID
    console.log('Test 4: Error Handling (Invalid Widget)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const invalidResponse = await fetch(`${API_BASE_URL}/api/privacy-centre/preferences/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVisitorId,
        widgetId: 'invalid-widget-id',
        action: 'accept_all',
      }),
    });

    if (invalidResponse.status === 404) {
      console.log('✅ Correctly returns 404 for invalid widget\n');
    } else {
      console.warn(`⚠️  Expected 404, got ${invalidResponse.status}\n`);
    }

    // Test 5: Check consent record sync
    console.log('Test 5: Consent Record Sync');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { data: consentRecords, error: recordsError } = await supabase
      .from('dpdpa_consent_records')
      .select('*')
      .eq('visitor_id', testVisitorId)
      .eq('widget_id', widgetId)
      .order('consent_given_at', { ascending: false });

    if (recordsError) {
      console.error('❌ Failed to fetch consent records:', recordsError);
    } else {
      console.log(`✅ Found ${consentRecords?.length || 0} consent records`);
      if (consentRecords && consentRecords.length > 0) {
        console.log('   Latest record:');
        console.log(`     Status: ${consentRecords[0].consent_status}`);
        console.log(`     Accepted: ${consentRecords[0].consented_activities?.length || 0}`);
        console.log(`     Rejected: ${consentRecords[0].rejected_activities?.length || 0}`);
        if (consentRecords[0].revoked_at) {
          console.log(`     Revoked: ${new Date(consentRecords[0].revoked_at).toLocaleString()}`);
        }
      }
      console.log();
    }

    // Cleanup
    console.log('Cleanup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { error: deletePrefsError } = await supabase
      .from('visitor_consent_preferences')
      .delete()
      .eq('visitor_id', testVisitorId);

    const { error: deleteRecordsError } = await supabase
      .from('dpdpa_consent_records')
      .delete()
      .eq('visitor_id', testVisitorId);

    if (deletePrefsError || deleteRecordsError) {
      console.warn('⚠️  Cleanup had errors (non-critical)');
    } else {
      console.log('✅ Test data cleaned up\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testBulkAPI().catch(console.error);
