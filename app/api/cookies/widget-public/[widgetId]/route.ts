import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/database.types';
import { cache } from '@/lib/cache';
import { successResponse } from '@/lib/api-response';
import { AppError, handleApiError } from '@/lib/api-error';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await params;

    // Try to get from cache first
    const cacheKey = `widget-config:${widgetId}`;
    const cachedConfig = await cache.get(cacheKey);

    if (cachedConfig) {
      const response = successResponse(cachedConfig);
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Fetch widget config
    const { data, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError) {
      console.error('Error fetching widget config:', widgetError);
      throw new AppError('Failed to fetch widget configuration', 500);
    }

    if (!data) {
      console.error('Widget configuration not found for widgetId:', widgetId);
      throw new AppError('Widget configuration not found', 404);
    }

    // Type assertion to help TypeScript understand the type
    const widgetConfig: Database['public']['Tables']['widget_configs']['Row'] = data;

    // Fetch active banner config
    const { data: bannerConfig, error: bannerError } = await supabase
      .from('banner_configs')
      .select('*')
      .eq('user_id', widgetConfig.user_id)
      .eq('is_active', true)
      .single();

    if (bannerError && bannerError.code !== 'PGRST116') {
      console.error('Error fetching banner config:', bannerError);
    }

    // Default banner config if none found
    const finalBannerConfig = bannerConfig || {
      position: 'bottom',
      theme: 'light',
      primary_color: '#2563eb',
      secondary_color: '#ffffff',
      text_color: '#1f2937',
      button_style: 'rounded',
      show_branding: true,
      title: 'Cookie Consent',
      description: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      accept_button_text: 'Accept All',
      reject_button_text: 'Reject All',
      settings_button_text: 'Cookie Settings',
      privacy_policy_link: '#',
      cookie_policy_link: '#'
    };

    // Construct response
    const responseData = {
      widget: {
        id: widgetConfig.widget_id,
        domain: widgetConfig.domain,
        categories: widgetConfig.categories,
        behavior: widgetConfig.behavior,
        consent_duration: widgetConfig.consent_duration,
        show_branding_link: widgetConfig.show_branding_link,
        block_scripts: widgetConfig.block_scripts,
        respect_dnt: widgetConfig.respect_dnt,
        gdpr_applies: widgetConfig.gdpr_applies,
        auto_block: widgetConfig.auto_block
      },
      banner: finalBannerConfig
    };

    // Cache the response
    await cache.set(cacheKey, responseData, CACHE_TTL);

    const response = successResponse(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    response.headers.set('X-Cache', 'MISS');

    return response;

  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
