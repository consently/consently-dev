import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConsentAPI() {
  const widgetId = 'dpdpa_mhnhpimc_atq70ak';
  const visitorId = 'test_visitor_' + Date.now();
  
  console.log('Testing consent record creation...\n');
  console.log('Widget ID:', widgetId);
  console.log('Visitor ID:', visitorId);
  
  // 1. Check if widget exists and is active
  console.log('\n1. Checking widget configuration...');
  const { data: widgetConfig, error: widgetError } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, consent_duration, selected_activities, user_id')
    .eq('widget_id', widgetId)
    .eq('is_active', true)
    .single();
  
  if (widgetError) {
    console.error('❌ Widget error:', widgetError);
    return;
  }
  
  if (!widgetConfig) {
    console.error('❌ Widget not found or not active');
    return;
  }
  
  console.log('✅ Widget found:', widgetConfig);
  
  // 2. Try to create a consent record
  console.log('\n2. Creating consent record...');
  
  const consentData = {
    widget_id: widgetId,
    visitor_id: visitorId,
    visitor_email_hash: null,
    consent_status: 'accepted',
    accepted_activities: widgetConfig.selected_activities || [],
    rejected_activities: [],
    activity_consents: {},
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 Test',
    device_type: 'Desktop',
    browser: 'Chrome',
    os: 'macOS',
    country: 'India',
    language: 'en',
    referrer: null,
    consent_timestamp: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    consent_version: '1.0',
    widget_version: '1.0.0'
  };
  
  console.log('Consent data:', JSON.stringify(consentData, null, 2));
  
  const { data: consentRecord, error: consentError } = await supabase
    .from('dpdpa_consent_records')
    .insert(consentData)
    .select()
    .single();
  
  if (consentError) {
    console.error('❌ Consent record error:', consentError);
    console.error('Error details:', JSON.stringify(consentError, null, 2));
    return;
  }
  
  console.log('✅ Consent record created:', consentRecord.id);
  
  // 3. Verify we can read it back
  console.log('\n3. Verifying consent record...');
  const { data: verifyRecord, error: verifyError } = await supabase
    .from('dpdpa_consent_records')
    .select('*')
    .eq('id', consentRecord.id)
    .single();
  
  if (verifyError) {
    console.error('❌ Verification error:', verifyError);
    return;
  }
  
  console.log('✅ Verification successful');
  console.log('Record:', JSON.stringify(verifyRecord, null, 2));
  
  // 4. Clean up test data
  console.log('\n4. Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('dpdpa_consent_records')
    .delete()
    .eq('id', consentRecord.id);
  
  if (deleteError) {
    console.error('❌ Delete error:', deleteError);
  } else {
    console.log('✅ Test data cleaned up');
  }
  
  console.log('\n✅ All tests passed! The API should work correctly.');
}

testConsentAPI().catch(console.error);
