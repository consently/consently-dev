import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateVerifiedConsentId, generateUnverifiedConsentId } from '@/lib/consent-id-utils';
import crypto from 'crypto';

/**
 * Bulk Preferences API
 * Atomically upserts all activity preferences in a single operation
 * More efficient than individual updates for Accept All / Reject All scenarios
 * 
 * NOTE: Uses service role client to bypass RLS - this is a public endpoint
 * that allows anonymous visitors to bulk update their preferences.
 */

interface BulkPreferenceRequest {
  visitorId: string;
  widgetId: string;
  action: 'accept_all' | 'reject_all' | 'custom';
  preferences?: Array<{
    activityId: string;
    consentStatus: 'accepted' | 'rejected' | 'withdrawn';
  }>;
  visitorEmail?: string;
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

// Helper to normalize device type
const normalizeDeviceType = (deviceType?: string): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' => {
  if (!deviceType) return 'Unknown';
  const normalized = deviceType.toLowerCase();
  if (normalized.includes('mobile') || normalized.includes('phone')) return 'Mobile';
  if (normalized.includes('tablet')) return 'Tablet';
  if (normalized.includes('desktop') || normalized.includes('pc') || normalized.includes('laptop')) return 'Desktop';
  return 'Unknown';
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body: BulkPreferenceRequest = await request.json();

    const { visitorId, widgetId, action, preferences, visitorEmail, metadata } = body;

    if (!visitorId || !widgetId || !action) {
      return NextResponse.json(
        { error: 'visitorId, widgetId, and action are required' },
        { status: 400 }
      );
    }

    if (!['accept_all', 'reject_all', 'custom'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept_all, reject_all, or custom' },
        { status: 400 }
      );
    }

    if (action === 'custom' && (!preferences || preferences.length === 0)) {
      return NextResponse.json(
        { error: 'preferences array is required for custom action' },
        { status: 400 }
      );
    }

    // Hash visitor email if provided
    const visitorEmailHash = visitorEmail ? hashEmail(visitorEmail) : null;

