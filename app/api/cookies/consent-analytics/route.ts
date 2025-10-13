import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch consent records for the user
    const { data: consents, error: consentsError } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (consentsError) {
      console.error('Error fetching consents:', consentsError);
      return NextResponse.json(
        { error: 'Failed to fetch consent data' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const total = consents?.length || 0;
    const accepted = consents?.filter(c => c.status === 'accepted').length || 0;
    const rejected = consents?.filter(c => c.status === 'rejected').length || 0;
    const partial = consents?.filter(c => c.status === 'partial').length || 0;

    // Device breakdown
    const devices = {
      Desktop: consents?.filter(c => c.device_type === 'Desktop').length || 0,
      Mobile: consents?.filter(c => c.device_type === 'Mobile').length || 0,
      Tablet: consents?.filter(c => c.device_type === 'Tablet').length || 0,
    };

    // Category analytics
    const categoryStats: Record<string, number> = {};
    consents?.forEach(consent => {
      if (Array.isArray(consent.categories)) {
        consent.categories.forEach((cat: string) => {
          categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });
      }
    });

    // Daily trend data (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayConsents = consents?.filter(c => {
        const consentDate = new Date(c.created_at);
        return consentDate >= date && consentDate < nextDate;
      }) || [];

      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        total: dayConsents.length,
        accepted: dayConsents.filter(c => c.status === 'accepted').length,
        rejected: dayConsents.filter(c => c.status === 'rejected').length,
        partial: dayConsents.filter(c => c.status === 'partial').length,
      });
    }

    // Recent consents
    const recentConsents = consents?.slice(0, 10).map(c => ({
      id: c.id,
      consent_id: c.consent_id,
      status: c.status,
      device_type: c.device_type,
      categories: c.categories,
      created_at: c.created_at,
      language: c.language,
    })) || [];

    const analytics = {
      summary: {
        total,
        accepted,
        rejected,
        partial,
        acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(2) : '0',
        rejectionRate: total > 0 ? ((rejected / total) * 100).toFixed(2) : '0',
      },
      devices,
      categories: categoryStats,
      dailyTrends,
      recentConsents,
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
