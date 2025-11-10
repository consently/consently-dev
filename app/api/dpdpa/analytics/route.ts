import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { WidgetAnalytics, RulePerformance } from '@/types/dpdpa-widget.types';

/**
 * API endpoint to retrieve analytics data for a widget
 * Requires authentication - users can only view analytics for their own widgets
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const ruleId = searchParams.get('ruleId'); // Optional: filter by specific rule

    if (!widgetId) {
      return NextResponse.json(
        { error: 'widgetId is required' },
        { status: 400 }
      );
    }

    // Verify widget belongs to user
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, user_id')
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (widgetError || !widgetConfig) {
      return NextResponse.json(
        { error: 'Widget not found or access denied' },
        { status: 404 }
      );
    }

    // Build date filter
    const dateFilter = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      end: endDate ? new Date(endDate) : new Date(),
    };

    // Get rule match events
    let matchQuery = supabase
      .from('dpdpa_rule_match_events')
      .select('*')
      .eq('widget_id', widgetId)
      .gte('matched_at', dateFilter.start.toISOString())
      .lte('matched_at', dateFilter.end.toISOString());

    if (ruleId) {
      matchQuery = matchQuery.eq('rule_id', ruleId);
    }

    const { data: matchEvents, error: matchError } = await matchQuery;

    if (matchError) {
      console.error('[Analytics API] Error fetching match events:', matchError);
      return NextResponse.json(
        { error: 'Failed to fetch match events' },
        { status: 500 }
      );
    }

    // Get consent events
    let consentQuery = supabase
      .from('dpdpa_consent_events')
      .select('*')
      .eq('widget_id', widgetId)
      .gte('consented_at', dateFilter.start.toISOString())
      .lte('consented_at', dateFilter.end.toISOString());

    if (ruleId) {
      consentQuery = consentQuery.eq('rule_id', ruleId);
    }

    const { data: consentEvents, error: consentError } = await consentQuery;

    if (consentError) {
      console.error('[Analytics API] Error fetching consent events:', consentError);
      return NextResponse.json(
        { error: 'Failed to fetch consent events' },
        { status: 500 }
      );
    }

    // Calculate rule performance
    const rulePerformanceMap = new Map<string, {
      ruleId: string;
      ruleName: string;
      matchCount: number;
      consentCount: number;
      acceptedCount: number;
      rejectedCount: number;
      partialCount: number;
      matchTimes: number[]; // For calculating average time to consent
      consentTimes: number[];
    }>();

    // Process match events
    (matchEvents || []).forEach((event: any) => {
      const key = event.rule_id;
      if (!rulePerformanceMap.has(key)) {
        rulePerformanceMap.set(key, {
          ruleId: event.rule_id,
          ruleName: event.rule_name,
          matchCount: 0,
          consentCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          partialCount: 0,
          matchTimes: [],
          consentTimes: [],
        });
      }
      const rule = rulePerformanceMap.get(key)!;
      rule.matchCount++;
      rule.matchTimes.push(new Date(event.matched_at).getTime());
    });

    // Process consent events
    (consentEvents || []).forEach((event: any) => {
      if (event.rule_id) {
        const key = event.rule_id;
        if (!rulePerformanceMap.has(key)) {
          rulePerformanceMap.set(key, {
            ruleId: event.rule_id,
            ruleName: event.rule_name || 'Unknown Rule',
            matchCount: 0,
            consentCount: 0,
            acceptedCount: 0,
            rejectedCount: 0,
            partialCount: 0,
            matchTimes: [],
            consentTimes: [],
          });
        }
        const rule = rulePerformanceMap.get(key)!;
        rule.consentCount++;
        rule.consentTimes.push(new Date(event.consented_at).getTime());
        
        if (event.consent_status === 'accepted') {
          rule.acceptedCount++;
        } else if (event.consent_status === 'rejected') {
          rule.rejectedCount++;
        } else if (event.consent_status === 'partial') {
          rule.partialCount++;
        }
      }
    });

    // Calculate rule performance metrics
    const rulePerformance: RulePerformance[] = Array.from(rulePerformanceMap.values()).map(rule => {
      // Calculate rates based on consent count, not match count (since not all matches result in consent)
      const totalConsents = rule.acceptedCount + rule.rejectedCount + rule.partialCount;
      const acceptanceRate = totalConsents > 0 ? (rule.acceptedCount / totalConsents) * 100 : 0;
      const rejectionRate = totalConsents > 0 ? (rule.rejectedCount / totalConsents) * 100 : 0;
      const partialRate = totalConsents > 0 ? (rule.partialCount / totalConsents) * 100 : 0;
      
      // Calculate average time to consent (in seconds)
      let averageTimeToConsent: number | undefined = undefined;
      if (rule.matchTimes.length > 0 && rule.consentTimes.length > 0) {
        // Match each consent to the closest match event (within 1 hour)
        const timeDiffs: number[] = [];
        rule.consentTimes.forEach(consentTime => {
          const closestMatch = rule.matchTimes
            .filter(matchTime => consentTime >= matchTime && consentTime - matchTime <= 3600000) // 1 hour
            .sort((a, b) => Math.abs(consentTime - a) - Math.abs(consentTime - b))[0];
          
          if (closestMatch) {
            timeDiffs.push((consentTime - closestMatch) / 1000); // Convert to seconds
          }
        });
        
        if (timeDiffs.length > 0) {
          averageTimeToConsent = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        }
      }
      
      return {
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        matchCount: rule.matchCount,
        consentCount: rule.consentCount,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        rejectionRate: Math.round(rejectionRate * 100) / 100,
        partialRate: Math.round(partialRate * 100) / 100,
        averageTimeToConsent: averageTimeToConsent ? Math.round(averageTimeToConsent) : undefined,
      };
    });

    // Sort by match count (descending)
    rulePerformance.sort((a, b) => b.matchCount - a.matchCount);

    // Calculate overall metrics
    const totalMatches = (matchEvents || []).length;
    const totalConsents = (consentEvents || []).length;
    const acceptedConsents = (consentEvents || []).filter((e: any) => e.consent_status === 'accepted').length;
    const overallAcceptanceRate = totalConsents > 0 ? (acceptedConsents / totalConsents) * 100 : 0;

    // Get top 5 rules
    const topRules = rulePerformance.slice(0, 5);

    // Calculate consent trends (daily)
    const trendsMap = new Map<string, { matches: number; consents: number; accepted: number }>();
    
    (matchEvents || []).forEach((event: any) => {
      const date = new Date(event.matched_at).toISOString().split('T')[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { matches: 0, consents: 0, accepted: 0 });
      }
      trendsMap.get(date)!.matches++;
    });
    
    (consentEvents || []).forEach((event: any) => {
      const date = new Date(event.consented_at).toISOString().split('T')[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { matches: 0, consents: 0, accepted: 0 });
      }
      trendsMap.get(date)!.consents++;
      if (event.consent_status === 'accepted') {
        trendsMap.get(date)!.accepted++;
      }
    });

    const consentTrends = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        matches: data.matches,
        consents: data.consents,
        acceptanceRate: data.consents > 0 ? (data.accepted / data.consents) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build response
    const analytics: WidgetAnalytics = {
      widgetId: widgetId,
      totalMatches: totalMatches,
      totalConsents: totalConsents,
      overallAcceptanceRate: Math.round(overallAcceptanceRate * 100) / 100,
      rulePerformance: rulePerformance,
      topRules: topRules,
      consentTrends: consentTrends,
    };

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      }
    });

  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
