import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Public endpoint to submit a grievance (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgetId, email, name, message, type } = body || {};

    if (!widgetId || !message) {
      return NextResponse.json({ error: 'widgetId and message are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Insert grievance
    const { data, error } = await supabase
      .from('dpdpa_grievances')
      .insert({
        widget_id: widgetId,
        email: email || null,
        name: name || null,
        message,
        type: type || 'general',
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating grievance:', error);
      return NextResponse.json({ error: 'Failed to submit grievance' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error in grievance POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Authenticated endpoint to list grievances
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    // Get widget ids owned by user
    const { data: widgets } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id);

    const widgetIds = (widgets || []).map((w: any) => w.widget_id);

    let query = supabase
      .from('dpdpa_grievances')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (widgetIds.length > 0) {
      query = query.in('widget_id', widgetIds);
    } else {
      return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching grievances:', error);
      return NextResponse.json({ error: 'Failed to fetch grievances' }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: data || [],
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
    console.error('Error in grievance GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
