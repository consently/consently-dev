import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Widget Pages Analytics API
 * Returns aggregated statistics for all pages where a widget is used
 * Authenticated endpoint - only accessible by widget owner
 */

interface PageStats {
  url: string;
  title: string | null;
  visitCount: number;
  consentCount: number;
  uniqueVisitors: number;
  lastSeen: string;
  acceptedCount: number;
  rejectedCount: number;
  partialCount: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const supabase = await createClient();

    // Auth required
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widgetId } = params;

    // Verify widget belongs to user
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, domain')
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Widget not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all consent records for this widget with page URLs
    const { data: consentRecords, error: recordsError } = await supabase
      .from('dpdpa_consent_records')
      .select('current_url, page_title, visitor_id, consent_status, consent_timestamp')
      .eq('widget_id', widgetId)
      .not('current_url', 'is', null)
      .order('consent_timestamp', { ascending: false });

    if (recordsError) {
      console.error('[Widget Pages API] Error fetching consent records:', recordsError);
      return NextResponse.json(
        { error: 'Failed to fetch widget pages' },
        { status: 500 }
      );
    }

    // Aggregate statistics by page URL
    const pageStatsMap = new Map<string, PageStats>();

    (consentRecords || []).forEach((record: any) => {
      const url = record.current_url;
      if (!url) return;

      const existing = pageStatsMap.get(url);

      if (!existing) {
        // First time seeing this page
        const isAccepted = record.consent_status === 'accepted';
        const isRejected = record.consent_status === 'rejected';
        const isPartial = record.consent_status === 'partial';

        pageStatsMap.set(url, {
          url,
          title: record.page_title || null,
          visitCount: 1,
          consentCount: isAccepted || isPartial ? 1 : 0,
          uniqueVisitors: 1,
          lastSeen: record.consent_timestamp,
          acceptedCount: isAccepted ? 1 : 0,
          rejectedCount: isRejected ? 1 : 0,
          partialCount: isPartial ? 1 : 0,
        });
      } else {
        // Update existing page stats
        existing.visitCount++;

        const isAccepted = record.consent_status === 'accepted';
        const isRejected = record.consent_status === 'rejected';
        const isPartial = record.consent_status === 'partial';

        if (isAccepted || isPartial) {
          existing.consentCount++;
        }

        if (isAccepted) existing.acceptedCount++;
        if (isRejected) existing.rejectedCount++;
        if (isPartial) existing.partialCount++;

        // Update last seen timestamp
        const currentTimestamp = new Date(record.consent_timestamp);
        const existingTimestamp = new Date(existing.lastSeen);
        if (currentTimestamp > existingTimestamp) {
          existing.lastSeen = record.consent_timestamp;
        }

        // Update title if not set
        if (!existing.title && record.page_title) {
          existing.title = record.page_title;
        }
      }
    });

    // Convert map to array and calculate unique visitors per page
    // (This is a simplified version - for accurate unique visitors, 
    // we'd need to track visitor_id per page)
    const pages = Array.from(pageStatsMap.values()).map(page => ({
      ...page,
      consentRate: page.visitCount > 0 
        ? Math.round((page.consentCount / page.visitCount) * 100) 
        : 0,
    }));

    // Sort by visit count (most popular pages first)
    pages.sort((a, b) => b.visitCount - a.visitCount);

    // Calculate totals
    const totalPages = pages.length;
    const totalVisits = pages.reduce((sum, p) => sum + p.visitCount, 0);
    const totalConsents = pages.reduce((sum, p) => sum + p.consentCount, 0);
    const averageConsentRate = totalPages > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.consentRate, 0) / totalPages)
      : 0;

    return NextResponse.json({
      widgetId,
      domain: widgetConfig.domain,
      pages,
      summary: {
        totalPages,
        totalVisits,
        totalConsents,
        averageConsentRate,
      },
    });

  } catch (error) {
    console.error('[Widget Pages API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
