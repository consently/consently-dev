import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure } from '@/lib/audit';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('consent_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply search filter (search by consent_id)
    if (search) {
      query = query.ilike('consent_id', `%${search}%`);
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply type filter
    if (type !== 'all') {
      query = query.eq('consent_type', type);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching consent records:', error);
      await logFailure(user.id, 'consent.record', 'consent_records', error.message, request);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // Fetch aggregated statistics (separate from pagination)
    const { data: allRecords } = await supabase
      .from('consent_records')
      .select('status, consent_id')
      .eq('user_id', user.id);

    const stats = {
      acceptedCount: allRecords?.filter(r => r.status === 'accepted').length || 0,
      rejectedCount: allRecords?.filter(r => r.status === 'rejected').length || 0,
      partialCount: allRecords?.filter(r => r.status === 'partial').length || 0,
      revokedCount: allRecords?.filter(r => r.status === 'revoked').length || 0,
      uniqueVisitors: new Set(allRecords?.map(r => r.consent_id) || []).size,
    };

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      stats,
    });

    // Disable caching to ensure real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    // Delete record
    const { error } = await supabase
      .from('consent_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting consent record:', error);
      await logFailure(user.id, 'consent.revoke', 'consent_records', error.message, request);
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
