import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/database.types';
import { cache } from '@/lib/cache';
import { AppError, handleApiError } from '@/lib/api-error';
import { unstable_cache } from 'next/cache';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache TTL in seconds (1 minute for faster updates)
const CACHE_TTL = 60;

// Cache tag for revalidation
function getCacheTag(widgetId: string) {
  return `widget-config:${widgetId}`;
}

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
      // Return data directly for widget compatibility
      const response = NextResponse.json(cachedConfig);
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Cache-Tag', getCacheTag(widgetId));
      return response;
    }

    // Fetch widget config
    const { data, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('widget_id', widgetId)
      .single();

    if (widgetError) {
      // PGRST116 means no rows returned - this is a 404, not a 500
      if (widgetError.code === 'PGRST116') {
        console.log('Widget configuration not found for widgetId:', widgetId);
        throw new AppError('Widget configuration not found', 404);
      }
      console.error('Error fetching widget config:', widgetError);
      throw new AppError('Failed to fetch widget configuration', 500);
    }

    if (!data) {
      console.log('Widget configuration not found for widgetId:', widgetId);
      throw new AppError('Widget configuration not found', 404);
    }

    // Type assertion - using 'any' because database has more properties than generated types
    const widgetConfig = data as any;

    // Extract banner configuration from widget config (it's embedded, not a separate table)
    const bannerContent = widgetConfig.banner_content || {};
    const theme = widgetConfig.theme || {};

    // Construct response - flattened structure for widget compatibility
    const responseData = {
      // Widget identifiers (required for widget.js validation)
      widgetId: widgetConfig.widget_id,
      bannerId: widgetConfig.widget_id,

      // Widget configuration
      domain: widgetConfig.domain,
      categories: widgetConfig.categories || ['necessary', 'analytics', 'marketing', 'social'],
      behavior: widgetConfig.behavior || 'explicit',
      consentDuration: widgetConfig.consent_duration || 365,
      showBrandingLink: widgetConfig.show_branding_link !== false,
      blockScripts: widgetConfig.block_scripts !== false,
      respectDNT: widgetConfig.respect_dnt || false,
      gdprApplies: widgetConfig.gdpr_applies !== false,
      autoBlock: widgetConfig.auto_block || [],
      autoShow: widgetConfig.auto_show !== false,
      showAfterDelay: widgetConfig.show_after_delay || 0,

      // Banner configuration
      position: widgetConfig.position || 'bottom',
      layout: widgetConfig.layout || 'bar',
      theme: {
        primaryColor: theme.primaryColor || '#3b82f6',
        secondaryColor: theme.secondaryColor || theme.backgroundColor || '#ffffff',
        backgroundColor: theme.backgroundColor || '#ffffff',
        textColor: theme.textColor || '#1f2937',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        borderRadius: theme.borderRadius || 8,
        boxShadow: true,
        logoUrl: theme.logoUrl || null,
      },
      title: bannerContent.title || 'Cookie Consent',
      message: bannerContent.message || 'We use cookies to enhance your browsing experience.',
      acceptButton: {
        text: bannerContent.acceptButtonText || 'Accept All',
        backgroundColor: theme.primaryColor || '#3b82f6',
        textColor: '#ffffff'
      },
      rejectButton: {
        text: bannerContent.rejectButtonText || 'Reject All',
        backgroundColor: 'transparent',
        textColor: theme.primaryColor || '#3b82f6',
        borderColor: theme.primaryColor || '#3b82f6'
      },
      settingsButton: {
        text: bannerContent.settingsButtonText || 'Cookie Settings',
        backgroundColor: '#f3f4f6',
        textColor: theme.textColor || '#1f2937'
      },
      showRejectButton: true,
      showSettingsButton: true,
      privacyPolicyUrl: bannerContent.privacyPolicyUrl || bannerContent.cookiePolicyUrl || '#',
      cookiePolicyUrl: bannerContent.cookiePolicyUrl || '#',
      supportedLanguages: widgetConfig.supported_languages || ['en']
    };

    // Cache the response
    await cache.set(cacheKey, responseData, CACHE_TTL);

    // Return data directly for widget compatibility
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Tag', getCacheTag(widgetId));

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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    },
  });
}
