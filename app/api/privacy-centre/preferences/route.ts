import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateVerifiedConsentId, generateUnverifiedConsentId } from '@/lib/consent-id-utils';
import crypto from 'crypto';

/**
 * Privacy Centre Preferences API
 * Allows visitors to view and manage their consent preferences
 * Public endpoint - no authentication required (uses visitor_id)
 * 
 * NOTE: Uses service role client to bypass RLS - this is a public endpoint
 * that allows anonymous visitors to view and manage their preferences.
 */

interface PreferenceUpdateRequest {
  visitorId: string;
  widgetId: string;
  preferences: Array<{
    activityId: string;
    consentStatus: 'accepted' | 'rejected' | 'withdrawn';
  }>;
  visitorEmail?: string; // Optional: for cross-device consent management
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    language?: string;
  };
}

// Helper to hash email for privacy
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// GET - Fetch visitor's current consent preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const visitorId = searchParams.get('visitorId');
    const widgetId = searchParams.get('widgetId');

    if (!visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'visitorId and widgetId are required' },
        { status: 400 }
      );
    }

    // Fetch widget configuration to get selected activities
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('selected_activities, name, domain')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    const selectedActivities = widgetConfig.selected_activities || [];

    if (selectedActivities.length === 0) {
      return NextResponse.json({
        data: {
          widgetName: widgetConfig.name,
          domain: widgetConfig.domain,
          activities: [],
        },
      });
    }

    // Fetch activities with their purposes and data categories
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select(`
        id,
        activity_name,
        industry,
        activity_purposes(
          id,
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
        ),
        data_sources(source_name),
        data_recipients(recipient_name)
      `)
      .in('id', selectedActivities)
      .eq('is_active', true);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Fetch visitor's current preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    if (preferencesError) {
      console.error('Error fetching preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Map preferences to activities
    const preferencesMap = new Map(
      preferences?.map((p) => [p.activity_id, p]) || []
    );

    // Build response with activities and their consent status
    const activitiesWithConsent = (activities || []).map((activity: any) => {
      const preference = preferencesMap.get(activity.id);

      return {
        id: activity.id,
        name: activity.activity_name,
        industry: activity.industry,
        purposes: (activity.activity_purposes || []).map((ap: any) => ({
          id: ap.id,
          purposeName: ap.purposes?.purpose_name || '',
          description: ap.purposes?.description || ap.custom_description || '',
          legalBasis: ap.legal_basis,
          dataCategories: (ap.purpose_data_categories || []).map((dc: any) => ({
            name: dc.category_name,
            retentionPeriod: dc.retention_period,
          })),
        })),
        dataSources: (activity.data_sources || []).map((ds: any) => ds.source_name),
        dataRecipients: (activity.data_recipients || []).map((dr: any) => dr.recipient_name),
        consentStatus: preference?.consent_status || 'rejected',
        consentGivenAt: preference?.consent_given_at || null,
        lastUpdated: preference?.last_updated || null,
        expiresAt: preference?.expires_at || null,
      };
    });

    // Extract visitor email if available (check both preference records and consent records)
    let visitorEmail = preferences?.find(p => p.visitor_email)?.visitor_email || null;

    // If not found in preferences, check consent records as fallback
    if (!visitorEmail) {
      const { data: consentRecords } = await supabase
        .from('dpdpa_consent_records')
        .select('visitor_email')
        .eq('visitor_id', visitorId)
        .eq('widget_id', widgetId)
        .not('visitor_email', 'is', null)
        .order('consent_given_at', { ascending: false })
        .limit(1)
        .single();

      visitorEmail = consentRecords?.visitor_email || null;
    }

    return NextResponse.json({
      data: {
        widgetName: widgetConfig.name,
        domain: widgetConfig.domain,
        visitorEmail,
        activities: activitiesWithConsent,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/privacy-centre/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update visitor's consent preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body: PreferenceUpdateRequest = await request.json();

    const { visitorId, widgetId, preferences, visitorEmail, metadata } = body;

    if (!visitorId || !widgetId || !preferences || preferences.length === 0) {
      return NextResponse.json(
        { error: 'visitorId, widgetId, and preferences array are required' },
        { status: 400 }
      );
    }

    // Hash visitor email if provided (for cross-device consent management)
    const visitorEmailHash = visitorEmail ? hashEmail(visitorEmail) : null;

    // Fetch widget configuration for consent duration
    const { data: widgetConfig } = await supabase
      .from('dpdpa_widget_configs')
      .select('consent_duration')
      .eq('widget_id', widgetId)
      .single();

    const consentDuration = widgetConfig?.consent_duration || 365; // days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);

    // Verify all activity IDs exist before attempting update
    const activityIds = preferences.map(p => p.activityId);
    const { data: existingActivities, error: activityCheckError } = await supabase
      .from('processing_activities')
      .select('id')
      .in('id', activityIds);

    if (activityCheckError) {
      console.error('[Preference Centre] Error checking activities:', activityCheckError);
      return NextResponse.json(
        { error: 'Failed to validate activities' },
        { status: 500 }
      );
    }

    const validActivityIds = new Set((existingActivities || []).map((a: any) => a.id));
    const invalidActivities = activityIds.filter(id => !validActivityIds.has(id));

    if (invalidActivities.length > 0) {
      console.error('[Preference Centre] Invalid activity IDs:', invalidActivities);
      return NextResponse.json(
        {
          error: 'Invalid activity IDs provided',
          details: `Activities not found: ${invalidActivities.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Helper function to normalize device_type to match database constraint
    // Database constraint: CHECK (device_type IN ('Desktop', 'Mobile', 'Tablet', 'Unknown'))
    const normalizeDeviceType = (deviceType?: string): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' => {
      if (!deviceType || typeof deviceType !== 'string') return 'Unknown';
      const normalized = deviceType.toLowerCase().trim();
      if (normalized.includes('mobile') || normalized.includes('phone')) return 'Mobile';
      if (normalized.includes('tablet')) return 'Tablet';
      if (normalized.includes('desktop') || normalized.includes('pc') || normalized.includes('laptop')) return 'Desktop';
      return 'Unknown';
    };

    // Update or insert preferences - do one at a time to better handle errors
    const results = [];
    const errors = [];
    const now = new Date().toISOString();

    for (const pref of preferences) {
      const normalizedDeviceType = normalizeDeviceType(metadata?.deviceType);

      const upsertData = {
        visitor_id: visitorId,
        widget_id: widgetId,
        activity_id: pref.activityId,
        consent_status: pref.consentStatus,
        visitor_email_hash: visitorEmailHash,
        ip_address: metadata?.ipAddress || null,
        user_agent: metadata?.userAgent || null,
        device_type: normalizedDeviceType,
        language: metadata?.language || 'en',
        expires_at: expiresAt.toISOString(),
        consent_version: '1.0',
        last_updated: now,
        // consent_given_at is omitted so it uses default (now) on insert, and is unchanged on update
      };

      // Validate device_type before upsert
      if (!['Desktop', 'Mobile', 'Tablet', 'Unknown'].includes(normalizedDeviceType)) {
        const error = {
          code: 'INVALID_DEVICE_TYPE',
          message: `Invalid device_type: ${normalizedDeviceType}. Must be one of: Desktop, Mobile, Tablet, Unknown`,
          details: `Received: ${normalizedDeviceType}, Original: ${metadata?.deviceType}`,
          hint: 'Device type must match database constraint'
        };
        console.error('[Preference Centre] Invalid device_type before upsert:', error);
        errors.push({ activityId: pref.activityId, error });
      } else {
        const { error: upsertError } = await supabase
          .from('visitor_consent_preferences')
          .upsert(upsertData, {
            onConflict: 'visitor_id, widget_id, activity_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.error('[Preference Centre] Upsert error for activity', pref.activityId, ':', JSON.stringify(upsertError, null, 2));
          console.error('[Preference Centre] Upsert error details:', {
            activityId: pref.activityId,
            errorCode: upsertError.code,
            errorMessage: upsertError.message,
            errorDetails: upsertError.details,
            errorHint: upsertError.hint,
            visitor_id: visitorId,
            widget_id: widgetId,
            consent_status: pref.consentStatus,
            device_type: normalizedDeviceType,
            upsertData: {
              ...upsertData,
              visitor_id: upsertData.visitor_id?.substring(0, 8) + '...',
            },
          });
          errors.push({ activityId: pref.activityId, error: upsertError });
        } else {
          console.log('[Preference Centre] Successfully upserted preference for activity', pref.activityId);
          results.push({ activityId: pref.activityId, action: 'upserted' });
        }
      }
    }

    if (errors.length > 0) {
      console.error('[Preference Centre] Errors updating preferences:', JSON.stringify(errors, null, 2));
      console.error('[Preference Centre] Request details:', {
        visitorId,
        widgetId,
        preferencesCount: preferences.length,
        deviceType: metadata?.deviceType,
        normalizedDeviceType: normalizeDeviceType(metadata?.deviceType)
      });
      // Do NOT fail the whole request for partial failures
      // Use 207 Multi-Status to indicate partial success while returning details
      return NextResponse.json(
        {
          error: 'Failed to update some preferences',
          details: errors.map(e => ({
            activityId: e.activityId,
            message: e.error.message,
            code: e.error.code,
            details: e.error.details,
            hint: e.error.hint
          })),
          partialSuccess: results.length > 0,
          successCount: results.length,
          errorCount: errors.length
        },
        { status: 207 }
      );
    }

    console.log('[Preference Centre] Successfully updated preferences:', {
      count: results.length,
      visitorId,
      widgetId,
      results
    });

    // MANUAL SYNC: Create consent record for preference updates
    // This ensures dpdpa_consent_records stays in sync with visitor_consent_preferences
    try {
      // Separate activities by consent status
      const acceptedActivities = preferences
        .filter((p) => p.consentStatus === 'accepted')
        .map((p) => p.activityId);
      const rejectedActivities = preferences
        .filter((p) => p.consentStatus === 'rejected')
        .map((p) => p.activityId);
      const withdrawnActivities = preferences
        .filter((p) => p.consentStatus === 'withdrawn')
        .map((p) => p.activityId);

      // Only create consent record if there are activities
      if (acceptedActivities.length > 0 || rejectedActivities.length > 0 || withdrawnActivities.length > 0) {
        // Determine consent status
        // If ALL activities are withdrawn, status is 'revoked'
        const totalActivities = preferences.length;
        const allWithdrawn = withdrawnActivities.length === totalActivities && acceptedActivities.length === 0 && rejectedActivities.length === 0;

        let consentStatus: 'accepted' | 'rejected' | 'partial' | 'revoked';
        if (allWithdrawn) {
          consentStatus = 'revoked';
        } else if (acceptedActivities.length > 0 && rejectedActivities.length === 0 && withdrawnActivities.length === 0) {
          consentStatus = 'accepted';
        } else if ((rejectedActivities.length > 0 || withdrawnActivities.length > 0) && acceptedActivities.length === 0) {
          consentStatus = 'rejected';
        } else {
          consentStatus = 'partial';
        }

        // Include withdrawn activities in rejected_activities array for database constraint
        const allRejectedActivities = [...rejectedActivities, ...withdrawnActivities];

        // Generate consent_id with different patterns for verified vs unverified emails
        // Format for verified emails: ${widgetId}_${emailHash16}_${timestamp}
        // Format for unverified: ${widgetId}_${visitorId}_${timestamp}_${randomSuffix}
        const timestamp = Date.now();
        let consentId: string;

        if (visitorEmailHash) {
          // Deterministic pattern for verified emails using email hash prefix
          consentId = generateVerifiedConsentId(widgetId, visitorEmailHash, timestamp);
        } else {
          // Random pattern for unverified/anonymous visitors
          consentId = generateUnverifiedConsentId(widgetId, visitorId, timestamp);
        }

        // Build consent details
        const consentDetails = {
          activityConsents: {},
          metadata: {
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            deviceType: metadata?.deviceType,
            language: metadata?.language,
            source: 'preference_centre'
          }
        };

        // Create consent record
        const normalizedDeviceTypeForConsent = normalizeDeviceType(metadata?.deviceType);
        const { error: consentRecordError } = await supabase
          .from('dpdpa_consent_records')
          .insert({
            widget_id: widgetId,
            visitor_id: visitorId,
            consent_id: consentId,
            consent_status: consentStatus,
            consented_activities: acceptedActivities,
            rejected_activities: allRejectedActivities, // Includes both rejected and withdrawn
            consent_details: consentDetails,
            visitor_email_hash: visitorEmailHash,
            revoked_at: allWithdrawn ? new Date().toISOString() : null, // Set revoked_at timestamp if all withdrawn
            revocation_reason: allWithdrawn ? 'User withdrew all consent via preference centre' : null,
            ip_address: metadata?.ipAddress || null,
            user_agent: metadata?.userAgent || null,
            device_type: normalizedDeviceTypeForConsent,
            language: metadata?.language || 'en',
            consent_given_at: new Date().toISOString(),
            consent_expires_at: expiresAt.toISOString(),
            privacy_notice_version: '3.0'
          });

        if (consentRecordError) {
          console.error('[Preference Centre] Error creating consent record:', JSON.stringify(consentRecordError, null, 2));
          console.error('[Preference Centre] Consent record data:', {
            widget_id: widgetId,
            visitor_id: visitorId,
            consent_status: consentStatus,
            device_type: normalizedDeviceTypeForConsent,
            consented_activities_count: acceptedActivities.length,
            rejected_activities_count: allRejectedActivities.length,
            error_code: consentRecordError.code,
            error_message: consentRecordError.message,
            error_details: consentRecordError.details,
            error_hint: consentRecordError.hint,
          });
          // Don't fail the request - preferences were already updated
          // Log the error but continue
        } else {
          console.log('[Preference Centre] Successfully synced preferences to consent record');
        }
      }
    } catch (syncError: any) {
      console.error('[Preference Centre] Error syncing to consent records:', syncError);
      console.error('[Preference Centre] Sync error details:', {
        message: syncError?.message,
        stack: syncError?.stack,
        name: syncError?.name,
      });
      // Don't fail the request - preferences were already updated
    }

    // Note: consent_history is automatically created by database trigger

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        updatedCount: results.length,
        expiresAt: expiresAt.toISOString(),
        results: results,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/privacy-centre/preferences:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw all consents for a visitor
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const visitorId = searchParams.get('visitorId');
    const widgetId = searchParams.get('widgetId');

    if (!visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'visitorId and widgetId are required' },
        { status: 400 }
      );
    }

    // Fetch widget configuration for consent duration
    const { data: widgetConfig } = await supabase
      .from('dpdpa_widget_configs')
      .select('consent_duration')
      .eq('widget_id', widgetId)
      .single();

    const consentDuration = widgetConfig?.consent_duration || 365; // days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);

    // Update all preferences to 'withdrawn'
    const { error: withdrawError } = await supabase
      .from('visitor_consent_preferences')
      .update({
        consent_status: 'withdrawn',
        last_updated: new Date().toISOString(),
      })
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    if (withdrawError) {
      console.error('Error withdrawing consents:', withdrawError);
      return NextResponse.json(
        { error: 'Failed to withdraw consents' },
        { status: 500 }
      );
    }

    // Create a consent record to track this full revocation
    try {
      // Generate consent_id (no email hash available in DELETE, use random pattern)
      const consentId = generateUnverifiedConsentId(widgetId, visitorId);

      // Create consent record with revoked status
      const { error: consentRecordError } = await supabase
        .from('dpdpa_consent_records')
        .insert({
          widget_id: widgetId,
          visitor_id: visitorId,
          consent_id: consentId,
          consent_status: 'revoked',
          consented_activities: [],
          rejected_activities: [],
          consent_details: {
            activityConsents: {},
            metadata: {
              source: 'preference_centre_delete'
            }
          },
          revoked_at: new Date().toISOString(),
          revocation_reason: 'User withdrew all consent via preference centre (DELETE)',
          consent_given_at: new Date().toISOString(),
          consent_expires_at: expiresAt.toISOString(),
          privacy_notice_version: '3.0'
        });

      if (consentRecordError) {
        console.error('[Preference Centre DELETE] Error creating revoked consent record:', consentRecordError);
        // Don't fail the request - preferences were already updated
      } else {
        console.log('[Preference Centre DELETE] Successfully created revoked consent record');
      }
    } catch (syncError) {
      console.error('[Preference Centre DELETE] Error creating consent record:', syncError);
      // Don't fail the request - preferences were already updated
    }

    return NextResponse.json({
      success: true,
      message: 'All consents withdrawn successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/privacy-centre/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
