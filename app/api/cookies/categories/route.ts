import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieService } from '@/lib/cookies/cookie-service';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

/**
 * Cookie Categories API
 * Comprehensive CRUD operations for cookie categories
 * 
 * Features:
 * - Full CRUD operations
 * - Bulk create/update/delete
 * - Import/export functionality
 * - Category ordering
 */

const categorySchema = z.object({
  category_id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  is_required: z.boolean().optional().default(false),
  display_order: z.number().int().min(0).optional().default(0),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_active: z.boolean().optional().default(true),
});

const bulkCategorySchema = z.object({
  categories: z.array(categorySchema).min(1, 'At least one category required'),
});

type CategoryInput = z.infer<typeof categorySchema>;

/**
 * GET /api/cookies/categories
 * Get all categories for the authenticated user
 */
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

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const exportFormat = searchParams.get('export');

    // Get categories
    let query = supabase
      .from('cookie_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) throw error;

    // Handle export formats
    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(categories, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="cookie-categories-${Date.now()}.json"`,
        },
      });
    }

    if (exportFormat === 'csv') {
      const csv = convertToCSV(categories);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cookie-categories-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/categories
 * Create new category or bulk create
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if bulk operation
    if (body.categories && Array.isArray(body.categories)) {
      // Bulk create
      const validationResult = bulkCategorySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Invalid request data',
            details: validationResult.error.issues 
          },
          { status: 400 }
        );
      }

      const categoriesToCreate = validationResult.data.categories.map(cat => ({
        ...cat,
        user_id: user.id,
      }));

      const { data: created, error } = await supabase
        .from('cookie_categories')
        .insert(categoriesToCreate)
        .select();

      if (error) throw error;

      // Log audit
      await logAudit({
        user_id: user.id,
        action: 'categories_bulk_created',
        resource_type: 'cookie_category',
        changes: { count: created?.length },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: `${created?.length} categories created successfully`,
        data: created,
      });
    }

    // Single create
    const validationResult = categorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const category = await CookieService.createCategory({
      ...validationResult.data,
      user_id: user.id,
    });

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'category_created',
      resource_type: 'cookie_category',
      resource_id: category.id,
      changes: { created: category },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: category,
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cookies/categories
 * Update category or bulk update
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if bulk update (reordering)
    if (body.reorder && Array.isArray(body.categories)) {
      // Bulk reorder categories
      const updates = body.categories.map((cat: any) => ({
        id: cat.id,
        display_order: cat.display_order,
      }));

      // Update each category's display order
      for (const update of updates) {
        await supabase
          .from('cookie_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      // Log audit
      await logAudit({
        user_id: user.id,
        action: 'categories_reordered',
        resource_type: 'cookie_category',
        changes: { reordered: updates.length },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: `${updates.length} categories reordered successfully`,
      });
    }

    // Single update
    if (!body.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { id, ...updates } = body;
    const category = await CookieService.updateCategory(user.id, id, updates);

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'category_updated',
      resource_type: 'cookie_category',
      resource_id: category.id,
      changes: { updates },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: category,
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/categories
 * Delete category or bulk delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('id');
    const bulkIds = searchParams.get('ids'); // Comma-separated IDs

    // Bulk delete
    if (bulkIds) {
      const ids = bulkIds.split(',').filter(id => id.trim());
      
      if (ids.length === 0) {
        return NextResponse.json(
          { error: 'No valid category IDs provided' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('cookie_categories')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log audit
      await logAudit({
        user_id: user.id,
        action: 'categories_bulk_deleted',
        resource_type: 'cookie_category',
        changes: { deleted: ids },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} categories deleted successfully`,
      });
    }

    // Single delete
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await CookieService.deleteCategory(user.id, categoryId);

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'category_deleted',
      resource_type: 'cookie_category',
      resource_id: categoryId,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to convert categories to CSV
 */
function convertToCSV(categories: any[]): string {
  if (!categories || categories.length === 0) {
    return 'No data';
  }

  const headers = ['id', 'category_id', 'name', 'description', 'is_required', 'display_order', 'icon', 'color', 'is_active'];
  const rows = categories.map(cat => 
    headers.map(header => {
      const value = cat[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
