import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cache } from '@/lib/cache';

// Cache TTL in seconds (30 minutes)
const CACHE_TTL = 1800;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get domain from query parameter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const widgetId = searchParams.get('widgetId');
    
    if (!domain && !widgetId) {
      return NextResponse.json(
        { success: false, error: 'Domain or widgetId is required' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const cacheKey = `domain-cookies:${domain || widgetId}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let websiteUrl: string;
    
    // If widgetId is provided, get the domain from widget config
    if (widgetId) {
      const { data: widgetConfig, error } = await supabase
        .from('widget_configs')
        .select('domain')
        .eq('widget_id', widgetId)
        .single();
        
      if (error || !widgetConfig) {
        return NextResponse.json(
          { success: false, error: 'Widget configuration not found' },
          { status: 404 }
        );
      }
      
      websiteUrl = widgetConfig.domain;
    } else {
      websiteUrl = domain!;
    }

    // Extract domain from URL if full URL is provided
    const cleanDomain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Get the most recent successful scan for this domain
    const { data: scanData, error: scanError } = await supabase
      .from('cookie_scan_history')
      .select('cookies_data, classification, completed_at')
      .eq('website_url', websiteUrl)
      .eq('scan_status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (scanError || !scanData || !scanData.cookies_data) {
      // Return empty structure if no scan found
      const emptyResponse = {
        success: true,
        data: {
          domain: cleanDomain,
          cookies: [],
          categories: {
            necessary: [],
            functional: [],
            analytics: [],
            advertising: [],
            social: [],
            preferences: []
          },
          lastScanned: null,
          totalCookies: 0
        }
      };
      
      // Cache empty response for shorter time
      await cache.set(cacheKey, emptyResponse, 300);
      return NextResponse.json(emptyResponse);
    }

    // Group cookies by category
    const cookiesByCategory: Record<string, any[]> = {
      necessary: [],
      functional: [],
      analytics: [],
      advertising: [],
      social: [],
      preferences: []
    };

    // Process and categorize cookies
    scanData.cookies_data.forEach((cookie: any) => {
      const category = cookie.category || 'functional';
      if (cookiesByCategory[category]) {
        cookiesByCategory[category].push({
          name: cookie.name,
          domain: cookie.domain || cleanDomain,
          purpose: cookie.purpose || 'Unknown',
          provider: cookie.provider || 'Unknown',
          expiry: cookie.expiry || 'Unknown',
          description: cookie.description || '',
          isThirdParty: cookie.is_third_party || false
        });
      }
    });

    const response = {
      success: true,
      data: {
        domain: cleanDomain,
        cookies: scanData.cookies_data,
        categories: cookiesByCategory,
        lastScanned: scanData.completed_at,
        totalCookies: scanData.cookies_data.length,
        classification: scanData.classification
      }
    };

    // Cache the response
    await cache.set(cacheKey, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching domain cookies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cookie data' 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
      'Access-Control-Max-Age': '86400',
    },
  });
}