    // Fetch widget configuration
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('selected_activities, consent_duration')
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
      return NextResponse.json(
        { error: 'Widget has no activities configured' },
        { status: 400 }
      );
    }

    const consentDuration = widgetConfig.consent_duration || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);
    const now = new Date().toISOString();

    // Fetch current preferences to determine original status for withdrawal detection
    const { data: existingPrefs } = await supabase
      .from('visitor_consent_preferences')
      .select('activity_id, consent_status')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    const originalStatusMap = new Map(
      (existingPrefs || []).map((p: any) => [p.activity_id, p.consent_status])
    );

    // Build preferences array based on action
    let preferencesArray: Array<{
      activityId: string;
      consentStatus: 'accepted' | 'rejected' | 'withdrawn';
    }>;

    if (action === 'accept_all') {
      preferencesArray = selectedActivities.map((activityId: string) => ({
        activityId,
        consentStatus: 'accepted' as const,
      }));
    } else if (action === 'reject_all') {
      preferencesArray = selectedActivities.map((activityId: string) => {
        // If previously accepted, mark as withdrawn; otherwise rejected
        const wasAccepted = originalStatusMap.get(activityId) === 'accepted';
        return {
          activityId,
          consentStatus: wasAccepted ? ('withdrawn' as const) : ('rejected' as const),
        };
      });
    } else {
      // custom action
      preferencesArray = preferences!;
    }

    // Validate all activity IDs exist
    const activityIds = preferencesArray.map(p => p.activityId);
    const { data: existingActivities, error: activityCheckError } = await supabase
      .from('processing_activities')
      .select('id')
      .in('id', activityIds);

    if (activityCheckError) {
      console.error('[Bulk Preferences] Error checking activities:', activityCheckError);
      return NextResponse.json(
        { error: 'Failed to validate activities' },
        { status: 500 }
      );
    }

    const validActivityIds = new Set((existingActivities || []).map((a: any) => a.id));
    const invalidActivities = activityIds.filter(id => !validActivityIds.has(id));

    if (invalidActivities.length > 0) {
      console.error('[Bulk Preferences] Invalid activity IDs:', invalidActivities);
      return NextResponse.json(
        {
          error: 'Invalid activity IDs provided',
          details: `Activities not found: ${invalidActivities.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Prepare bulk upsert data
    const normalizedDeviceType = normalizeDeviceType(metadata?.deviceType);
    const upsertData = preferencesArray.map(pref => ({
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
      consent_given_at: now,
      last_updated: now,
    }));

    // Perform bulk upsert with ON CONFLICT update
    const { data: upsertResult, error: upsertError } = await supabase
      .from('visitor_consent_preferences')
      .upsert(upsertData, {
        onConflict: 'visitor_id,widget_id,activity_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('[Bulk Preferences] Upsert error:', JSON.stringify(upsertError, null, 2));
      console.error('[Bulk Preferences] Upsert data sample:', JSON.stringify(upsertData.slice(0, 1), null, 2));
      console.error('[Bulk Preferences] Total records to upsert:', upsertData.length);
      return NextResponse.json(
        {
          error: 'Failed to save preferences',
          details: upsertError.message,
          code: upsertError.code,
          hint: upsertError.hint || undefined,
        },
        { status: 500 }
      );
    }

    console.log('[Bulk Preferences] Successfully upserted preferences:', {
      count: preferencesArray.length,
      visitorId,
      widgetId,
      action,
    });

    // Create consent record for sync
    try {
      const acceptedActivities = preferencesArray
        .filter(p => p.consentStatus === 'accepted')
        .map(p => p.activityId);
      const rejectedActivities = preferencesArray
        .filter(p => p.consentStatus === 'rejected')
        .map(p => p.activityId);
      const withdrawnActivities = preferencesArray
        .filter(p => p.consentStatus === 'withdrawn')
        .map(p => p.activityId);

      // Determine overall consent status
      const totalActivities = preferencesArray.length;
      const allWithdrawn = withdrawnActivities.length === totalActivities;

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

      const consentDetails = {
        activityConsents: {},
        metadata: {
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          deviceType: metadata?.deviceType,
          language: metadata?.language,
          source: 'preference_centre_bulk'
        }
      };

      const { error: consentRecordError } = await supabase
        .from('dpdpa_consent_records')
        .insert({
          widget_id: widgetId,
          visitor_id: visitorId,
          consent_id: consentId,
          consent_status: consentStatus,
          consented_activities: acceptedActivities,
          rejected_activities: allRejectedActivities,
          consent_details: consentDetails,
          visitor_email_hash: visitorEmailHash,
          revoked_at: allWithdrawn ? now : null,
          revocation_reason: allWithdrawn ? 'User withdrew all consent via preference centre (bulk)' : null,
          ip_address: metadata?.ipAddress || null,
          user_agent: metadata?.userAgent || null,
          device_type: normalizedDeviceType,
          language: metadata?.language || 'en',
          consent_given_at: now,
          consent_expires_at: expiresAt.toISOString(),
          privacy_notice_version: '3.0'
        });

      if (consentRecordError) {
        console.error('[Bulk Preferences] Error creating consent record:', consentRecordError);
        // Don't fail the request - preferences were already updated
      } else {
        console.log('[Bulk Preferences] Successfully synced to consent record');
      }
    } catch (syncError) {
      console.error('[Bulk Preferences] Error syncing to consent records:', syncError);
      // Don't fail the request - preferences were already updated
    }

    // Fetch updated preferences to return authoritative state
    const { data: updatedPreferences } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'accept_all' ? 'accepted' : action === 'reject_all' ? 'rejected' : 'updated'} all preferences`,
      data: {
        updatedCount: preferencesArray.length,
        expiresAt: expiresAt.toISOString(),
        preferences: updatedPreferences || [],
      },
    });

  } catch (error: any) {
    console.error('[Bulk Preferences] Unhandled error:', error);
    console.error('[Bulk Preferences] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        code: error?.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
