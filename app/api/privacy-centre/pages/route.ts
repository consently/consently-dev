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

    // Group records by URL to get page statistics
    const pageMap = new Map<string, PageInfo>();

    (consentRecords || []).forEach((record: any) => {
      // Extract current_url and page_title from consent_details.metadata
      const metadata = record.consent_details?.metadata || {};
      const url = metadata.currentUrl || null;
      
      // Skip records without a URL
      if (!url) return;

      const existing = pageMap.get(url);
      const consentTimestamp = record.consent_given_at || record.created_at;
      const consentedActivities = record.consented_activities || [];
      const rejectedActivities = record.rejected_activities || [];

      if (!existing) {
        // First time seeing this page
        pageMap.set(url, {
          url,
          title: metadata.pageTitle || null,
          firstVisit: consentTimestamp,
          lastVisit: consentTimestamp,
          consentGiven: record.consent_status !== 'rejected',
          consentTimestamp: consentTimestamp,
          consentStatus: record.consent_status,
          activitiesCount: consentedActivities.length + rejectedActivities.length,
        });
      } else {
        // Update with latest visit info
        const currentTimestamp = new Date(consentTimestamp);
        const firstTimestamp = new Date(existing.firstVisit);
        const lastTimestamp = new Date(existing.lastVisit);

        if (currentTimestamp < firstTimestamp) {
          existing.firstVisit = consentTimestamp;
        }

        if (currentTimestamp > lastTimestamp) {
          existing.lastVisit = consentTimestamp;
          existing.consentTimestamp = consentTimestamp;
          existing.consentStatus = record.consent_status;
          existing.consentGiven = record.consent_status !== 'rejected';
          existing.activitiesCount = consentedActivities.length + rejectedActivities.length;
        }

        // Update title if not set
        if (!existing.title && metadata.pageTitle) {
          existing.title = metadata.pageTitle;
        }
      }
    });

    // Convert map to array and sort by last visit (most recent first)
    const pages = Array.from(pageMap.values()).sort((a, b) => {
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
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
