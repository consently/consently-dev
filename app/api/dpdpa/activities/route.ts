import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure, logSuccess } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for processing activity
const activitySchema = z.object({
  activity_name: z.string()
    .min(3, 'Activity name must be at least 3 characters')
    .max(200, 'Activity name must not exceed 200 characters'),
  industry: z.string()
    .min(2, 'Industry is required')
    .max(100, 'Industry must not exceed 100 characters'),
  data_attributes: z.array(z.string().max(100, 'Data attribute too long'))
    .min(1, 'At least one data attribute is required')
    .max(50, 'Cannot have more than 50 data attributes'),
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(2000, 'Purpose must not exceed 2000 characters'),
  retention_period: z.string()
    .min(1, 'Retention period is required')
    .max(200, 'Retention period must not exceed 200 characters'),
  data_processors: z.any(),
  is_active: z.boolean().optional(),
});

// GET - Fetch all activities for the authenticated user
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const industry = searchParams.get('industry') || 'all';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('processing_activities')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    if (industry !== 'all') {
      query = query.eq('industry', industry);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      await logFailure(user.id, 'activity.create', 'processing_activities', error.message, request);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
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
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new processing activity
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = activitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const activityData = validationResult.data;

    // Insert activity
    const { data, error } = await supabase
      .from('processing_activities')
      .insert({
        user_id: user.id,
        activity_name: activityData.activity_name,
        industry: activityData.industry,
        data_attributes: activityData.data_attributes,
        purpose: activityData.purpose,
        retention_period: activityData.retention_period,
        data_processors: activityData.data_processors || {},
        is_active: activityData.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      await logFailure(user.id, 'activity.create', 'processing_activities', error.message, request);
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
    }

    // Log success
    await logSuccess(user.id, 'activity.create', 'processing_activities', data.id, activityData, request);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing processing activity
export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Validate update data
    const validationResult = activitySchema.partial().safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Update activity
    const { data, error } = await supabase
      .from('processing_activities')
      .update(validationResult.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      await logFailure(user.id, 'activity.update', 'processing_activities', error.message, request);
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Log success
    await logSuccess(user.id, 'activity.update', 'processing_activities', data.id, updateData, request);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a processing activity
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Delete activity
    const { error } = await supabase
      .from('processing_activities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting activity:', error);
      await logFailure(user.id, 'activity.delete', 'processing_activities', error.message, request);
      return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
    }

    // Log success
    await logSuccess(user.id, 'activity.delete', 'processing_activities', id, undefined, request);

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
