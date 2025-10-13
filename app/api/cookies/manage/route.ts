import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieService } from '@/lib/cookies/cookie-service';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/cookies/manage
 * Get all cookies for the authenticated user with filtering
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const domain = searchParams.get('domain') || undefined;
    const is_active = searchParams.get('is_active') === 'true' ? true : 
                     searchParams.get('is_active') === 'false' ? false : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get cookies using service
    const result = await CookieService.getCookies(user.id, {
      category,
      domain,
      is_active,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.cookies,
      total: result.total,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching cookies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cookies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/manage
 * Create a new cookie
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

    // Validate required fields
    if (!body.name || !body.domain || !body.category || !body.purpose || !body.expiry) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, category, purpose, expiry' },
        { status: 400 }
      );
    }

    // Create cookie
    const cookie = await CookieService.createCookie({
      ...body,
      user_id: user.id,
    });

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'cookie_created',
      resource_type: 'cookie',
      resource_id: cookie.id,
      changes: { created: cookie },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: cookie,
    });

  } catch (error) {
    console.error('Error creating cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create cookie' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cookies/manage
 * Update an existing cookie
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

    if (!body.id) {
      return NextResponse.json(
        { error: 'Cookie ID is required' },
        { status: 400 }
      );
    }

    // Get old cookie for audit
    const oldCookie = await CookieService.getCookie(user.id, body.id);

    // Update cookie
    const { id, ...updates } = body;
    const updatedCookie = await CookieService.updateCookie(user.id, id, updates);

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'cookie_updated',
      resource_type: 'cookie',
      resource_id: updatedCookie.id,
      changes: { before: oldCookie, after: updatedCookie },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: updatedCookie,
    });

  } catch (error) {
    console.error('Error updating cookie:', error);
    return NextResponse.json(
      { error: 'Failed to update cookie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/manage
 * Delete a cookie
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
    const cookieId = searchParams.get('id');

    if (!cookieId) {
      return NextResponse.json(
        { error: 'Cookie ID is required' },
        { status: 400 }
      );
    }

    // Get cookie for audit before deletion
    const cookie = await CookieService.getCookie(user.id, cookieId);

    // Delete cookie
    await CookieService.deleteCookie(user.id, cookieId);

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'cookie_deleted',
      resource_type: 'cookie',
      resource_id: cookieId,
      changes: { deleted: cookie },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Cookie deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting cookie:', error);
    return NextResponse.json(
      { error: 'Failed to delete cookie' },
      { status: 500 }
    );
  }
}
