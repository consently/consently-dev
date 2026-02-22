import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { DisplayRule, DPDPAWidgetConfig, ProcessingActivityPublic } from '@/types/dpdpa-widget.types';
import { cache } from '@/lib/cache';
import { generatePrivacyNoticeHTML, sanitizeHTML } from '@/lib/dpdpa-notice';

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
    const rateLimitResult = await checkRateLimit({
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

    // Try to get from cache first
    const cacheKey = `dpdpa-widget-config:${widgetId}`;
    const cachedConfig = await cache.get(cacheKey);

    if (cachedConfig) {
      const response = NextResponse.json(cachedConfig);
      const etag = `"${Buffer.from(JSON.stringify(cachedConfig)).toString('base64').substring(0, 32)}"`;

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

      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120, must-revalidate');
      response.headers.set('ETag', etag);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('X-Cache', 'HIT');
      return response;
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

    // Fetch the processing activities associated with this widget with full purpose details
    const selectedActivitiesIds = widgetConfig.selected_activities || [];

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

      return processedActivity;
    });

    // Generate privacy notice HTML (with sanitization)
    let privacyNoticeHTML = '<p style="color:#6b7280;">Privacy notice content...</p>';
    if (activities && activities.length > 0) {
      const generatedHTML = generatePrivacyNoticeHTML(activities, widgetConfig.domain, widgetConfig.dpo_email || 'dpo@consently.in');
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

      // Mandatory purposes (cannot be deselected by user)
      mandatoryPurposes: Array.isArray(widgetConfig.mandatory_purposes)
        ? widgetConfig.mandatory_purposes
        : [],

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

      // Smart Email Pre-fill Settings
      enableSmartPreFill: widgetConfig.enable_smart_prefill ?? true,
      emailFieldSelectors: widgetConfig.email_field_selectors || 'input[type="email"], input[name*="email" i]',

      // NEW: Display rules for page-specific notices (filter inactive rules and validate)
      display_rules: filterAndValidateDisplayRules(widgetConfig.display_rules),

      // Email Verification - always required for DPDPA compliance
      requireEmailVerification: true,

      // Age Verification
      requireAgeVerification: widgetConfig.require_age_verification ?? false,
      ageVerificationThreshold: widgetConfig.age_verification_threshold ?? 18,
      ageVerificationProvider: widgetConfig.age_verification_provider || 'digilocker',
      minorHandling: widgetConfig.minor_handling || 'block',
      verificationValidityDays: widgetConfig.verification_validity_days ?? 365,

      // Legacy Age Gate
      enableAgeGate: widgetConfig.enable_age_gate ?? false,
      ageGateThreshold: widgetConfig.age_gate_threshold ?? 18,
      ageGateMinorMessage: widgetConfig.age_gate_minor_message || '',

      // Metadata
      version: '2.0.0'
    };

    // Cache the config
    await cache.set(cacheKey, response, 3600); // Cache for 1 hour

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
        'X-Cache': 'MISS',
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
// Moved to @/lib/dpdpa-notice.ts

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

