import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Privacy Centre Preferences API
 * Allows visitors to view and manage their consent preferences
 * Public endpoint - no authentication required (uses visitor_id)
 */

interface PreferenceUpdateRequest {
  visitorId: string;
  widgetId: string;
  preferences: Array<{
    activityId: string;
    consentStatus: 'accepted' | 'rejected' | 'withdrawn';
  }>;
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
    const supabase = await createClient();
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

    return NextResponse.json({
      data: {
        widgetName: widgetConfig.name,
        domain: widgetConfig.domain,
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
    const supabase = await createClient();
    const body: PreferenceUpdateRequest = await request.json();

    const { visitorId, widgetId, preferences, metadata } = body;

    if (!visitorId || !widgetId || !preferences || preferences.length === 0) {
      return NextResponse.json(
        { error: 'visitorId, widgetId, and preferences array are required' },
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

    // Update or insert preferences
    const updates = preferences.map((pref) => ({
      visitor_id: visitorId,
      widget_id: widgetId,
      activity_id: pref.activityId,
      consent_status: pref.consentStatus,
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || null,
      device_type: (metadata?.deviceType as any) || 'Unknown',
      language: metadata?.language || 'en',
      expires_at: expiresAt.toISOString(),
      consent_version: '1.0',
    }));

    // Upsert preferences (insert or update)
    const { error: upsertError } = await supabase
      .from('visitor_consent_preferences')
      .upsert(updates, {
        onConflict: 'visitor_id,widget_id,activity_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting preferences:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Note: consent_history is automatically created by database trigger

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        updatedCount: preferences.length,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/privacy-centre/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw all consents for a visitor
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const visitorId = searchParams.get('visitorId');
    const widgetId = searchParams.get('widgetId');

    if (!visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'visitorId and widgetId are required' },
        { status: 400 }
      );
    }

    // Update all preferences to 'withdrawn'
    const { error: withdrawError } = await supabase
      .from('visitor_consent_preferences')
      .update({ consent_status: 'withdrawn' })
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId);

    if (withdrawError) {
      console.error('Error withdrawing consents:', withdrawError);
      return NextResponse.json(
        { error: 'Failed to withdraw consents' },
        { status: 500 }
      );
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
