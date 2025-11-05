import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure, logSuccess } from '@/lib/audit';
import { z } from 'zod';
import { processingActivityStructuredSchema } from '@/lib/schemas';

// Helper function to fetch activity with all related data
async function fetchActivityWithDetails(supabase: any, activityId: string, userId: string) {
  // Fetch the main activity
  const { data: activity, error: activityError } = await supabase
    .from('processing_activities')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', userId)
    .single();

  if (activityError || !activity) {
    console.error('Error fetching activity:', activityError);
    return { data: null, error: activityError || new Error('Activity not found') };
  }

  // Fetch purposes with their data categories
  const { data: activityPurposes, error: purposesError } = await supabase
    .from('activity_purposes')
    .select(`
      id,
      activity_id,
      purpose_id,
      legal_basis,
      custom_description,
      purposes (
        id,
        purpose_name,
        description
      )
    `)
    .eq('activity_id', activityId);

  if (purposesError) {
    console.error('Error fetching activity purposes for', activityId, ':', purposesError);
    // Don't return null - continue with empty purposes instead
  }

  // Fetch data categories for each purpose
  const purposesWithCategories = await Promise.all(
    (activityPurposes || []).map(async (ap: any) => {
      const { data: categories, error: categoriesError } = await supabase
        .from('purpose_data_categories')
        .select('*')
        .eq('activity_purpose_id', ap.id);

      if (categoriesError) {
        console.error('Error fetching categories for purpose', ap.id, ':', categoriesError);
      }

      return {
        id: ap.id,
        purposeId: ap.purpose_id,
        purposeName: ap.purposes?.purpose_name || 'Unknown Purpose',
        legalBasis: ap.legal_basis,
        customDescription: ap.custom_description,
        dataCategories: (categories || []).map((c: any) => ({
          id: c.id,
          categoryName: c.category_name,
          retentionPeriod: c.retention_period,
        })),
      };
    })
  );

  // Fetch data sources
  const { data: sources, error: sourcesError } = await supabase
    .from('data_sources')
    .select('source_name')
    .eq('activity_id', activityId);

  if (sourcesError) {
    console.error('Error fetching data sources for', activityId, ':', sourcesError);
  }

  // Fetch data recipients
  const { data: recipients, error: recipientsError } = await supabase
    .from('data_recipients')
    .select('recipient_name')
    .eq('activity_id', activityId);

  if (recipientsError) {
    console.error('Error fetching data recipients for', activityId, ':', recipientsError);
  }

  return {
    data: {
      id: activity.id,
      userId: activity.user_id,
      activityName: activity.activity_name,
      industry: activity.industry,
      purposes: purposesWithCategories,
      dataSources: (sources || []).map((s: any) => s.source_name),
      dataRecipients: (recipients || []).map((r: any) => r.recipient_name),
      isActive: activity.is_active,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
      // Legacy fields for backward compatibility
      purpose: activity.purpose,
      retentionPeriod: activity.retention_period,
      dataAttributes: activity.data_attributes,
    },
    error: null,
  };
}

