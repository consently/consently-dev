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

    if (!banner) {
      console.error('No active banner template found for widget');
      return NextResponse.json(
        { error: 'No active banner template found' },
        { status: 404 }
      );
    }

    // Transform snake_case database fields to camelCase for JavaScript
    const config = {
      // Widget configuration
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
      layout: banner.layout,
      position: banner.position,
      
      // Theme configuration
      theme: banner.theme,
      
      // Content
      title: banner.title,
      message: banner.message,
      privacyPolicyUrl: banner.privacy_policy_url,
      privacyPolicyText: banner.privacy_policy_text,
      
      // Button configurations
      acceptButton: banner.accept_button,
      rejectButton: banner.reject_button,
      settingsButton: banner.settings_button,
      
      // Behavior settings (banner overrides widget if specified)
      showRejectButton: banner.show_reject_button,
      showSettingsButton: banner.show_settings_button,
      autoShow: banner.auto_show,
      showAfterDelay: banner.show_after_delay,
      blockContent: banner.block_content,
      zIndex: banner.z_index,
      customCSS: banner.custom_css,
      customJS: banner.custom_js,
    };

    // Set cache headers for better performance (cache for 5 minutes)
    const response = NextResponse.json(config);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
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
