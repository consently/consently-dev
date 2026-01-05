import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieScanner } from '@/lib/cookies/cookie-scanner';
import { checkRateLimit, getUserIdentifier } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting - 10 scans per hour per user (expensive operation)
    const rateLimitResult = await checkRateLimit({
      max: 10,
      window: 3600000, // 1 hour
      identifier: getUserIdentifier(user.id),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded. Please wait before scanning again.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { url, scanDepth = 'medium' } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate scanDepth
    if (!['shallow', 'medium', 'deep'].includes(scanDepth)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scan depth. Must be: shallow, medium, or deep' },
        { status: 400 }
      );
    }

    // Enforce subscription/trial entitlements only for medium and deep scans
    // Shallow scans are always allowed for authenticated users
    if (scanDepth !== 'shallow') {
      const { getEntitlements, isScanDepthAllowed } = await import('@/lib/subscription');
      const entitlements = await getEntitlements();

      if (!isScanDepthAllowed(scanDepth, entitlements)) {
        return NextResponse.json(
          { 
            success: false, 
            error: entitlements.isTrial || entitlements.plan !== 'free' 
              ? 'Your plan does not allow this scan depth' 
              : 'Upgrade or start a free trial to use deeper scans' 
          },
          { status: 403 }
        );
      }
    }

    // Perform real cookie scan using CookieScanner service
    // Pass tier based on scanDepth to allow multi-page scanning
    // During trial, grant enterprise tier access
    const { getEntitlements } = await import('@/lib/subscription');
    const entitlements = await getEntitlements();
    
    let tier: 'free' | 'premium' | 'enterprise' = 'free';
    if (entitlements.isTrial) {
      tier = 'enterprise'; // Full access during trial
    } else {
      if (scanDepth === 'medium') tier = 'premium';
      if (scanDepth === 'deep') tier = 'enterprise';
    }
    
    const { scanId, cookies, summary } = await CookieScanner.scanWebsite({
      url,
      scanDepth,
      userId: user.id,
      tier,
    });

    // Format response
    const scanResult = {
      scanId,
      url,
      scanDate: new Date().toISOString(),
      cookies: cookies.map((cookie) => ({
        id: cookie.id || Math.random().toString(36).substring(7),
        name: cookie.name,
        domain: cookie.domain,
        category: cookie.category,
        expiry: cookie.expiry,
        description: cookie.description || '',
        purpose: cookie.purpose || '',
        provider: cookie.provider,
        is_third_party: cookie.is_third_party,
      })),
      totalCookies: cookies.length,
      categoryCounts: summary.classification,
      complianceScore: summary.compliance_score,
      thirdPartyCount: summary.third_party_count,
      firstPartyCount: summary.first_party_count,
      pagesScanned: summary.pages_scanned,
    };

    return NextResponse.json({ success: true, data: scanResult });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scan website' 
      },
      { status: 500 }
    );
  }
}
