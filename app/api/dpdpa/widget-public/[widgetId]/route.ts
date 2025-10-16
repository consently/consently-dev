import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Public API endpoint to fetch DPDPA widget configuration
 * This endpoint is called by the widget JavaScript on external sites
 * No authentication required - it's publicly accessible
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await params;

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Create supabase client (no auth check needed for public endpoint)
    const supabase = await createClient();

    // Fetch widget configuration
    const { data: widgetConfig, error: configError } = await supabase
      .from('dpdpa_widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
      .single();

    if (configError || !widgetConfig) {
      console.error('Widget config not found:', configError);
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // Fetch the processing activities associated with this widget
    const { data: activities, error: activitiesError } = await supabase
      .from('processing_activities')
      .select('id, activity_name, purpose, data_attributes, retention_period, industry')
      .in('id', widgetConfig.selected_activities || [])
      .eq('is_active', true);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Build the response with all necessary data
    const response = {
      widgetId: widgetConfig.widget_id,
      name: widgetConfig.name,
      domain: widgetConfig.domain,
      
      // Appearance
      position: widgetConfig.position,
      layout: widgetConfig.layout,
      theme: widgetConfig.theme,
      
      // Content
      title: widgetConfig.title,
      message: widgetConfig.message,
      acceptButtonText: widgetConfig.accept_button_text,
      rejectButtonText: widgetConfig.reject_button_text,
      customizeButtonText: widgetConfig.customize_button_text,
      
      // Processing activities
      activities: activities || [],
      
      // Behavior
      autoShow: widgetConfig.auto_show,
      showAfterDelay: widgetConfig.show_after_delay,
      consentDuration: widgetConfig.consent_duration,
      respectDNT: widgetConfig.respect_dnt,
      requireExplicitConsent: widgetConfig.require_explicit_consent,
      showDataSubjectsRights: widgetConfig.show_data_subjects_rights,
      
      // Advanced
      language: widgetConfig.language,
      customTranslations: widgetConfig.custom_translations,
      showBranding: widgetConfig.show_branding,
      customCSS: widgetConfig.custom_css,
      
      // Metadata
      version: '1.0.0'
    };

    // Set cache headers (cache for 5 minutes)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error fetching widget configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
