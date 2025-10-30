import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Fetch widget configuration with linked banner template
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError) {
      console.error('Widget config error:', widgetError);
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // Fetch the linked banner template or default
    let banner = null;
    
    if (widgetConfig.banner_template_id) {
      // Fetch the specific linked template
      const { data: linkedBanner } = await supabase
        .from('banner_configs')
        .select('*')
        .eq('id', widgetConfig.banner_template_id)
        .eq('is_active', true)
        .single();
      
      banner = linkedBanner;
    }
    
    // If no banner linked or found, try to get user's default banner
    if (!banner && widgetConfig.user_id) {
      const { data: defaultBanner } = await supabase
        .from('banner_configs')
        .select('*')
        .eq('user_id', widgetConfig.user_id)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
      
      banner = defaultBanner;
    }
    
    // If still no banner, get the most recent active one for the user
    if (!banner && widgetConfig.user_id) {
      const { data: recentBanner } = await supabase
        .from('banner_configs')
        .select('*')
        .eq('user_id', widgetConfig.user_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      banner = recentBanner;
    }

    // If still no banner, create default configuration inline
    if (!banner) {
      console.warn('No banner template found, using default configuration');
      banner = {
        id: 'default',
        name: 'Default Banner',
        layout: 'bar',
        position: 'bottom',
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          borderRadius: 8,
          boxShadow: true
        },
        title: 'We value your privacy',
        message: 'We use cookies to enhance your browsing experience and analyze our traffic.',
        privacy_policy_url: null,
        privacy_policy_text: 'Privacy Policy',
        accept_button: {
          text: 'Accept All',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: 8
        },
        reject_button: {
          text: 'Reject All',
          backgroundColor: 'transparent',
          textColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderRadius: 8
        },
        settings_button: {
          text: 'Cookie Settings',
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          borderRadius: 8
        },
        show_reject_button: true,
        show_settings_button: true,
        auto_show: true,
        show_after_delay: 0,
        respect_dnt: false,
        block_content: false,
        z_index: 9999,
        custom_css: null,
        custom_js: null
      };
    }

    // Transform snake_case database fields to camelCase for JavaScript
    // Priority: Widget settings > Banner template > Defaults
    const config = {
      // Widget configuration (highest priority)
      widgetId: widgetConfig.widget_id,
      domain: widgetConfig.domain,
      categories: Array.isArray(widgetConfig.categories) 
        ? widgetConfig.categories 
        : ['necessary'],
      behavior: widgetConfig.behavior,
      consentDuration: widgetConfig.consent_duration,
      showBrandingLink: widgetConfig.show_branding_link,
      blockScripts: widgetConfig.block_scripts,
      respectDNT: widgetConfig.respect_dnt,
      gdprApplies: widgetConfig.gdpr_applies,
      autoBlock: Array.isArray(widgetConfig.auto_block) 
        ? widgetConfig.auto_block 
        : [],
      language: widgetConfig.language || 'en',
      
      // Banner template design (merged with widget settings)
      bannerId: banner.id,
      bannerName: banner.name,
      // Position and layout - widget config overrides banner template
      layout: widgetConfig.layout || banner.layout || 'bar',
      position: widgetConfig.position || banner.position || 'bottom',
      
      // Theme configuration - widget theme overrides banner theme
      theme: {
        ...(banner.theme || {}),
        ...(widgetConfig.theme || {}), // Widget theme takes precedence
        // Explicit fallback chain for logo
        logoUrl: widgetConfig.theme?.logoUrl || banner.theme?.logoUrl || null,
        fontFamily: widgetConfig.theme?.fontFamily || banner.theme?.fontFamily || 'system-ui, sans-serif',
      },
      
      // Supported languages - widget config is authoritative
      supportedLanguages: Array.isArray(widgetConfig.supported_languages) && widgetConfig.supported_languages.length > 0
        ? widgetConfig.supported_languages 
        : ['en'],
      
      // Content - widget banner_content overrides banner template
      title: widgetConfig.banner_content?.title || banner.title,
      message: widgetConfig.banner_content?.message || banner.message,
      privacyPolicyUrl: banner.privacy_policy_url,
      privacyPolicyText: banner.privacy_policy_text,
      
      // Button configurations - widget banner_content overrides banner template
      acceptButton: {
        ...banner.accept_button,
        text: widgetConfig.banner_content?.acceptButtonText || banner.accept_button?.text || 'Accept All'
      },
      rejectButton: {
        ...banner.reject_button,
        text: widgetConfig.banner_content?.rejectButtonText || banner.reject_button?.text || 'Reject All'
      },
      settingsButton: {
        ...banner.settings_button,
        text: widgetConfig.banner_content?.settingsButtonText || banner.settings_button?.text || 'Cookie Settings'
      },
      
      // Behavior settings - prefer widget config, fallback to banner
      showRejectButton: banner.show_reject_button ?? true,
      showSettingsButton: banner.show_settings_button ?? true,
      autoShow: widgetConfig.auto_show ?? banner.auto_show ?? true,
      showAfterDelay: widgetConfig.show_after_delay ?? banner.show_after_delay ?? 0,
      blockContent: banner.block_content ?? false,
      zIndex: banner.z_index ?? 9999,
      customCSS: banner.custom_css,
      customJS: banner.custom_js,
    };

    // Set cache headers for better performance (cache for 1 minute for faster updates)
    const response = NextResponse.json(config);
    // Reduced from 5 min to 1 min to allow changes to propagate faster
    // s-maxage=60 (CDN cache 1 min), stale-while-revalidate=120 (2 min grace period)
    // In development, disable cache completely for testing
    const isDev = process.env.NODE_ENV === 'development';
    response.headers.set('Cache-Control', isDev 
      ? 'no-cache, no-store, must-revalidate' 
      : 'public, s-maxage=60, stale-while-revalidate=120, must-revalidate');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    // Add timestamp and debug info for troubleshooting
    response.headers.set('X-Config-Timestamp', new Date().toISOString());
    response.headers.set('X-Widget-Position', config.position);
    response.headers.set('X-Widget-Layout', config.layout);
    response.headers.set('X-Widget-Source', widgetConfig.banner_template_id ? 'widget+banner' : 'widget-only');
    
    // Log critical config for debugging
    console.log('[Widget API] Returning config:', {
      widgetId,
      position: config.position,
      layout: config.layout,
      title: config.title?.substring(0, 50),
      hasTemplate: !!widgetConfig.banner_template_id
    });
    
    return response;

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
