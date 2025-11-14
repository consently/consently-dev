import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    } = body;

    // Validate required fields
    if (!action || !resourceType || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resourceType, status' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error, data: insertedData } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId || null,
        action: action as AuditAction,
        resource_type: resourceType,
        resource_id: resourceId || null,
        changes: changes || null,
        ip_address: ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        user_agent: userAgent || request.headers.get('user-agent') || null,
        status: status as 'success' | 'failure',
        error_message: errorMessage || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create audit log:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: insertedData?.id });
  } catch (error) {
    console.error('Error in audit log API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

