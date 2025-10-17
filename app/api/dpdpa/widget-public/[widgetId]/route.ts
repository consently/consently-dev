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

    // Generate privacy notice HTML
    let privacyNoticeHTML = '<p style="color:#6b7280;">Privacy notice content...</p>';
    if (activities && activities.length > 0) {
      privacyNoticeHTML = generatePrivacyNoticeHTML(activities, widgetConfig.domain);
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
      
      // Privacy notice
      privacyNoticeHTML: privacyNoticeHTML,
      
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

// Helper function to generate privacy notice HTML
function generatePrivacyNoticeHTML(activities: any[], domain: string): string {
  const companyName = domain || '[Your Company Name]';
  
  const activitySections = activities.map((activity, index) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${escapeHtml(activity.activity_name)}
      </h3>
      
      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Purpose:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(activity.purpose)}</p>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Categories:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.data_attributes.map((a: string) => escapeHtml(a)).join(', ')}</p>
      </div>

      <div>
        <strong style="color: #374151;">Retention Period:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(activity.retention_period)}</p>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Notice - Data Processing Activities</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 32px 16px;">
  
  <h1 style="color: #111827; font-size: 32px; margin-bottom: 16px;">Privacy Notice</h1>
  
  <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
    <p style="margin: 0; color: #1e40af; font-weight: 500;">
      This notice explains how ${escapeHtml(companyName)} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
    </p>
  </div>

  <h2 style="color: #1f2937; font-size: 24px; margin-top: 32px; margin-bottom: 16px;">Data Processing Activities</h2>
  
  <p style="color: #6b7280; margin-bottom: 24px;">
    We process your personal data for the following purposes. You have the right to provide or withdraw consent for each activity.
  </p>

  ${activitySections}

  <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
    <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">Your Rights Under DPDPA 2023</h2>
    
    <ul style="color: #6b7280; line-height: 1.8;">
      <li><strong>Right to Access:</strong> You can request information about what personal data we hold about you.</li>
      <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.</li>
      <li><strong>Right to Erasure:</strong> You can request deletion of your personal data in certain circumstances.</li>
      <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
      <li><strong>Right to Grievance Redressal:</strong> You can raise concerns or complaints about data processing.</li>
    </ul>

    <p style="color: #6b7280; margin-top: 24px;">
      <strong>How to Exercise Your Rights:</strong><br>
      You can manage your consent preferences or raise a grievance through our consent widget on ${escapeHtml(domain)}, 
      or contact us at [contact-email@${escapeHtml(domain)}].
    </p>

    <p style="color: #6b7280; margin-top: 16px;">
      <strong>Response Time:</strong> We will respond to your requests within 72 hours as required by DPDPA 2023.
    </p>
  </div>

  <div style="margin-top: 32px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Contact:</strong> [contact-email@${escapeHtml(domain)}]<br>
      <strong>Compliance:</strong> This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
    </p>
  </div>

</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
