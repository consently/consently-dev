import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all available purposes
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

    const searchParams = request.nextUrl.searchParams;
    const predefinedOnly = searchParams.get('predefined') === 'true';

    // Build query
    let query = supabase
      .from('purposes')
      .select('*')
      .order('is_predefined', { ascending: false })
      .order('purpose_name', { ascending: true });

    // Filter for predefined purposes only if requested
    if (predefinedOnly) {
      query = query.eq('is_predefined', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching purposes:', error);
      return NextResponse.json({ error: 'Failed to fetch purposes' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a custom purpose
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { purposeName, description } = body;

    if (!purposeName || purposeName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Purpose name must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Insert custom purpose
    const { data, error } = await supabase
      .from('purposes')
      .insert({
        purpose_name: purposeName,
        description: description || null,
        is_predefined: false,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate purpose name
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A purpose with this name already exists' },
          { status: 409 }
        );
      }

      console.error('Error creating purpose:', error);
      return NextResponse.json({ error: 'Failed to create purpose' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
