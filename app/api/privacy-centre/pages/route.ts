import { NextRequest, NextResponse } from 'next/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';

/**
 * Public API endpoint to fetch pages visited by a user
 * Returns list of pages where the user has given consent
 * No authentication required - it's publicly accessible for privacy centre
 */

interface PageInfo {
  url: string;
  title: string | null;
  firstVisit: string;
  lastVisit: string;
  consentGiven: boolean;
  consentTimestamp: string | null;
  consentStatus: 'accepted' | 'rejected' | 'partial' | 'revoked' | null;
  activitiesCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');
    const visitorId = searchParams.get('visitorId');

    // Validate required parameters
    if (!widgetId || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required parameters: widgetId and visitorId' },
        { status: 400 }
      );
    }

    // Create public supabase client
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify widget exists and is active
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('widget_id', widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Invalid widget ID or widget is not active' },
        { status: 404 }
      );
    }

    // Fetch all consent records for this visitor and widget
    // Group by current_url to show unique pages
    // Note: current_url and page_title are stored in consent_details.metadata
    const { data: consentRecords, error: recordsError } = await supabase
      .from('dpdpa_consent_records')
      .select('*')
      .eq('widget_id', widgetId)
      .eq('visitor_id', visitorId)
      .order('consent_given_at', { ascending: false });

    if (recordsError) {
      console.error('[Privacy Centre Pages API] Error fetching consent records:', recordsError);
      return NextResponse.json(
        { error: 'Failed to fetch consent records' },
        { status: 500 }
      );
    }

    // Helper function to normalize URLs for consistent grouping
    // Removes query parameters and fragments, normalizes trailing slashes
    function normalizeUrl(urlString: string): string {
      try {
        const url = new URL(urlString);
        // Remove query parameters and hash for grouping
        url.search = '';
        url.hash = '';
        // Normalize trailing slash (keep it consistent)
        let path = url.pathname;
        if (path.length > 1 && path.endsWith('/')) {
          path = path.slice(0, -1);
        }
        url.pathname = path;
        return url.toString();
      } catch (e) {
        // If URL parsing fails, return original
        console.warn('[Privacy Centre Pages API] Failed to parse URL:', urlString);
        return urlString;
      }
    }

    // Group records by URL to get page statistics
    const pageMap = new Map<string, PageInfo>();

    // Count records without URLs for debugging
    let recordsWithoutUrl = 0;
    let totalRecordsProcessed = 0;

    (consentRecords || []).forEach((record: any) => {
      totalRecordsProcessed++;
      
      // Extract current_url and page_title from consent_details.metadata
      // Try multiple possible locations for backward compatibility
      const metadata = record.consent_details?.metadata || {};
      let rawUrl = metadata.currentUrl || metadata.current_url || null;
      
      // Fallback: if no URL in metadata, try to use referrer or construct from widget data
      // This helps catch older records that might not have currentUrl
      if (!rawUrl && metadata.referrer) {
        // Use referrer as fallback
        rawUrl = metadata.referrer;
      }
      
      // Skip records without a URL
      if (!rawUrl) {
        recordsWithoutUrl++;
        console.log('[Privacy Centre Pages API] Record without URL:', record.id, 'created at:', record.consent_given_at);
        return;
      }

      // Normalize URL for consistent grouping
      const url = normalizeUrl(rawUrl);

      const existing = pageMap.get(url);
      const consentTimestamp = record.consent_given_at || record.created_at;
      const consentedActivities = record.consented_activities || [];
      const rejectedActivities = record.rejected_activities || [];

      // Store the original URL for display (before normalization)
      const displayUrl = rawUrl;
      
      // Get page title from metadata, with fallbacks
      const pageTitle = metadata.pageTitle || metadata.page_title || null;

      if (!existing) {
        // Validate consentTimestamp before using it
        if (!consentTimestamp) {
          console.warn('[Privacy Centre Pages API] Record without valid timestamp:', record.id);
          return;
        }
        
        // Validate that consentTimestamp is a valid date
        const testDate = new Date(consentTimestamp);
        if (isNaN(testDate.getTime())) {
          console.warn('[Privacy Centre Pages API] Record with invalid date:', record.id, consentTimestamp);
          return;
        }

        // First time seeing this page - use normalized URL as key but store original for display
        pageMap.set(url, {
          url: displayUrl, // Store original URL for display
          title: pageTitle,
          firstVisit: consentTimestamp,
          lastVisit: consentTimestamp,
          consentGiven: record.consent_status !== 'rejected',
          consentTimestamp: consentTimestamp,
          consentStatus: record.consent_status,
          activitiesCount: consentedActivities.length + rejectedActivities.length,
        });
      } else {
        // Update with latest visit info
        // Validate timestamps before creating Date objects
        if (!consentTimestamp || !existing.firstVisit || !existing.lastVisit) {
          console.warn('[Privacy Centre Pages API] Invalid timestamp values:', {
            consentTimestamp,
            firstVisit: existing.firstVisit,
            lastVisit: existing.lastVisit
          });
          // Skip this record if timestamps are invalid
          return;
        }

        const currentTimestamp = new Date(consentTimestamp);
        const firstTimestamp = new Date(existing.firstVisit);
        const lastTimestamp = new Date(existing.lastVisit);

        // Check if dates are valid
        if (isNaN(currentTimestamp.getTime()) || isNaN(firstTimestamp.getTime()) || isNaN(lastTimestamp.getTime())) {
          console.warn('[Privacy Centre Pages API] Invalid date values:', {
            currentTimestamp: consentTimestamp,
            firstTimestamp: existing.firstVisit,
            lastTimestamp: existing.lastVisit
          });
          // Skip this record if dates are invalid
          return;
        }

        if (currentTimestamp < firstTimestamp) {
          existing.firstVisit = consentTimestamp;
        }

        if (currentTimestamp > lastTimestamp) {
          existing.lastVisit = consentTimestamp;
          existing.consentTimestamp = consentTimestamp;
          existing.consentStatus = record.consent_status;
          existing.consentGiven = record.consent_status !== 'rejected';
          existing.activitiesCount = consentedActivities.length + rejectedActivities.length;
          // Update URL to the most recent one (in case formats changed)
          existing.url = displayUrl;
        }

        // Update title if not set
        if (!existing.title && pageTitle) {
          existing.title = pageTitle;
        }
      }
    });

    // Convert map to array and sort by last visit (most recent first)
    // Filter out pages with invalid dates and sort valid ones
    const pages = Array.from(pageMap.values())
      .filter(page => {
        // Validate that lastVisit is a valid date
        if (!page.lastVisit) {
          console.warn('[Privacy Centre Pages API] Page with invalid lastVisit:', page.url);
          return false;
        }
        const date = new Date(page.lastVisit);
        if (isNaN(date.getTime())) {
          console.warn('[Privacy Centre Pages API] Page with invalid date:', page.url, page.lastVisit);
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastVisit);
        const dateB = new Date(b.lastVisit);
        return dateB.getTime() - dateA.getTime();
      });

    // Log statistics for debugging
    console.log('[Privacy Centre Pages API] Processing complete:', {
      totalRecords: totalRecordsProcessed,
      recordsWithoutUrl,
      uniquePages: pages.length,
      widgetId,
      visitorId
    });

    return NextResponse.json({
      pages,
      totalPages: pages.length,
      totalConsents: pages.filter(p => p.consentGiven).length,
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('[Privacy Centre Pages API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
