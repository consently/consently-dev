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
    console.log('Starting upsert test script...');

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

    const visitorId = 'upsert-test-' + Date.now();

    // 3. Initial Insert (using upsert)
    const initialData = {
        visitor_id: visitorId,
        widget_id: widget.widget_id,
        activity_id: activityId,
        consent_status: 'accepted',
        device_type: 'Desktop',
        consent_version: '1.0',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        last_updated: new Date().toISOString(),
        // consent_given_at omitted, should default to now()
    };

    console.log('1. Initial upsert (insert)...');
    const { data: insertData, error: insertError } = await supabase
        .from('visitor_consent_preferences')
        .upsert(initialData, { onConflict: 'visitor_id, widget_id, activity_id' })
        .select()
        .single();

    if (insertError) {
        console.error('Initial upsert failed:', insertError);
        return;
    }
    console.log('Initial upsert success. ID:', insertData.id);
    console.log('consent_given_at:', insertData.consent_given_at);

    const firstConsentGivenAt = insertData.consent_given_at;

    // 4. Update via Upsert
    const updateData = {
        ...initialData,
        consent_status: 'rejected',
        last_updated: new Date().toISOString(),
        // consent_given_at omitted, should remain unchanged
    };

    console.log('2. Second upsert (update)...');
    const { data: updateResult, error: updateError } = await supabase
        .from('visitor_consent_preferences')
        .upsert(updateData, { onConflict: 'visitor_id, widget_id, activity_id' })
        .select()
        .single();

    if (updateError) {
        console.error('Second upsert failed:', updateError);
        return;
    }
    console.log('Second upsert success. ID:', updateResult.id);
    console.log('consent_given_at:', updateResult.consent_given_at);
    console.log('consent_status:', updateResult.consent_status);

    if (updateResult.id !== insertData.id) {
        console.error('FAIL: ID changed (row was replaced instead of updated?)');
    } else if (updateResult.consent_status !== 'rejected') {
        console.error('FAIL: Status not updated');
    } else if (updateResult.consent_given_at !== firstConsentGivenAt) {
        console.error('FAIL: consent_given_at changed!', updateResult.consent_given_at, 'vs', firstConsentGivenAt);
    } else {
        console.log('PASS: Upsert worked as expected (updated existing row, preserved consent_given_at)');
    }
}

main();
