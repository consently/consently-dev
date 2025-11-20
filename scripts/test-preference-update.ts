/**
 * Test script for verifying the preference centre update fix
 * 
 * This script tests the preference update API endpoint with various scenarios:
 * - Valid preference updates
 * - Invalid activity IDs
 * - Withdrawal of consents
 * - Multiple activities
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testPreferenceUpdate() {
  console.log('🧪 Testing Preference Centre Update Fix\n');
  console.log('API Base:', API_BASE);
  console.log('='.repeat(60));

  // Get Supabase credentials for setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Get a valid widget and activity for testing
  console.log('\n📋 Step 1: Finding test data...');
  
  const { data: widget } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, selected_activities, name, domain')
    .limit(1)
    .single();

  if (!widget || !widget.selected_activities || widget.selected_activities.length === 0) {
    console.error('❌ No widget with activities found. Please create a widget first.');
    process.exit(1);
  }

  console.log('✅ Found test widget:', {
    widgetId: widget.widget_id,
    name: widget.name,
    activityCount: widget.selected_activities.length
  });

  const testActivityIds = widget.selected_activities.slice(0, 2); // Test with first 2 activities
  const testVisitorId = `test_visitor_${Date.now()}`;

  // Step 2: Test successful preference update (accept)
  console.log('\n📋 Step 2: Testing successful preference update (accept)...');
  
  const acceptResponse = await fetch(`${API_BASE}/api/privacy-centre/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: testVisitorId,
      widgetId: widget.widget_id,
      preferences: testActivityIds.map((id: string) => ({
        activityId: id,
        consentStatus: 'accepted'
      })),
      metadata: {
        userAgent: 'Test Script',
        deviceType: 'Desktop',
        language: 'en'
      }
    })
  });

  const acceptData = await acceptResponse.json();
  
  if (acceptResponse.ok) {
    console.log('✅ Accept preferences successful:', {
      status: acceptResponse.status,
      updatedCount: acceptData.data?.updatedCount,
      results: acceptData.data?.results
    });
  } else {
    console.error('❌ Accept preferences failed:', {
      status: acceptResponse.status,
      error: acceptData.error,
      details: acceptData.details
    });
  }

  // Step 3: Test preference withdrawal
  console.log('\n📋 Step 3: Testing preference withdrawal...');
  
  const withdrawResponse = await fetch(`${API_BASE}/api/privacy-centre/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: testVisitorId,
      widgetId: widget.widget_id,
      preferences: [{
        activityId: testActivityIds[0],
        consentStatus: 'withdrawn'
      }],
      metadata: {
        userAgent: 'Test Script',
        deviceType: 'Desktop',
        language: 'en'
      }
    })
  });

  const withdrawData = await withdrawResponse.json();
  
  if (withdrawResponse.ok) {
    console.log('✅ Withdraw preference successful:', {
      status: withdrawResponse.status,
      updatedCount: withdrawData.data?.updatedCount
    });
  } else {
    console.error('❌ Withdraw preference failed:', {
      status: withdrawResponse.status,
      error: withdrawData.error,
      details: withdrawData.details
    });
  }

  // Step 4: Test with invalid activity ID
  console.log('\n📋 Step 4: Testing with invalid activity ID...');
  
  const invalidResponse = await fetch(`${API_BASE}/api/privacy-centre/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: testVisitorId,
      widgetId: widget.widget_id,
      preferences: [{
        activityId: '00000000-0000-0000-0000-000000000000', // Invalid UUID
        consentStatus: 'accepted'
      }],
      metadata: {
        userAgent: 'Test Script',
        deviceType: 'Desktop',
        language: 'en'
      }
    })
  });

  const invalidData = await invalidResponse.json();
  
  if (invalidResponse.status === 400) {
    console.log('✅ Invalid activity ID correctly rejected:', {
      status: invalidResponse.status,
      error: invalidData.error
    });
  } else {
    console.warn('⚠️  Expected 400 error, got:', {
      status: invalidResponse.status,
      data: invalidData
    });
  }

  // Step 5: Verify data in database
  console.log('\n📋 Step 5: Verifying data in database...');
  
  const { data: dbPreferences, error: dbError } = await supabase
    .from('visitor_consent_preferences')
    .select('*')
    .eq('visitor_id', testVisitorId)
    .eq('widget_id', widget.widget_id);

  if (dbError) {
    console.error('❌ Database query failed:', dbError);
  } else {
    console.log('✅ Database records:', {
      count: dbPreferences?.length || 0,
      records: dbPreferences?.map(p => ({
        activityId: p.activity_id,
        status: p.consent_status,
        lastUpdated: p.last_updated
      }))
    });
  }

  // Step 6: Clean up test data
  console.log('\n📋 Step 6: Cleaning up test data...');
  
  const { error: deleteError } = await supabase
    .from('visitor_consent_preferences')
    .delete()
    .eq('visitor_id', testVisitorId);

  if (deleteError) {
    console.error('❌ Cleanup failed:', deleteError);
  } else {
    console.log('✅ Test data cleaned up');
  }

  // Also clean up any test consent records
  await supabase
    .from('dpdpa_consent_records')
    .delete()
    .eq('visitor_id', testVisitorId);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
}

// Run the test
testPreferenceUpdate().catch(error => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});

