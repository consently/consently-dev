import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { DisplayRule, DPDPAWidgetConfig, ProcessingActivityPublic } from '@/types/dpdpa-widget.types';

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
    // Apply rate limiting for widget config fetching
    const rateLimitResult = checkRateLimit({
      max: 200, // 200 requests per minute per IP (lenient for public widget)
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const { widgetId } = await params;

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Create supabase client (no auth check needed for public endpoint)
    const supabase = await createClient();

    // Fetch widget configuration (only active widgets)
    const { data: widgetConfig, error: configError } = await supabase
      .from('dpdpa_widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
      .single();

    if (configError || !widgetConfig) {
      console.error('[Widget Public API] Widget config not found:', {
        widgetId,
        error: configError?.message,
        code: configError?.code,
      });
      return NextResponse.json(
        { 
          error: 'Widget configuration not found',
          code: 'WIDGET_NOT_FOUND'
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Log selected activities for debugging
    console.log('[Widget Public API] Widget ID:', widgetId);
    console.log('[Widget Public API] Selected activities from config:', widgetConfig.selected_activities);
    console.log('[Widget Public API] Selected activities count:', widgetConfig.selected_activities?.length || 0);

    // Fetch the processing activities associated with this widget with full purpose details
    const selectedActivitiesIds = widgetConfig.selected_activities || [];
    
    // If no activities selected, return empty array but log warning
    if (!selectedActivitiesIds || selectedActivitiesIds.length === 0) {
      console.warn('[Widget Public API] No activities selected in widget configuration!');
      console.warn('[Widget Public API] Widget config:', {
        widgetId: widgetConfig.widget_id,
        name: widgetConfig.name,
        selected_activities: widgetConfig.selected_activities
      });
    }

    // OPTIMIZED: Use Supabase joins to fetch all data in ONE query (no N+1 problem)
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

    if (activitiesError) {
      console.error('[Widget Public API] Error fetching activities:', activitiesError);
    }

    console.log('[Widget Public API] Activities fetched from database:', activitiesRaw?.length || 0);
    if (activitiesRaw && activitiesRaw.length > 0) {
      console.log('[Widget Public API] First activity:', {
        id: activitiesRaw[0].id,
        name: activitiesRaw[0].activity_name,
        hasPurposes: !!activitiesRaw[0].activity_purposes
      });
    } else if (selectedActivitiesIds.length > 0) {
      console.warn('[Widget Public API] No activities found despite selected_activities being non-empty!');
      console.warn('[Widget Public API] This might indicate:');
      console.warn('  1. Activity IDs in selected_activities do not match any records');
      console.warn('  2. Activities exist but are marked as is_active = false');
      console.warn('  3. Data type mismatch (UUID vs string)');
    }

    // Transform the joined data into the expected format
    const activities = (activitiesRaw || []).map((activity: any) => {
      // Transform purposes with their categories
      const purposesWithCategories = (activity.activity_purposes || []).map((ap: any) => ({
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
      }));

      const processedActivity = {
        id: activity.id,
        activity_name: activity.activity_name,
        industry: activity.industry,
        // New structure with purposes (the ONLY structure now)
        purposes: purposesWithCategories,
      };

      // Log activity structure for debugging
      console.log('[Widget Public API] Processed activity:', {
        id: processedActivity.id,
        name: processedActivity.activity_name,
        purposesCount: processedActivity.purposes?.length || 0,
      });

      return processedActivity;
    });

    console.log('[Widget Public API] Final activities count after processing:', activities.length);
    if (activities.length === 0 && selectedActivitiesIds.length > 0) {
      console.error('[Widget Public API] CRITICAL: Activities were selected but none were returned!');
      console.error('[Widget Public API] This indicates a data mismatch or query issue.');
    }

    // Generate privacy notice HTML (with sanitization)
    let privacyNoticeHTML = '<p style="color:#6b7280;">Privacy notice content...</p>';
    if (activities && activities.length > 0) {
      const generatedHTML = generatePrivacyNoticeHTML(activities, widgetConfig.domain);
      privacyNoticeHTML = sanitizeHTML(generatedHTML);
    }

    // Build the response with all necessary data (typed response)
    const response: DPDPAWidgetConfig = {
      widgetId: widgetConfig.widget_id,
      name: widgetConfig.name || 'DPDPA Consent Widget',
      domain: widgetConfig.domain,
      
      // Appearance
      position: (widgetConfig.position || 'modal') as DPDPAWidgetConfig['position'],
      layout: (widgetConfig.layout || 'modal') as DPDPAWidgetConfig['layout'],
      theme: (widgetConfig.theme || {}) as DPDPAWidgetConfig['theme'],
      
      // Content
      title: widgetConfig.title || 'Your Data Privacy Rights',
      message: widgetConfig.message || 'We process your personal data with your consent.',
      acceptButtonText: widgetConfig.accept_button_text || 'Accept All',
      rejectButtonText: widgetConfig.reject_button_text || 'Reject All',
      customizeButtonText: widgetConfig.customize_button_text || 'Manage Preferences',
      
      // Processing activities - ensure it's always an array and properly typed
      activities: (Array.isArray(activities) ? activities : []) as ProcessingActivityPublic[],
      
      // Privacy notice (sanitized)
      privacyNoticeHTML: privacyNoticeHTML,
      
      // Behavior
      autoShow: widgetConfig.auto_show ?? true,
      showAfterDelay: widgetConfig.show_after_delay ?? 1000,
      consentDuration: widgetConfig.consent_duration ?? 365,
      respectDNT: widgetConfig.respect_dnt ?? false,
      requireExplicitConsent: widgetConfig.require_explicit_consent ?? true,
      showDataSubjectsRights: widgetConfig.show_data_subjects_rights ?? true,
      
      // Advanced
      language: widgetConfig.language || 'en',
      supportedLanguages: Array.isArray(widgetConfig.supported_languages) 
        ? widgetConfig.supported_languages 
        : ['en'],
      customTranslations: widgetConfig.custom_translations || undefined,
      showBranding: widgetConfig.show_branding ?? true,
      customCSS: widgetConfig.custom_css || undefined,
      
      // NEW: Display rules for page-specific notices (filter inactive rules and validate)
      display_rules: filterAndValidateDisplayRules(widgetConfig.display_rules),
      
      // Metadata
      version: '2.0.0' // Updated version for display rules support
    };

    // Log final response structure for debugging
    console.log('[Widget Public API] Final response structure:', {
      widgetId: response.widgetId,
      activitiesCount: response.activities.length,
      hasActivities: response.activities.length > 0,
      activitiesStructure: response.activities.length > 0 ? {
        firstActivityId: response.activities[0].id,
        firstActivityName: response.activities[0].activity_name,
        firstActivityPurposesCount: response.activities[0].purposes?.length || 0,
        firstActivityDataAttributesCount: response.activities[0].data_attributes?.length || 0
      } : null
    });

    // Generate ETag for cache validation
    const configString = JSON.stringify(response);
    const etag = `"${Buffer.from(configString).toString('base64').substring(0, 32)}"`;
    
    // Check If-None-Match header for conditional requests
    const requestEtag = request.headers.get('If-None-Match');
    if (requestEtag === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=60, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // Set cache headers (cache for 1 minute for faster updates)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, must-revalidate',
        'ETag': etag,
        'Last-Modified': new Date().toUTCString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, If-None-Match',
      }
    });

  } catch (error) {
    // Enhanced error logging for production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Widget Public API] Error fetching widget configuration:', {
      widgetId: await params.then(p => p.widgetId).catch(() => 'unknown'),
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    // Don't expose internal error details to clients
    return NextResponse.json(
      { 
        error: 'Failed to load widget configuration',
        code: 'WIDGET_CONFIG_ERROR'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, If-None-Match',
    }
  });
}

// Helper function to generate privacy notice HTML
function generatePrivacyNoticeHTML(activities: any[], domain: string): string {
  const companyName = domain || '[Your Company Name]';
  
  const activitySections = activities.map((activity, index) => {
    // Use new purposes structure (ONLY structure now - no legacy fallback)
    let purposesList = '';
    let allDataCategories: string[] = [];
    let retentionText = 'N/A';
    
    if (activity.purposes && activity.purposes.length > 0) {
      // Show all purposes
      purposesList = activity.purposes.map((p: any) => {
        const dataCategories = p.dataCategories?.map((cat: any) => cat.categoryName) || [];
        allDataCategories.push(...dataCategories);
        
        const retentionPeriods = p.dataCategories?.map((cat: any) => 
          `${cat.categoryName}: ${cat.retentionPeriod}`
        ) || [];
        
        if (retentionPeriods.length > 0) {
          retentionText = retentionPeriods.join(', ');
        }
        
        return `<li>${escapeHtml(p.purposeName)} (${escapeHtml(p.legalBasis.replace('-', ' '))})</li>`;
      }).join('');
    } else {
      purposesList = '<li>No purposes defined</li>';
    }
    
    const dataCategoriesText = allDataCategories.length > 0 
      ? allDataCategories.map((c: string) => escapeHtml(c)).join(', ')
      : 'N/A';
    
    return `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${escapeHtml(activity.activity_name)}
      </h3>
      
      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Purposes:</strong>
        <ul style="margin: 4px 0 0 0; color: #6b7280; padding-left: 20px;">
          ${purposesList}
        </ul>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Categories:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${dataCategoriesText}</p>
      </div>

      <div>
        <strong style="color: #374151;">Retention Period:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(retentionText)}</p>
      </div>
    </div>
  `;
  }).join('');

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

/**
 * Filter and validate display rules
 * Removes inactive rules and invalid rules for security
 */
function filterAndValidateDisplayRules(rules: any): DisplayRule[] {
  if (!rules || !Array.isArray(rules)) {
    return [];
  }
  
  // Filter inactive rules and validate structure
  return rules
    .filter((rule: any) => {
      // Basic validation: rule must have required fields and be active
      if (!rule || typeof rule !== 'object') return false;
      if (rule.is_active === false) return false;
      if (!rule.id || !rule.rule_name || !rule.url_pattern) return false;
      if (!['exact', 'contains', 'startsWith', 'regex'].includes(rule.url_match_type)) return false;
      if (!['onPageLoad', 'onClick', 'onFormSubmit', 'onScroll'].includes(rule.trigger_type)) return false;
      
      // Validate priority is a number
      if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 1000) {
        console.warn('[Widget Public API] Invalid priority in rule:', rule.id);
        return false;
      }
      
      // Validate URL pattern length (prevent DoS via extremely long patterns)
      if (rule.url_pattern.length > 500) {
        console.warn('[Widget Public API] URL pattern too long in rule:', rule.id);
        return false;
      }
      
      // Validate regex patterns (if regex type)
      if (rule.url_match_type === 'regex') {
        try {
          new RegExp(rule.url_pattern);
        } catch (e) {
          console.warn('[Widget Public API] Invalid regex pattern in rule:', rule.id, e);
          return false;
        }
      }
      
      // Validate activities array if present
      if (rule.activities && Array.isArray(rule.activities)) {
        // Limit number of activities per rule (prevent abuse)
        if (rule.activities.length > 50) {
          console.warn('[Widget Public API] Too many activities in rule:', rule.id);
          return false;
        }
        // Validate UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        rule.activities = rule.activities.filter((id: string) => 
          typeof id === 'string' && uuidRegex.test(id)
        );
      }
      
      // Validate scroll_threshold if present (for onScroll trigger)
      if (rule.trigger_type === 'onScroll') {
        if (rule.scroll_threshold !== undefined) {
          if (typeof rule.scroll_threshold !== 'number' || rule.scroll_threshold < 0 || rule.scroll_threshold > 100) {
            console.warn('[Widget Public API] Invalid scroll_threshold in rule:', rule.id);
            return false;
          }
        }
      }
      
      return true;
    })
    .sort((a: DisplayRule, b: DisplayRule) => (b.priority || 100) - (a.priority || 100)) // Sort by priority
    .slice(0, 100); // Limit to 100 rules (prevent excessive payload)
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize HTML content (basic sanitization for privacy notice)
 * In production, consider using a library like DOMPurify for more robust sanitization
 */
function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Basic sanitization: remove script tags and event handlers
  // For production, consider using DOMPurify or similar library
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
