import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('Starting debug script...');

  // 1. Get a widget
  const { data: widget, error: widgetError } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, selected_activities')
    .limit(1)
    .single();

  if (widgetError || !widget) {
    console.error('Error fetching widget:', widgetError);
    return;
  }

  console.log('Found widget:', widget.widget_id);

  // 2. Get an activity
  const activityId = widget.selected_activities?.[0];
  if (!activityId) {
    console.error('No activities in widget');
    return;
  }
  console.log('Using activity:', activityId);

  // 3. Try to insert/update preference
  const visitorId = 'debug-visitor-' + Date.now();
  const pref = {
    visitor_id: visitorId,
    widget_id: widget.widget_id,
    activity_id: activityId,
    consent_status: 'accepted',
    device_type: 'Desktop', // Valid
    consent_version: '1.0',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    consent_given_at: new Date().toISOString(),
  };

  console.log('Attempting insert with:', pref);

  const { data, error } = await supabase
    .from('visitor_consent_preferences')
    .insert(pref)
    .select();

  if (error) {
    console.error('Insert failed:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert successful:', data);
  }
  
  // 4. Try with invalid device type to see the error format
  const invalidPref = { ...pref, visitor_id: visitorId + '-invalid', device_type: 'SmartFridge' };
  console.log('Attempting invalid insert with:', invalidPref);
   const { error: invalidError } = await supabase
    .from('visitor_consent_preferences')
    .insert(invalidPref);
    
    if (invalidError) {
        console.log('Invalid insert failed as expected:', JSON.stringify(invalidError, null, 2));
    } else {
        console.log('Invalid insert succeeded (unexpected!)');
    }

}

main();
