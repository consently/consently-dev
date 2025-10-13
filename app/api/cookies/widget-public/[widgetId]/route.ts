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

    // Fetch widget config
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError || !widgetConfig) {
      console.error('Widget config error:', widgetError);
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // Fetch banner config for the same user
    const { data: bannerConfig, error: bannerError } = await supabase
      .from('cookie_banners')
      .select('*')
      .eq('user_id', widgetConfig.user_id)
      .eq('is_active', true)
      .single();

    // Prepare response combining widget and banner configs
    const config = {
      widgetId: widgetConfig.widget_id,
      domain: widgetConfig.domain,
      categories: widgetConfig.categories,
      behavior: widgetConfig.behavior,
      consentDuration: widgetConfig.consent_duration,
      blockScripts: widgetConfig.block_scripts,
      respectDNT: widgetConfig.respect_dnt,
      gdprApplies: widgetConfig.gdpr_applies,
      autoBlock: widgetConfig.auto_block || [],
      
      // Banner configuration (if available)
      position: bannerConfig?.position || 'bottom',
      primaryColor: bannerConfig?.primary_color || '#3b82f6',
      textColor: bannerConfig?.text_color || '#1f2937',
      backgroundColor: bannerConfig?.background_color || '#ffffff',
      title: bannerConfig?.title || 'We value your privacy',
      message: bannerConfig?.message || 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      acceptText: bannerConfig?.accept_text || 'Accept All',
      rejectText: bannerConfig?.reject_text || 'Reject All',
      settingsText: bannerConfig?.settings_text || 'Cookie Settings',
      language: bannerConfig?.language || 'en',
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
