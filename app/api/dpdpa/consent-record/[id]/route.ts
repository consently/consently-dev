import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePrivacyNoticeHTML, sanitizeHTML } from '@/lib/dpdpa-notice';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        console.log('[Consent Record Details API] Fetching record for ID:', id);

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[Consent Record Details API] Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!id) {
            console.error('[Consent Record Details API] No ID provided');
            return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
        }

        // First, get the user's widget IDs to verify ownership
        const { data: userWidgets, error: widgetsError } = await supabase
            .from('dpdpa_widget_configs')
            .select('widget_id, domain, dpo_email')
            .eq('user_id', user.id);

        if (widgetsError) {
            console.error('[Consent Record Details API] Error fetching user widgets:', widgetsError);
            return NextResponse.json({ 
                error: 'Failed to verify widget ownership',
                details: widgetsError.message 
            }, { status: 500 });
        }

        if (!userWidgets || userWidgets.length === 0) {
            console.error('[Consent Record Details API] User has no widgets');
            return NextResponse.json({ 
                error: 'No widgets found for user' 
            }, { status: 404 });
        }

        const widgetIds = userWidgets.map(w => w.widget_id);

        // Fetch the consent record
        // Note: id parameter is actually the visitor_id (Consent ID like CNST-XXXX-XXXX-XXXX)
        // Multiple records may exist for the same visitor_id, so we get the most recent one
        const { data: records, error: recordError } = await supabase
            .from('dpdpa_consent_records')
            .select('*')
            .eq('visitor_id', id)
            .in('widget_id', widgetIds)
            .order('consent_given_at', { ascending: false })
            .limit(1);

        console.log('[Consent Record Details API] Query result:', {
            recordsFound: records?.length || 0,
            error: recordError?.message,
            errorCode: recordError?.code,
            errorDetails: recordError?.details,
            widgetIdsChecked: widgetIds.length
        });

        if (recordError || !records || records.length === 0) {
            console.error('[Consent Record Details API] Record not found:', {
                id,
                error: recordError?.message,
                userId: user.id,
                widgetIds
            });
            return NextResponse.json({ 
                error: 'Record not found or access denied',
                details: recordError?.message 
            }, { status: 404 });
        }

        const record = records[0];
        
        // Get the widget domain and DPO email for this record
        const widgetInfo = userWidgets.find(w => w.widget_id === record.widget_id);
        const domain = widgetInfo?.domain || '';
        const dpoEmail = widgetInfo?.dpo_email || 'dpo@consently.in';

        // Lookup visitor email if not present in the record
        let visitorEmail = record.visitor_email;
        
        if (!visitorEmail || visitorEmail.trim() === '') {
            console.log('[Consent Record Details API] No email in record, attempting lookup...');
            
            // First, try to get email from visitor_consent_preferences
            const { data: preferences } = await supabase
                .from('visitor_consent_preferences')
                .select('visitor_email')
                .eq('visitor_id', record.visitor_id)
                .eq('widget_id', record.widget_id)
                .not('visitor_email', 'is', null)
                .limit(1)
                .maybeSingle();

            if (preferences?.visitor_email) {
                visitorEmail = preferences.visitor_email;
                console.log('[Consent Record Details API] Found email from preferences');
            } else if (record.visitor_email_hash) {
                // Second, lookup in email_verification_otps using the hash
                console.log('[Consent Record Details API] Looking up email from hash...');
                const { data: verifiedEmail } = await supabase
                    .from('email_verification_otps')
                    .select('email')
                    .eq('email_hash', record.visitor_email_hash)
                    .eq('verified', true)
                    .order('verified_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (verifiedEmail?.email) {
                    visitorEmail = verifiedEmail.email;
                    console.log('[Consent Record Details API] Found email from verification');
                }
            }
        }

        // Check if we have a stored snapshot of the privacy notice
        let privacyNoticeHTML = record.consent_details?.privacy_notice_snapshot;
        let isHistoricalSnapshot = !!privacyNoticeHTML;

        // If no snapshot, reconstruct it from current configuration
        if (!privacyNoticeHTML) {
            // Fetch current widget configuration and activities
            const { data: widgetConfig, error: configError } = await supabase
                .from('dpdpa_widget_configs')
                .select('selected_activities')
                .eq('widget_id', record.widget_id)
                .single();

            if (!configError && widgetConfig) {
                const selectedActivitiesIds = widgetConfig.selected_activities || [];

                // Fetch activities details
                const { data: activitiesRaw, error: activitiesError } = await supabase
                    .from('processing_activities')
                    .select(`
            id,
            activity_name,
            industry,
            activity_purposes(
              id,
              purpose_id,
              legal_basis,
              custom_description,
              purposes(
                id,
                purpose_name,
                description
              ),
              purpose_data_categories(
                id,
                category_name,
                retention_period
              )
            )
          `)
                    .in('id', selectedActivitiesIds)
                    .eq('is_active', true);

                if (!activitiesError && activitiesRaw) {
                    // Transform activities to match the format expected by generatePrivacyNoticeHTML
                    const activities = activitiesRaw.map((activity: any) => ({
                        id: activity.id,
                        activity_name: activity.activity_name,
                        industry: activity.industry,
                        purposes: (activity.activity_purposes || []).map((ap: any) => ({
                            id: ap.id,
                            purposeId: ap.purpose_id,
                            purposeName: ap.purposes?.purpose_name || 'Unknown Purpose',
                            legalBasis: ap.legal_basis,
                            customDescription: ap.custom_description,
                            dataCategories: (ap.purpose_data_categories || []).map((c: any) => ({
                                id: c.id,
                                categoryName: c.category_name,
                                retentionPeriod: c.retention_period,
                            })),
                        })),
                    }));

                    const generatedHTML = generatePrivacyNoticeHTML(activities, domain, dpoEmail);
                    privacyNoticeHTML = sanitizeHTML(generatedHTML);
                }
            }
        }

        // Return the enriched record
        console.log('[Consent Record Details API] Successfully returning record:', {
            recordId: record.id,
            visitorId: record.visitor_id,
            hasPrivacyNotice: !!privacyNoticeHTML
        });

        return NextResponse.json({
            data: {
                ...record,
                visitor_email: visitorEmail, // Use the looked up email
                privacyNoticeHTML,
                isHistoricalSnapshot,
            }
        });

    } catch (error) {
        console.error('[Consent Record Details API] Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
