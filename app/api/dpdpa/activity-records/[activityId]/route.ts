import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const supabase = await createClient();
    const { activityId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'accepted'; // accepted, declined (includes rejected/withdrawn)
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Verify activity belongs to user (indirectly via widget ownership or just strict RLS? RLS should handle it if set up correctly, but let's check activity ownership first)
    const { data: activity, error: activityError } = await supabase
      .from('processing_activities')
      .select('id, activity_name')
      .eq('id', activityId)
      .eq('user_id', user.id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Activity not found or access denied' }, { status: 404 });
    }

    // Build query for consent records
    let query = supabase
      .from('visitor_consent_preferences')
      .select('*', { count: 'exact' })
      .eq('activity_id', activityId);

    // Filter by status
    if (status === 'accepted') {
      query = query.eq('consent_status', 'accepted');
    } else if (status === 'declined') {
      // "Declined" view includes rejected and withdrawn
      query = query.in('consent_status', ['rejected', 'withdrawn']);
    }

    // Search filter (by visitor_id)
    if (search) {
      query = query.ilike('visitor_id', `%${search}%`);
    }

    // Pagination and Sorting
    query = query
      .order('last_updated', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching activity records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    // Transform data for UI
    const records = data.map(record => ({
      principalId: record.visitor_id,
      name: record.visitor_email || (record.visitor_email_hash ? 'Verified User (Hidden)' : 'Anonymous Visitor'),
      consentDate: record.consent_given_at || record.last_updated,
      noticeVersion: record.consent_version,
      channel: record.device_type || 'Unknown',
      status: record.consent_status,
      declineDate: record.consent_status !== 'accepted' ? record.last_updated : null,
      reason: null, // Reason not stored in preferences table, would need to join history or logs
    }));

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

