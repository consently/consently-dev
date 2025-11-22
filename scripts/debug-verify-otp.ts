
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendPreferencesLinkedEmail } from '../lib/resend-email';

// Create Supabase client directly (bypassing server-side cookies)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const createServiceClient = () => createClient(supabaseUrl, supabaseServiceKey);

async function debugVerifyOTP() {
    console.log('🚀 Starting Verify OTP Debug Script');

    const supabase = await createServiceClient();

    // 1. Get a valid widget ID
    const { data: widgets, error: widgetError } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id')
        .limit(1);

    if (widgetError || !widgets || widgets.length === 0) {
        console.error('❌ Failed to fetch a valid widget ID:', widgetError);
        return;
    }

    const widgetId = widgets[0].widget_id;
    console.log(`✅ Using Widget ID: ${widgetId}`);

    // 2. Generate test data
    const visitorId = `debug-visitor-${Date.now()}`;
    const email = `debug-${Date.now()}@example.com`;
    const otpCode = '123456';
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

    console.log('📝 Test Data:', { visitorId, email, otpCode, emailHash });

    // 3. Create a dummy OTP record
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins from now

    const { data: otpRecord, error: insertError } = await supabase
        .from('email_verification_otps')
        .insert({
            email,
            email_hash: emailHash,
            otp_code: otpCode,
            visitor_id: visitorId,
            widget_id: widgetId,
            expires_at: expiresAt,
            verified: false,
            attempts: 0,
        })
        .select()
        .single();

    if (insertError) {
        console.error('❌ Failed to insert dummy OTP record:', insertError);
        return;
    }

    console.log(`✅ Created dummy OTP record: ${otpRecord.id}`);

    // 4. Simulate Verify OTP Logic
    console.log('🔄 Simulating Verify OTP Logic...');

    try {
        // Find the most recent unverified OTP
        const { data: otpRecords, error: fetchError } = await supabase
            .from('email_verification_otps')
            .select('*')
            .eq('email_hash', emailHash)
            .eq('visitor_id', visitorId)
            .eq('widget_id', widgetId)
            .eq('verified', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('❌ Error fetching OTP:', fetchError);
            throw new Error('Failed to verify OTP');
        }

        if (!otpRecords || otpRecords.length === 0) {
            console.error('❌ Invalid or expired OTP (Not found)');
            return;
        }

        const record = otpRecords[0];
        console.log('✅ Found OTP record:', record.id);

        // Check attempts
        if (record.attempts >= 3) {
            console.error('❌ Max attempts exceeded');
            return;
        }

        // Verify code
        if (record.otp_code !== otpCode) {
            console.error('❌ Invalid OTP code');
            // Increment attempts logic here...
            return;
        }

        console.log('✅ OTP Code matches');

        // Mark as verified
        const { error: updateError } = await supabase
            .from('email_verification_otps')
            .update({
                verified: true,
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

        if (updateError) {
            console.error('❌ Error marking OTP as verified:', updateError);
            throw new Error('Failed to verify OTP');
        }

        console.log('✅ OTP marked as verified');


        const { error: eventError } = await supabase.from('email_verification_events').insert({
            widget_id: widgetId,
            visitor_id: visitorId,
            event_type: 'otp_verified',
            email_hash: emailHash,
            metadata: {
                otp_id: record.id,
                attempts: record.attempts + 1,
                time_to_verify_seconds: 1
            },
        });

        if (eventError) {
            console.error('⚠️ Failed to track event:', eventError);
        }

        // Update preferences (Link logic)
        // First create a dummy preference to link
        await supabase.from('visitor_consent_preferences').insert({
            visitor_id: visitorId,
            widget_id: widgetId,
            preferences: { analytics: true },
            ip_address: '127.0.0.1',
            user_agent: 'debug-script'
        });

        const { data: existingPreferences, error: prefsError } = await supabase
            .from('visitor_consent_preferences')
            .select('*')
            .eq('visitor_id', visitorId)
            .eq('widget_id', widgetId);

        if (prefsError) {
            console.error('❌ Error fetching preferences:', prefsError);
        }

        if (existingPreferences && existingPreferences.length > 0) {
            console.log(`✅ Found ${existingPreferences.length} preferences to link`);
            const { error: linkError } = await supabase
                .from('visitor_consent_preferences')
                .update({
                    visitor_email_hash: emailHash,
                    updated_at: new Date().toISOString()
                })
                .eq('visitor_id', visitorId)
                .eq('widget_id', widgetId);

            if (linkError) {
                console.error('❌ Error linking preferences:', linkError);
                throw new Error('Failed to link preferences to email');
            }
            console.log('✅ Preferences linked successfully');
        } else {
            console.log('⚠️ No preferences found to link');
        }

        // Count devices
        let uniqueDevices = 1;
        try {
            const { data: linkedDevices, error: deviceCountError } = await supabase
                .from('visitor_consent_preferences')
                .select('visitor_id')
                .eq('visitor_email_hash', emailHash)
                .eq('widget_id', widgetId);

            if (deviceCountError) {
                console.warn('⚠️ Error counting linked devices:', deviceCountError);
            } else if (linkedDevices) {
                uniqueDevices = new Set(linkedDevices.map(d => d.visitor_id)).size;
                console.log(`✅ Counted ${uniqueDevices} unique devices`);
            }
        } catch (countError) {
            console.warn('⚠️ Failed to count linked devices:', countError);
        }

        // Send confirmation email
        console.log('📧 Sending confirmation email...');
        try {
            // We mock the email sending to avoid actual emails if needed, but here we test the function
            // Note: This requires RESEND_API_KEY to be set in environment
            if (!process.env.RESEND_API_KEY) {
                console.warn('⚠️ RESEND_API_KEY not set, skipping email send');
            } else {
                await sendPreferencesLinkedEmail(email, uniqueDevices);
                console.log(`✅ Confirmation email sent to ${email}`);
            }
        } catch (emailError: any) {
            console.error('❌ Failed to send confirmation email:', emailError?.message || emailError);
            // This is where the original code might be failing if it crashes
        }

        console.log('🎉 Verify OTP Flow Completed Successfully');

    } catch (error) {
        console.error('🔥 CRITICAL ERROR in Verify OTP Flow:', error);
    }
}

debugVerifyOTP().catch(console.error);
