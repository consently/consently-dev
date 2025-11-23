#!/usr/bin/env tsx
/**
 * Test script to diagnose preference save errors
 * Usage: npx tsx scripts/test-preference-save.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPreferenceSave() {
  console.log('🔍 Testing Preference Save...\n');

  // Step 1: Get a valid widget and activity
  console.log('Step 1: Fetching valid widget and activities...');
  const { data: widgets, error: widgetError } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, selected_activities')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (widgetError || !widgets) {
    console.error('❌ Failed to fetch widget:', widgetError);
    return;
  }

  console.log('✅ Found widget:', widgets.widget_id);
  
  if (!widgets.selected_activities || widgets.selected_activities.length === 0) {
    console.error('❌ Widget has no selected activities');
    return;
  }

  const activityId = widgets.selected_activities[0];
  console.log('✅ Using activity:', activityId);

  // Step 2: Test visitor ID
  const testVisitorId = `test_visitor_${Date.now()}`;
  console.log('✅ Test visitor ID:', testVisitorId);

  // Step 3: Prepare test data
  const testData = {
    visitor_id: testVisitorId,
    widget_id: widgets.widget_id,
    activity_id: activityId,
    consent_status: 'accepted',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Test)',
    device_type: 'Desktop', // Valid: Desktop, Mobile, Tablet, Unknown
    language: 'en',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    consent_version: '1.0',
    consent_given_at: new Date().toISOString(),
  };

  console.log('\n📝 Test data prepared:');
  console.log(JSON.stringify(testData, null, 2));

  // Step 4: Try INSERT
  console.log('\n🧪 Testing INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('visitor_consent_preferences')
    .insert(testData)
    .select();

  if (insertError) {
    console.error('❌ INSERT failed:');
    console.error('Error code:', insertError.code);
    console.error('Error message:', insertError.message);
    console.error('Error details:', insertError.details);
    console.error('Error hint:', insertError.hint);
    console.error('Full error:', JSON.stringify(insertError, null, 2));
    return;
  }

  console.log('✅ INSERT successful!');
  console.log('Inserted ID:', insertData[0]?.id);

  // Step 5: Try UPDATE
  console.log('\n🧪 Testing UPDATE...');
  const updateData = {
    consent_status: 'withdrawn',
    last_updated: new Date().toISOString(),
  };

  const { data: updateResult, error: updateError } = await supabase
    .from('visitor_consent_preferences')
    .update(updateData)
    .eq('id', insertData[0].id)
    .select();

  if (updateError) {
    console.error('❌ UPDATE failed:');
    console.error('Error code:', updateError.code);
    console.error('Error message:', updateError.message);
    console.error('Error details:', updateError.details);
    console.error('Error hint:', updateError.hint);
    console.error('Full error:', JSON.stringify(updateError, null, 2));
    return;
  }

  console.log('✅ UPDATE successful!');
  console.log('New status:', updateResult[0]?.consent_status);

  // Step 6: Cleanup
  console.log('\n🧹 Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('visitor_consent_preferences')
    .delete()
    .eq('id', insertData[0].id);

  if (deleteError) {
    console.error('⚠️  Cleanup failed (not critical):', deleteError.message);
  } else {
    console.log('✅ Cleanup successful!');
  }

  console.log('\n✅ All tests passed! The database is working correctly.');
  console.log('\n💡 If the API is still failing, check:');
  console.log('   1. Browser console for detailed error messages');
  console.log('   2. Server logs (npm run dev output)');
  console.log('   3. Network tab -> Response for error details');
}

// Run the test
testPreferenceSave().catch(console.error);



