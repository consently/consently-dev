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

// Trigger background scan for domains without scan data
async function triggerBackgroundScan(domain: string, userId: string) {
  try {
    // Check if there's already a pending or in-progress scan
    const { data: existingScans } = await supabase
      .from('cookie_scan_history')
      .select('scan_id, scan_status')
      .eq('website_url', domain)
      .in('scan_status', ['pending', 'in_progress'])
      .limit(1);

    if (existingScans && existingScans.length > 0) {
      console.log(`[Background Scan] Scan already in progress for ${domain}`);
      return;
    }

    // Check if we scanned recently (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentScans } = await supabase
      .from('cookie_scan_history')
      .select('scan_id')
      .eq('website_url', domain)
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (recentScans && recentScans.length > 0) {
      console.log(`[Background Scan] Recent scan exists for ${domain}, skipping`);
      return;
    }

    console.log(`[Background Scan] Triggering scan for ${domain}`);
    
    // Trigger the scan via internal API call
    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cookies/scan`;
    
    // Use fetch with no-wait pattern
    fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true'
      },
      body: JSON.stringify({
        url: domain.startsWith('http') ? domain : `https://${domain}`,
        scanDepth: 'shallow', // Use shallow scan for background scans
        userId: userId
      })
    }).catch(err => {
      console.error('[Background Scan] Failed to trigger:', err);
    });

    console.log(`[Background Scan] Scan request sent for ${domain}`);
  } catch (error) {
    console.error('[Background Scan] Error:', error);
  }
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

    // Fetch scanned cookies for this widget's domain
    let scannedCookies: any = {
      cookies: [],
      categories: {
        necessary: [],
        functional: [],
        analytics: [],
        advertising: [],
        social: [],
        preferences: []
      },
      totalCookies: 0,
      lastScanned: null,
      hasScannedCookies: false
    };

    if (widgetConfig.domain) {
      const websiteUrl = widgetConfig.domain;
      
      // Normalize domain for matching (remove www., http://, https://, trailing slashes)
      const normalizeDomain = (domain: string) => {
        return domain
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/$/, '');
      };
      
      const normalizedDomain = normalizeDomain(websiteUrl);
      console.log(`[Widget API] Looking for scans for domain: ${websiteUrl} (normalized: ${normalizedDomain})`);

      // Get the most recent successful scan for this domain (check both exact and normalized)
      const { data: scanData, error: scanError } = await supabase
        .from('cookie_scan_history')
        .select('cookies_data, classification, completed_at, website_url')
        .eq('scan_status', 'completed')
        .order('completed_at', { ascending: false });
      
      console.log(`[Widget API] Found ${scanData?.length || 0} completed scans`);
      
      // Find matching scan by normalized domain
      const matchingScan = scanData?.find((scan: any) => {
        const scanDomain = normalizeDomain(scan.website_url);
        const matches = scanDomain === normalizedDomain || 
               scanDomain.includes(normalizedDomain) || 
               normalizedDomain.includes(scanDomain);
        if (matches) {
          console.log(`[Widget API] Found matching scan: ${scan.website_url} with ${scan.cookies_data?.length || 0} cookies`);
        }
        return matches;
      });

      // Use the matching scan if found
      const scanResult = matchingScan as any;

      if (scanResult && scanResult.cookies_data && Array.isArray(scanResult.cookies_data) && scanResult.cookies_data.length > 0) {
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
        scanResult.cookies_data.forEach((cookie: any) => {
          const category = cookie.category || 'functional';
          if (cookiesByCategory[category]) {
            cookiesByCategory[category].push({
              name: cookie.name,
              domain: cookie.domain || widgetConfig.domain,
              purpose: cookie.purpose || cookie.description || 'Unknown',
              provider: cookie.provider || 'Unknown',
              expiry: cookie.expiry || 'Session',
              description: cookie.description || '',
              isThirdParty: cookie.is_third_party || false
            });
          }
        });

        scannedCookies = {
          cookies: scanResult.cookies_data,
          categories: cookiesByCategory,
          totalCookies: scanResult.cookies_data.length,
          lastScanned: scanResult.completed_at,
          hasScannedCookies: true
        };
      } else {
        // No scan found - trigger background scan for this domain
        console.log(`[Widget API] No scan found for ${websiteUrl}, triggering background scan`);
        
        // Trigger async scan without waiting (fire and forget)
        triggerBackgroundScan(widgetConfig.domain, widgetConfig.user_id).catch(err => {
          console.error('[Widget API] Background scan trigger failed:', err);
        });
      }
    }

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
      supportedLanguages: widgetConfig.supported_languages || ['en'],

      // Scanned cookies data for detailed preferences modal
      scannedCookies: scannedCookies
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
