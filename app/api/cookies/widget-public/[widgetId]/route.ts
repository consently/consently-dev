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

    // Fetch banner configuration directly using widgetId as banner ID
    const { data: banner, error: bannerError } = await supabase
      .from('banner_configs')
      .select('*')
      .eq('id', widgetId)
      .eq('is_active', true)
      .single();

    if (bannerError || !banner) {
      console.error('Banner config error:', bannerError);
      return NextResponse.json(
        { error: 'Banner configuration not found or inactive' },
        { status: 404 }
      );
    }

    // Transform snake_case database fields to camelCase for JavaScript
    const config = {
      id: banner.id,
      name: banner.name,
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
      
      // Behavior settings
      showRejectButton: banner.show_reject_button,
      showSettingsButton: banner.show_settings_button,
      autoShow: banner.auto_show,
      showAfterDelay: banner.show_after_delay,
      respectDNT: banner.respect_dnt,
      blockContent: banner.block_content,
      zIndex: banner.z_index,
      
      // Additional metadata
      createdAt: banner.created_at,
      updatedAt: banner.updated_at,
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
