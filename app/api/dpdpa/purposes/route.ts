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
      console.error('[Purposes API] Authentication error:', authError?.message || 'No user');
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
      console.error('[Purposes API] Database error:', error.message, error.details, error.hint);
      return NextResponse.json({ 
        error: 'Failed to fetch purposes',
        details: error.message,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('[Purposes API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const { purposeName, description, dataSources, dataRecipients } = body;

    if (!purposeName || purposeName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Purpose name must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Trim and normalize purpose name
    const normalizedPurposeName = purposeName.trim();

    // Check if purpose already exists (case-insensitive)
    const { data: existingPurpose } = await supabase
      .from('purposes')
      .select('id, purpose_name, is_predefined')
      .ilike('purpose_name', normalizedPurposeName)
      .single();

    if (existingPurpose) {
      return NextResponse.json(
        { 
          error: 'A purpose with this name already exists',
          existingPurpose: {
            id: existingPurpose.id,
            purposeName: existingPurpose.purpose_name,
            isPredefined: existingPurpose.is_predefined
          }
        },
        { status: 409 }
      );
    }

    // Convert arrays to comma-separated strings for storage (optional metadata)
    const dataSourcesStr = Array.isArray(dataSources) && dataSources.length > 0
      ? dataSources.join(', ')
      : null;
    const dataRecipientsStr = Array.isArray(dataRecipients) && dataRecipients.length > 0
      ? dataRecipients.join(', ')
      : null;

    // Insert custom purpose with same structure as predefined ones
    const { data, error } = await supabase
      .from('purposes')
      .insert({
        purpose_name: normalizedPurposeName,
        name: normalizedPurposeName, // Display name (same as purpose_name for consistency)
        description: description?.trim() || null,
        data_category: dataSourcesStr, // Optional: store data sources as metadata
        retention_period: dataRecipientsStr, // Optional: store data recipients as metadata
        is_predefined: false, // This is what distinguishes custom from predefined
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

      console.error('[Purposes API] Error creating purpose:', error.message, error.details, error.hint);
      return NextResponse.json({ 
        error: 'Failed to create purpose',
        details: error.message,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/dpdpa/purposes:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
