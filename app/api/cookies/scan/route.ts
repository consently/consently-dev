import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieScanner } from '@/lib/cookies/cookie-scanner';

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

    // Perform real cookie scan using CookieScanner service
    const { scanId, cookies, summary } = await CookieScanner.scanWebsite({
      url,
      scanDepth,
      userId: user.id,
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
