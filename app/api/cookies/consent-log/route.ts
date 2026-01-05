import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const runtime = 'edge';

// Initialize Supabase client for Edge
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    }
  }
);

/**
 * Enhanced Consent Logging API
 * POST /api/cookies/consent-log
 * 
 * Features:
 * - Single and batch consent logging
 * - Automatic receipt generation
 * - Email notifications
 * - Visitor token tracking
 * - Device and geo information
 */

const consentLogSchema = z.object({
  consent_id: z.string().min(1),
  visitor_token: z.string().min(1),
  widget_id: z.string().optional(), // Widget ID for tracking (added in migration 08)
  consent_type: z.enum(['cookie', 'dpdpa', 'gdpr']),
  status: z.enum(['accepted', 'rejected', 'partial', 'revoked', 'updated']),
  categories: z.array(z.string()).optional().default([]),
  cookies_accepted: z.array(z.string()).optional(),
  cookies_rejected: z.array(z.string()).optional(),
  device_info: z.object({
    type: z.string().optional(),
    os: z.string().optional(),
    browser: z.string().optional(),
  }).optional(),
  geo_location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  referrer: z.string().optional(),
  page_url: z.string().url().optional(),
  language: z.string().optional().default('en'),
  browser_fingerprint: z.string().optional(),
  consent_method: z.enum(['banner', 'settings_modal', 'api', 'implicit']).optional().default('banner'),
  widget_version: z.string().optional(),
  tcf_string: z.string().optional(),
  visitor_email: z.string().email().optional(),
  send_receipt: z.boolean().optional().default(false),
});

const batchConsentLogSchema = z.object({
  logs: z.array(consentLogSchema).min(1).max(100), // Max 100 per batch
});

type ConsentLogInput = z.infer<typeof consentLogSchema>;

/**
 * POST /api/cookies/consent-log
 * Log consent with optional receipt generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if batch operation
    if (body.logs && Array.isArray(body.logs)) {
      return await handleBatchConsent(body, request);
    }

    // Single consent log
    const validationResult = consentLogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const logData = validationResult.data;

    // Verify widget exists and get owner user_id
    const { data: widget, error: widgetError } = await supabase
      .from('widget_configs')
      .select('user_id')
      .eq('widget_id', logData.widget_id)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Invalid widget_id' }, { status: 404 });
    }

    // Create consent log
    const { data: consentLog, error: logError } = await supabase
      .from('consent_logs')
      .insert({
        user_id: widget.user_id,
        ...logData,
      })
      .select()
      .single();

    if (logError) throw logError;

    // Trigger analytics aggregation asynchronously (Edge-friendly)
    const today = new Date().toISOString().split('T')[0];
    // In Edge, we fire and forget
    // supabase.rpc returns a promise-like object
    void supabase.rpc('aggregate_consent_analytics', {
      p_user_id: widget.user_id,
      p_date: today,
    });

    return NextResponse.json({
      success: true,
      data: {
        consentLog,
      },
    });

  } catch (error) {
    console.error('Error logging consent:', error);
    return NextResponse.json(
      { error: 'Failed to log consent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cookies/consent-log
 * Get consent logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widget_id');

    if (!widgetId) {
      return NextResponse.json({ error: 'widget_id is required' }, { status: 400 });
    }

    const status = searchParams.get('status') || undefined;
    const consentType = searchParams.get('consent_type') || undefined;
    const visitorToken = searchParams.get('visitor_token') || undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('consent_logs')
      .select('*', { count: 'exact' })
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (consentType) query = query.eq('consent_type', consentType);
    if (visitorToken) query = query.eq('visitor_token', visitorToken);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: logs || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching consent logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cookies/consent-log/receipt
 * Get consent receipt by receipt number
 */
export async function receiptGET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const receiptId = searchParams.get('id');

    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 }
      );
    }

    const { data: receipt, error } = await supabase
      .from('consent_receipts')
      .select('*')
      .eq('receipt_number', receiptId)
      .single();

    if (error || !receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Update viewed timestamp (Fire and forget)
    void supabase
      .from('consent_receipts')
      .update({ viewed_at: new Date().toISOString() })
      .eq('receipt_number', receiptId);

    return NextResponse.json({
      success: true,
      data: receipt,
    });

  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}

/**
 * Handle batch consent logging
 */
async function handleBatchConsent(
  body: any,
  request: NextRequest
) {
  const validationResult = batchConsentLogSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid batch request data',
        details: validationResult.error.issues 
      },
      { status: 400 }
    );
  }

  const { logs } = validationResult.data;
  const results = [];
  const errors = [];

  // Process each log (Optimized for Edge)
  for (let i = 0; i < logs.length; i++) {
    try {
      const logData = logs[i];
      
      // Verify widget
      const { data: widget } = await supabase
        .from('widget_configs')
        .select('user_id')
        .eq('widget_id', logData.widget_id)
        .single();

      if (!widget) {
        throw new Error('Invalid widget_id');
      }

      const { data: consentLog, error: logError } = await supabase
        .from('consent_logs')
        .insert({
          user_id: widget.user_id,
          ...logData,
        })
        .select()
        .single();

      if (logError) throw logError;

      results.push({
        index: i,
        success: true,
        consentId: logData.consent_id,
        logId: consentLog.id,
      });

    } catch (error) {
      errors.push({
        index: i,
        consentId: logs[i].consent_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    message: `Processed ${results.length}/${logs.length} consent logs`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
