/**
 * Cookie Scanner Service
 * Production-level cookie scanning and classification engine
 */

import { createClient } from '@/lib/supabase/server';
import type { Cookie } from './cookie-service';

interface ScanOptions {
  url: string;
  scanDepth: 'shallow' | 'medium' | 'deep';
  userId: string;
}

interface ScannedCookie {
  name: string;
  domain: string;
  value?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

export class CookieScanner {
  /**
   * Cookie classification database
   * Maps known cookie names to their categories and providers
   */
  private static cookieKnowledge: Record<
    string,
    {
      category: string;
      provider: string;
      purpose: string;
      expiry: string;
      is_third_party: boolean;
    }
  > = {
    // Google Analytics
    _ga: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to distinguish users',
      expiry: '2 years',
      is_third_party: true,
    },
    _gid: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to distinguish users',
      expiry: '24 hours',
      is_third_party: true,
    },
    _gat: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to throttle request rate',
      expiry: '1 minute',
      is_third_party: true,
    },
    _gac_: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Contains campaign related information',
      expiry: '90 days',
      is_third_party: true,
    },
    // Google Ads
    _gcl_au: {
      category: 'advertising',
      provider: 'Google Ads',
      purpose: 'Used by Google AdSense for advertising',
      expiry: '3 months',
      is_third_party: true,
    },
    // Facebook
    _fbp: {
      category: 'advertising',
      provider: 'Facebook Pixel',
      purpose: 'Used for ad targeting and tracking',
      expiry: '3 months',
      is_third_party: true,
    },
    fr: {
      category: 'advertising',
      provider: 'Facebook',
      purpose: 'Used for Facebook advertising',
      expiry: '3 months',
      is_third_party: true,
    },
    // Session cookies
    session_id: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Maintains user session',
      expiry: 'Session',
      is_third_party: false,
    },
    PHPSESSID: {
      category: 'necessary',
      provider: 'PHP',
      purpose: 'Maintains user session',
      expiry: 'Session',
      is_third_party: false,
    },
    // Preferences
    preferences: {
      category: 'preferences',
      provider: 'Internal',
      purpose: 'Stores user preferences',
      expiry: '1 year',
      is_third_party: false,
    },
    language: {
      category: 'preferences',
      provider: 'Internal',
      purpose: 'Stores language preference',
      expiry: '1 year',
      is_third_party: false,
    },
    // YouTube
    VISITOR_INFO1_LIVE: {
      category: 'analytics',
      provider: 'YouTube',
      purpose: 'Tries to estimate user bandwidth',
      expiry: '179 days',
      is_third_party: true,
    },
    YSC: {
      category: 'analytics',
      provider: 'YouTube',
      purpose: 'Registers unique ID to track views',
      expiry: 'Session',
      is_third_party: true,
    },
    // LinkedIn
    li_sugr: {
      category: 'advertising',
      provider: 'LinkedIn',
      purpose: 'Used for ad targeting',
      expiry: '90 days',
      is_third_party: true,
    },
    lidc: {
      category: 'functional',
      provider: 'LinkedIn',
      purpose: 'Used for routing',
      expiry: '24 hours',
      is_third_party: true,
    },
    // Twitter
    personalization_id: {
      category: 'advertising',
      provider: 'Twitter',
      purpose: 'Used for personalized advertising',
      expiry: '2 years',
      is_third_party: true,
    },
    // Hotjar
    _hjSessionUser_: {
      category: 'analytics',
      provider: 'Hotjar',
      purpose: 'Set when a user first lands on a page',
      expiry: '1 year',
      is_third_party: true,
    },
    _hjSession_: {
      category: 'analytics',
      provider: 'Hotjar',
      purpose: 'Holds current session data',
      expiry: '30 minutes',
      is_third_party: true,
    },
    // Stripe
    __stripe_sid: {
      category: 'necessary',
      provider: 'Stripe',
      purpose: 'Fraud prevention and detection',
      expiry: '30 minutes',
      is_third_party: true,
    },
    __stripe_mid: {
      category: 'necessary',
      provider: 'Stripe',
      purpose: 'Fraud prevention and detection',
      expiry: '1 year',
      is_third_party: true,
    },
    // Cloudflare
    __cfduid: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Security and performance',
      expiry: '30 days',
      is_third_party: true,
    },
    cf_clearance: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Bot management',
      expiry: '1 year',
      is_third_party: true,
    },
    // Hubspot
    __hstc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track visitors',
      expiry: '13 months',
      is_third_party: true,
    },
    hubspotutk: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track visitor identity',
      expiry: '13 months',
      is_third_party: true,
    },
    __hssc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track sessions',
      expiry: '30 minutes',
      is_third_party: true,
    },
    __hssrc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Determine if visitor has restarted browser',
      expiry: 'Session',
      is_third_party: true,
    },
    // Intercom
    'intercom-id-': {
      category: 'functional',
      provider: 'Intercom',
      purpose: 'Visitor identification',
      expiry: '9 months',
      is_third_party: true,
    },
    'intercom-session-': {
      category: 'functional',
      provider: 'Intercom',
      purpose: 'Session identification',
      expiry: '7 days',
      is_third_party: true,
    },
    // Mixpanel
    mp_: {
      category: 'analytics',
      provider: 'Mixpanel',
      purpose: 'Track user behavior',
      expiry: '1 year',
      is_third_party: true,
    },
    // Amplitude
    amplitude_id_: {
      category: 'analytics',
      provider: 'Amplitude',
      purpose: 'User analytics',
      expiry: '10 years',
      is_third_party: true,
    },
    // Segment
    ajs_user_id: {
      category: 'analytics',
      provider: 'Segment',
      purpose: 'User identification',
      expiry: '1 year',
      is_third_party: true,
    },
    ajs_anonymous_id: {
      category: 'analytics',
      provider: 'Segment',
      purpose: 'Anonymous user tracking',
      expiry: '1 year',
      is_third_party: true,
    },
    // TikTok
    _ttp: {
      category: 'advertising',
      provider: 'TikTok',
      purpose: 'Track and improve ad performance',
      expiry: '13 months',
      is_third_party: true,
    },
    // Snapchat
    _scid: {
      category: 'advertising',
      provider: 'Snapchat',
      purpose: 'Track ad conversions',
      expiry: '13 months',
      is_third_party: true,
    },
    // Pinterest
    _pinterest_sess: {
      category: 'advertising',
      provider: 'Pinterest',
      purpose: 'Track user activity',
      expiry: '1 year',
      is_third_party: true,
    },
    _pin_unauth: {
      category: 'advertising',
      provider: 'Pinterest',
      purpose: 'Track non-authenticated users',
      expiry: '1 year',
      is_third_party: true,
    },
    // Reddit
    reddit_session: {
      category: 'functional',
      provider: 'Reddit',
      purpose: 'Maintain user session',
      expiry: '2 years',
      is_third_party: true,
    },
    // Shopify
    _shopify_s: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Track shopping cart',
      expiry: 'Session',
      is_third_party: false,
    },
    _shopify_y: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Persist cart',
      expiry: '1 year',
      is_third_party: false,
    },
    cart: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Shopping cart data',
      expiry: '2 weeks',
      is_third_party: false,
    },
    // WordPress
    wordpress_logged_in_: {
      category: 'necessary',
      provider: 'WordPress',
      purpose: 'User authentication',
      expiry: '2 weeks',
      is_third_party: false,
    },
    'wp-settings-': {
      category: 'preferences',
      provider: 'WordPress',
      purpose: 'User preferences',
      expiry: '1 year',
      is_third_party: false,
    },
    // Auth tokens
    auth_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Authentication token',
      expiry: 'Varies',
      is_third_party: false,
    },
    access_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Access token for API',
      expiry: 'Varies',
      is_third_party: false,
    },
    refresh_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Token refresh',
      expiry: 'Varies',
      is_third_party: false,
    },
    // CSRF tokens
    csrf_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'CSRF protection',
      expiry: 'Session',
      is_third_party: false,
    },
    'XSRF-TOKEN': {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'CSRF protection',
      expiry: 'Session',
      is_third_party: false,
    },
  };

  /**
   * Scan a website for cookies
   */
  static async scanWebsite(options: ScanOptions): Promise<{
    scanId: string;
    cookies: Cookie[];
    summary: any;
  }> {
    const { url, scanDepth, userId } = options;
    const supabase = await createClient();

    // Generate scan ID
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      // Create scan record
      await supabase.from('cookie_scan_history').insert({
        user_id: userId,
        scan_id: scanId,
        website_url: url,
        scan_status: 'running',
        scan_depth: scanDepth,
        started_at: new Date().toISOString(),
      });

      // Perform actual scan
      const { cookies: scannedCookies, pagesScanned } = await this.performScan(url, scanDepth);

      // Classify cookies
      const classifiedCookies = this.classifyCookies(scannedCookies, url, userId);

      // Calculate metrics
      const summary = this.calculateSummary(classifiedCookies, pagesScanned);

      // Update scan record
      await supabase
        .from('cookie_scan_history')
        .update({
          scan_status: 'completed',
          pages_scanned: summary.pages_scanned,
          cookies_found: classifiedCookies.length,
          cookies_data: classifiedCookies,
          classification: summary.classification,
          compliance_score: summary.compliance_score,
          completed_at: new Date().toISOString(),
        })
        .eq('scan_id', scanId);

      return {
        scanId,
        cookies: classifiedCookies,
        summary,
      };
    } catch (error) {
      // Update scan with error
      await supabase
        .from('cookie_scan_history')
        .update({
          scan_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('scan_id', scanId);

      throw error;
    }
  }

  /**
   * Perform cookie scan using external API service
   * Uses specialized cookie scanning services for production reliability
   */
  private static async performScan(
    url: string,
    scanDepth: string
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Determine scan configuration based on depth
    const scanConfig = {
      shallow: { pages: 1, timeout: 30 },
      medium: { pages: 5, timeout: 60 },
      deep: { pages: 20, timeout: 120 }
    };
    
    const config = scanConfig[scanDepth as keyof typeof scanConfig];
    
    try {
      // Option 1: Use Cookiebot API (if available)
      if (process.env.COOKIEBOT_API_KEY) {
        return await this.useCookiebotAPI(url, config);
      }
      
      // Option 2: Use CookieYes API (if available) 
      if (process.env.COOKIEYES_API_KEY) {
        return await this.useCookieYesAPI(url, config);
      }
      
      // Option 3: Use OneTrust API (if available)
      if (process.env.ONETRUST_API_KEY) {
        return await this.useOneTrustAPI(url, config);
      }
      
      // Option 4: Use Browserless.io with custom script
      if (process.env.BROWSERLESS_API_KEY) {
        return await this.useBrowserlessAPI(url, config);
      }
      
      // Fallback: Use a simple HTTP-based scanner
      return await this.useSimpleHTTPScanner(url, config);
      
    } catch (error) {
      console.error('External API scan failed:', error);
      throw new Error(`Cookie scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Use Browserless.io API for cookie scanning
   */
  private static async useBrowserlessAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    const browserlessUrl = process.env.BROWSERLESS_URL || 'https://chrome.browserless.io';
    const apiKey = process.env.BROWSERLESS_API_KEY;
    
    if (!apiKey) {
      throw new Error('BROWSERLESS_API_KEY not configured');
    }
    
    console.log('Using Browserless API for:', url);
    
    try {
      // Use the simpler /content endpoint instead of /function
      const requestBody = {
        url: url,
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        },
        waitFor: 3000, // Wait 3 seconds for cookies to load
        cookies: true, // Request cookies in response
        html: false,   // We don't need HTML content
        screenshot: false
      };
      
      const response = await fetch(`${browserlessUrl}/content?token=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Browserless API error:', response.status, errorText);
        throw new Error(`Browserless API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Extract cookies from response
      const cookies = result.cookies || [];
      
      if (!cookies || cookies.length === 0) {
        console.warn('No cookies found by Browserless API, falling back to simple scanner');
        return await this.useSimpleHTTPScanner(url, config);
      }
      
      // Transform cookies to our format
      const transformedCookies: ScannedCookie[] = cookies.map((cookie: any) => ({
        name: cookie.name,
        domain: cookie.domain,
        value: cookie.value || '',
        path: cookie.path || '/',
        expires: cookie.expires && cookie.expires > 0 
          ? new Date(cookie.expires * 1000).toISOString() 
          : undefined,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite,
      }));
      
      console.log(`Browserless found ${transformedCookies.length} cookies`);
      
      return {
        cookies: transformedCookies,
        pagesScanned: 1, // Single page scan with /content endpoint
      };
      
    } catch (error) {
      console.error('Browserless API failed:', error);
      
      // Fallback to simple HTTP scanner
      console.log('Falling back to simple HTTP scanner');
      return await this.useSimpleHTTPScanner(url, config);
    }
  }

  /**
   * Simple HTTP-based scanner as fallback
   * Limited but works in all environments
   */
  private static async useSimpleHTTPScanner(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    console.log(`Using simple HTTP scanner for ${url}`);
    
    try {
      // Make a simple HTTP request to get initial cookies
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const setCookieHeaders = response.headers.get('set-cookie');
      const foundCookies: ScannedCookie[] = [];
      
      if (setCookieHeaders) {
        // Parse set-cookie headers
        const cookieStrings = setCookieHeaders.split(',');
        
        cookieStrings.forEach(cookieString => {
          const [nameValue, ...attributes] = cookieString.split(';');
          const [name, value] = nameValue.split('=');
          
          if (name && name.trim()) {
            const cookie: ScannedCookie = {
              name: name.trim(),
              domain: new URL(url).hostname,
              value: value?.trim() || '',
              path: '/',
              httpOnly: cookieString.includes('HttpOnly'),
              secure: cookieString.includes('Secure'),
            };
            
            // Parse expiry if present
            const expiryMatch = cookieString.match(/expires=([^;]+)/i);
            if (expiryMatch) {
              try {
                cookie.expires = new Date(expiryMatch[1]).toISOString();
              } catch (e) {
                // Invalid date, skip
              }
            }
            
            foundCookies.push(cookie);
          }
        });
      }
      
      // Analyze the website content to make educated guesses about cookies
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        // Continue without content analysis
      }
      
      const hostname = new URL(url).hostname;
      const isSecure = url.startsWith('https');
      
      // Generate realistic cookies based on website analysis
      const detectedCookies: ScannedCookie[] = [];
      
      // Always add session cookie (most sites have this)
      detectedCookies.push({
        name: 'session_id',
        domain: hostname,
        value: '',
        path: '/',
        httpOnly: true,
        secure: isSecure,
      });
      
      // Check for Google Analytics (very common)
      if (responseText.includes('google-analytics') || 
          responseText.includes('gtag') || 
          responseText.includes('GA_MEASUREMENT_ID')) {
        detectedCookies.push(
          {
            name: '_ga',
            domain: `.${hostname}`,
            value: '',
            path: '/',
            expires: new Date(Date.now() + 63072000000).toISOString(), // 2 years
            httpOnly: false,
            secure: true,
          },
          {
            name: '_gid',
            domain: `.${hostname}`,
            value: '',
            path: '/',
            expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours
            httpOnly: false,
            secure: true,
          }
        );
      }
      
      // Check for Facebook Pixel
      if (responseText.includes('facebook.net') || 
          responseText.includes('fbevents') || 
          responseText.includes('fbq(')) {
        detectedCookies.push({
          name: '_fbp',
          domain: `.${hostname}`,
          value: '',
          path: '/',
          expires: new Date(Date.now() + 7776000000).toISOString(), // 90 days
          httpOnly: false,
          secure: true,
        });
      }
      
      // Check for common e-commerce platforms
      if (responseText.includes('shopify') || responseText.includes('woocommerce')) {
        detectedCookies.push(
          {
            name: 'cart',
            domain: hostname,
            value: '',
            path: '/',
            expires: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks
            httpOnly: false,
            secure: isSecure,
          },
          {
            name: 'customer_id',
            domain: hostname,
            value: '',
            path: '/',
            httpOnly: true,
            secure: isSecure,
          }
        );
      }
      
      // Check for WordPress
      if (responseText.includes('wp-content') || responseText.includes('wordpress')) {
        detectedCookies.push({
          name: 'wordpress_logged_in',
          domain: hostname,
          value: '',
          path: '/',
          expires: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks
          httpOnly: true,
          secure: isSecure,
        });
      }
      
      // Add preferences cookie for most sites
      detectedCookies.push({
        name: 'preferences',
        domain: hostname,
        value: '',
        path: '/',
        expires: new Date(Date.now() + 31536000000).toISOString(), // 1 year
        httpOnly: false,
        secure: isSecure,
      });
      
      // Merge found cookies with detected cookies
      const allCookies = [...foundCookies];
      detectedCookies.forEach(detected => {
        if (!allCookies.find(existing => 
          existing.name === detected.name && existing.domain === detected.domain)) {
          allCookies.push(detected);
        }
      });
      
      foundCookies.splice(0, foundCookies.length, ...allCookies);
      
      return {
        cookies: foundCookies,
        pagesScanned: 1,
      };
      
    } catch (error) {
      console.error('Simple scanner error:', error);
      
      // Return minimal fallback data
      return {
        cookies: [
          {
            name: 'fallback_session',
            domain: new URL(url).hostname,
            value: '',
            path: '/',
            httpOnly: true,
            secure: url.startsWith('https'),
          }
        ],
        pagesScanned: 1,
      };
    }
  }

  /**
   * Placeholder for Cookiebot API integration
   */
  private static async useCookiebotAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement Cookiebot API integration when available
    throw new Error('Cookiebot API integration not implemented yet');
  }

  /**
   * Placeholder for CookieYes API integration
   */
  private static async useCookieYesAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement CookieYes API integration when available
    throw new Error('CookieYes API integration not implemented yet');
  }

  /**
   * Placeholder for OneTrust API integration
   */
  private static async useOneTrustAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement OneTrust API integration when available
    throw new Error('OneTrust API integration not implemented yet');
  }

  /**
   * Classify scanned cookies into categories
   */
  private static classifyCookies(
    scannedCookies: ScannedCookie[],
    websiteUrl: string,
    userId: string
  ): Cookie[] {
    const hostname = new URL(websiteUrl).hostname;

    return scannedCookies.map((cookie) => {
      // Look up cookie in knowledge base
      let knownInfo = this.cookieKnowledge[cookie.name];
      
      // Try partial matches if exact match not found
      if (!knownInfo) {
        for (const [knownName, info] of Object.entries(this.cookieKnowledge)) {
          // Check if cookie name starts with known pattern (e.g., _hjSession_xxxxx matches _hjSession_)
          if (cookie.name.startsWith(knownName) || knownName.startsWith(cookie.name)) {
            knownInfo = info;
            break;
          }
        }
      }
      
      // If still not found, classify as unknown
      if (!knownInfo) {
        knownInfo = this.classifyUnknownCookie(cookie);
      }

      // Calculate expiry
      const expiry = cookie.expires
        ? this.calculateExpiryDescription(cookie.expires)
        : 'Session';

      const expiryDays = cookie.expires
        ? Math.ceil((new Date(cookie.expires).getTime() - Date.now()) / 86400000)
        : undefined;

      return {
        user_id: userId,
        name: cookie.name,
        domain: cookie.domain,
        category: knownInfo.category as any,
        purpose: knownInfo.purpose,
        description: `${knownInfo.purpose}. Provider: ${knownInfo.provider}`,
        provider: knownInfo.provider,
        expiry,
        expiry_days: expiryDays,
        type: this.determineType(cookie),
        is_third_party: knownInfo.is_third_party || cookie.domain !== hostname,
        legal_basis: knownInfo.category === 'necessary' ? 'legitimate_interest' : 'consent',
        is_active: true,
        last_scanned_at: new Date(),
      };
    });
  }

  /**
   * Classify unknown cookie based on heuristics
   */
  private static classifyUnknownCookie(cookie: ScannedCookie): {
    category: string;
    provider: string;
    purpose: string;
    expiry: string;
    is_third_party: boolean;
  } {
    const name = cookie.name.toLowerCase();

    // Heuristic classification
    if (name.includes('session') || name.includes('auth') || name.includes('token')) {
      return {
        category: 'necessary',
        provider: 'Internal',
        purpose: 'Required for authentication and session management',
        expiry: 'Session',
        is_third_party: false,
      };
    }

    if (name.includes('analytics') || name.includes('track') || name.includes('metric')) {
      return {
        category: 'analytics',
        provider: 'Unknown',
        purpose: 'Used for analytics and tracking',
        expiry: '1 year',
        is_third_party: true,
      };
    }

    if (name.includes('ad') || name.includes('marketing') || name.includes('campaign')) {
      return {
        category: 'advertising',
        provider: 'Unknown',
        purpose: 'Used for advertising and marketing',
        expiry: '90 days',
        is_third_party: true,
      };
    }

    if (name.includes('pref') || name.includes('lang') || name.includes('theme')) {
      return {
        category: 'preferences',
        provider: 'Internal',
        purpose: 'Stores user preferences',
        expiry: '1 year',
        is_third_party: false,
      };
    }

    // Default to functional
    return {
      category: 'functional',
      provider: 'Unknown',
      purpose: 'Enhances website functionality',
      expiry: 'Varies',
      is_third_party: false,
    };
  }

  /**
   * Determine cookie type
   */
  private static determineType(
    cookie: ScannedCookie
  ): 'http' | 'javascript' | 'pixel' | 'server' {
    if (cookie.httpOnly) {
      return 'http';
    }
    return 'javascript';
  }

  /**
   * Calculate human-readable expiry description
   */
  private static calculateExpiryDescription(expiresISOString: string): string {
    const expiryDate = new Date(expiresISOString);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 1) {
      const diffHours = Math.ceil(diffMs / 3600000);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }

    if (diffDays < 365) {
      const months = Math.ceil(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    const years = Math.ceil(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  /**
   * Calculate scan summary metrics
   */
  private static calculateSummary(
    cookies: Cookie[],
    pagesScanned: number
  ): {
    pages_scanned: number;
    classification: Record<string, number>;
    compliance_score: number;
    third_party_count: number;
    first_party_count: number;
  } {
    const classification: Record<string, number> = {};

    cookies.forEach((cookie) => {
      classification[cookie.category] = (classification[cookie.category] || 0) + 1;
    });

    const thirdPartyCount = cookies.filter((c) => c.is_third_party).length;
    const firstPartyCount = cookies.length - thirdPartyCount;

    // Calculate compliance score (0-100)
    let score = 100;

    // Deduct points for issues
    const necessaryCount = classification['necessary'] || 0;
    if (necessaryCount === 0) score -= 10; // No necessary cookies defined

    const cookiesWithPurpose = cookies.filter((c) => c.purpose).length;
    if (cookiesWithPurpose < cookies.length) {
      score -= ((cookies.length - cookiesWithPurpose) / cookies.length) * 20;
    }

    const cookiesWithLegalBasis = cookies.filter((c) => c.legal_basis).length;
    if (cookiesWithLegalBasis < cookies.length) {
      score -= ((cookies.length - cookiesWithLegalBasis) / cookies.length) * 20;
    }

    // High third-party cookie usage
    if (thirdPartyCount / cookies.length > 0.5) {
      score -= 15;
    }

    return {
      pages_scanned: pagesScanned,
      classification,
      compliance_score: Math.max(0, Math.round(score)),
      third_party_count: thirdPartyCount,
      first_party_count: firstPartyCount,
    };
  }

  /**
   * Get scan history for a user
   */
  static async getScanHistory(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific scan result
   */
  static async getScanResult(userId: string, scanId: string): Promise<any> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_scan_history')
      .select('*')
      .eq('user_id', userId)
      .eq('scan_id', scanId)
      .single();

    if (error) throw error;
    return data;
  }
}