// Validation schema for legacy format (backward compatibility)
const activitySchemaLegacy = z.object({
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

    // Fetch complete activity details for each activity
    const activitiesWithDetails = await Promise.all(
      (data || []).map(async (activity) => {
        const { data: completeActivity } = await fetchActivityWithDetails(supabase, activity.id, user.id);
        return completeActivity;
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: activitiesWithDetails.filter(Boolean),
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

    // Parse request body
    const body = await request.json();

    // Validate using structured schema
    const validation = processingActivityStructuredSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const activityData = validation.data;

    // Insert main activity
    const { data: activity, error: activityError } = await supabase
      .from('processing_activities')
      .insert({
        user_id: user.id,
        activity_name: activityData.activityName,
        industry: activityData.industry,
        is_active: true,
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity:', activityError);
      await logFailure(user.id, 'activity.create', 'processing_activities', activityError.message, request);
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
    }

    // Insert purposes and their data categories
    console.log('=== STARTING PURPOSE INSERTION ===');
    console.log('Total purposes to insert:', activityData.purposes.length);
    console.log('Activity ID:', activity.id);
    
    for (const purpose of activityData.purposes) {
      console.log('=== INSERTING PURPOSE ===');
      console.log('Purpose data received:', JSON.stringify(purpose, null, 2));
      console.log('Purpose ID:', purpose.purposeId);
      console.log('Purpose ID type:', typeof purpose.purposeId);
      console.log('Purpose Name:', purpose.purposeName);
      console.log('Legal Basis:', purpose.legalBasis);
      console.log('Data Categories count:', purpose.dataCategories?.length || 0);
      
      // Validate purpose_id exists
      console.log('Validating purpose exists in database...');
      const { data: purposeExists, error: checkError } = await supabase
        .from('purposes')
        .select('id, purpose_name, is_predefined')
        .eq('id', purpose.purposeId)
        .single();
      
      console.log('Validation result:', {
        found: !!purposeExists,
        error: checkError?.message || null,
        data: purposeExists
      });
      
      if (checkError || !purposeExists) {
        console.error('❌ PURPOSE VALIDATION FAILED');
        console.error('Purpose ID that failed:', purpose.purposeId);
        console.error('Check error:', checkError);
        console.error('Purpose exists:', purposeExists);
        
        // Try to find by name as fallback
        console.log('Attempting fallback lookup by name:', purpose.purposeName);
        const { data: purposeByName, error: nameError } = await supabase
          .from('purposes')
          .select('id, purpose_name')
          .eq('purpose_name', purpose.purposeName)
          .single();
        
        console.log('Name lookup result:', {
          found: !!purposeByName,
          error: nameError?.message || null,
          data: purposeByName
        });
        
        // Rollback by deleting the activity
        console.error('ROLLING BACK - Deleting activity:', activity.id);
        await supabase.from('processing_activities').delete().eq('id', activity.id);
        await logFailure(user.id, 'activity.create', 'processing_activities', `Invalid purpose_id: ${purpose.purposeId}`, request);
        return NextResponse.json({ 
          error: 'Invalid purpose ID. The selected purpose does not exist in the database.',
          details: { 
            purposeId: purpose.purposeId, 
            purposeName: purpose.purposeName,
            checkError: checkError?.message,
            hint: 'Check server logs for detailed debugging information'
          }
        }, { status: 400 });
      }
      
      console.log('✅ Purpose validated successfully:', purposeExists.purpose_name);
      
      // Insert activity_purpose
      console.log('Inserting into activity_purposes table...');
      const insertData = {
        activity_id: activity.id,
        purpose_id: purpose.purposeId,
        legal_basis: purpose.legalBasis,
        custom_description: purpose.customDescription || null,
      };
      console.log('Insert data:', JSON.stringify(insertData, null, 2));
      
      const { data: activityPurpose, error: purposeError } = await supabase
        .from('activity_purposes')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result:', {
        success: !purposeError,
        error: purposeError?.message || null,
        data: activityPurpose
      });

      if (purposeError) {
        console.error('❌ ERROR INSERTING ACTIVITY PURPOSE');
        console.error('Full error object:', JSON.stringify(purposeError, null, 2));
        console.error('Error message:', purposeError.message);
        console.error('Error code:', purposeError.code);
        console.error('Error details:', purposeError.details);
        console.error('Error hint:', purposeError.hint);
        console.error('Purpose data:', { activity_id: activity.id, purpose_id: purpose.purposeId });
        
        // Rollback by deleting the activity
        console.error('ROLLING BACK - Deleting activity:', activity.id);
        await supabase.from('processing_activities').delete().eq('id', activity.id);
        await logFailure(user.id, 'activity.create', 'processing_activities', purposeError.message, request);
        return NextResponse.json({ 
          error: 'Failed to create activity purposes',
          details: {
            message: purposeError.message,
            code: purposeError.code,
            hint: purposeError.hint
          }
        }, { status: 500 });
      }
      
      console.log('✅ Activity purpose created successfully:', activityPurpose.id);

      // Insert data categories for this purpose
      if (purpose.dataCategories.length > 0) {
        const categoryInserts = purpose.dataCategories.map((cat) => ({
          activity_purpose_id: activityPurpose.id,
          category_name: cat.categoryName,
          retention_period: cat.retentionPeriod,
        }));

        const { error: categoriesError } = await supabase
          .from('purpose_data_categories')
          .insert(categoryInserts);

        if (categoriesError) {
          console.error('Error creating data categories:', categoriesError);
          // Rollback
          await supabase.from('processing_activities').delete().eq('id', activity.id);
          await logFailure(user.id, 'activity.create', 'processing_activities', categoriesError.message, request);
          return NextResponse.json({ error: 'Failed to create data categories' }, { status: 500 });
        }
      }
    }

    // Insert data sources
    if (activityData.dataSources && activityData.dataSources.length > 0) {
      const sourceInserts = activityData.dataSources.map((source) => ({
        activity_id: activity.id,
        source_name: source,
      }));

      const { error: sourcesError } = await supabase.from('data_sources').insert(sourceInserts);
      if (sourcesError) {
        console.error('Error creating data sources:', sourcesError);
        // Non-critical, continue
      }
    }

    // Insert data recipients
    if (activityData.dataRecipients && activityData.dataRecipients.length > 0) {
      const recipientInserts = activityData.dataRecipients.map((recipient) => ({
        activity_id: activity.id,
        recipient_name: recipient,
      }));

      const { error: recipientsError } = await supabase.from('data_recipients').insert(recipientInserts);
      if (recipientsError) {
        console.error('Error creating data recipients:', recipientsError);
        // Non-critical, continue
      }
    }

    // Fetch the complete activity with all related data
    const { data: completeActivity, error: fetchError } = await fetchActivityWithDetails(
      supabase,
      activity.id,
      user.id
    );

    if (fetchError) {
      console.error('Error fetching complete activity:', fetchError);
      // Return basic activity if fetch fails
      await logSuccess(user.id, 'activity.create', 'processing_activities', activity.id, activityData, request);
      return NextResponse.json({ data: activity }, { status: 201 });
    }

    // Log success
    await logSuccess(user.id, 'activity.create', 'processing_activities', activity.id, activityData, request);

    return NextResponse.json({ data: completeActivity }, { status: 201 });
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

    // Validate update data using structured schema
    const validation = processingActivityStructuredSchema.safeParse(updateData);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const activityData = validation.data;

    // Verify activity belongs to user
    const { data: existingActivity, error: checkError } = await supabase
      .from('processing_activities')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Update main activity
    const { error: updateError } = await supabase
      .from('processing_activities')
      .update({
        activity_name: activityData.activityName,
        industry: activityData.industry,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating activity:', updateError);
      await logFailure(user.id, 'activity.update', 'processing_activities', updateError.message, request);
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }

    // Delete existing purposes and related data
    await supabase.from('activity_purposes').delete().eq('activity_id', id);
    
    // Delete existing data sources and recipients
    await supabase.from('data_sources').delete().eq('activity_id', id);
    await supabase.from('data_recipients').delete().eq('activity_id', id);

    // Insert new purposes and their data categories
    for (const purpose of activityData.purposes) {
      const { data: activityPurpose, error: purposeError } = await supabase
        .from('activity_purposes')
        .insert({
          activity_id: id,
          purpose_id: purpose.purposeId,
          legal_basis: purpose.legalBasis,
          custom_description: purpose.customDescription || null,
        })
        .select()
        .single();

      if (purposeError) {
        console.error('Error updating activity purpose:', purposeError);
        await logFailure(user.id, 'activity.update', 'processing_activities', purposeError.message, request);
        return NextResponse.json({ error: 'Failed to update activity purposes' }, { status: 500 });
      }

      // Insert data categories for this purpose
      if (purpose.dataCategories.length > 0) {
        const categoryInserts = purpose.dataCategories.map((cat) => ({
          activity_purpose_id: activityPurpose.id,
          category_name: cat.categoryName,
          retention_period: cat.retentionPeriod,
        }));

        const { error: categoriesError } = await supabase
          .from('purpose_data_categories')
          .insert(categoryInserts);

        if (categoriesError) {
          console.error('Error updating data categories:', categoriesError);
          await logFailure(user.id, 'activity.update', 'processing_activities', categoriesError.message, request);
          return NextResponse.json({ error: 'Failed to update data categories' }, { status: 500 });
        }
      }
    }

    // Insert new data sources
    if (activityData.dataSources && activityData.dataSources.length > 0) {
      const sourceInserts = activityData.dataSources.map((source) => ({
        activity_id: id,
        source_name: source,
      }));
      await supabase.from('data_sources').insert(sourceInserts);
    }

    // Insert new data recipients
    if (activityData.dataRecipients && activityData.dataRecipients.length > 0) {
      const recipientInserts = activityData.dataRecipients.map((recipient) => ({
        activity_id: id,
        recipient_name: recipient,
      }));
      await supabase.from('data_recipients').insert(recipientInserts);
    }

    // Fetch the complete updated activity
    const { data: completeActivity, error: fetchError } = await fetchActivityWithDetails(
      supabase,
      id,
      user.id
    );

    if (fetchError) {
      console.error('Error fetching updated activity:', fetchError);
    }

    // Log success
    await logSuccess(user.id, 'activity.update', 'processing_activities', id, activityData, request);

    return NextResponse.json({ data: completeActivity || { id } });
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
