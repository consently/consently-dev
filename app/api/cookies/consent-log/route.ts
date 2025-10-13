import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieService } from '@/lib/cookies/cookie-service';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

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
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if batch operation
    if (body.logs && Array.isArray(body.logs)) {
      return await handleBatchConsent(user.id, body, request);
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

    // Create consent log
    const consentLog = await CookieService.logConsent({
      user_id: user.id,
      ...logData,
    });

    // Generate receipt if requested
    let receipt = null;
    if (logData.send_receipt && logData.visitor_email) {
      receipt = await generateConsentReceipt(
        user.id,
        logData.consent_id,
        logData.visitor_email,
        logData
      );

      // Send email with receipt
      await sendConsentReceiptEmail(
        logData.visitor_email,
        receipt,
        logData
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        consentLog,
        receipt: receipt ? {
          receiptNumber: receipt.receipt_number,
          receiptUrl: `/api/cookies/consent-log/receipt?id=${receipt.receipt_number}`,
        } : null,
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
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const consentType = searchParams.get('consent_type') || undefined;
    const visitorToken = searchParams.get('visitor_token') || undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get consent logs
    const result = await CookieService.getConsentLogs(user.id, {
      status,
      consent_type: consentType,
      visitor_token: visitorToken,
      start_date: startDate,
      end_date: endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      total: result.total,
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

    const supabase = await createClient();

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

    // Update viewed timestamp
    await supabase
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
  userId: string,
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

  // Process each log
  for (let i = 0; i < logs.length; i++) {
    try {
      const logData = logs[i];
      
      const consentLog = await CookieService.logConsent({
        user_id: userId,
        ...logData,
      });

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

/**
 * Generate consent receipt
 */
async function generateConsentReceipt(
  userId: string,
  consentId: string,
  visitorEmail: string,
  consentData: any
) {
  const supabase = await createClient();

  // Generate receipt number
  const { data: receiptNumber } = await supabase
    .rpc('generate_consent_receipt', { p_consent_id: consentId });

  // Create receipt HTML
  const receiptHtml = generateReceiptHtml(receiptNumber, consentData);

  // Store receipt
  const { data: receipt, error } = await supabase
    .from('consent_receipts')
    .insert({
      user_id: userId,
      consent_id: consentId,
      visitor_email: visitorEmail,
      receipt_number: receiptNumber,
      consent_data: consentData,
      receipt_html: receiptHtml,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return receipt;
}

/**
 * Generate receipt HTML
 */
function generateReceiptHtml(receiptNumber: string, consentData: any): string {
  const date = new Date().toLocaleString();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consent Receipt - ${receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Consent Receipt</h1>
    <p style="margin: 5px 0 0 0;">Receipt #${receiptNumber}</p>
  </div>
  <div class="content">
    <div class="field">
      <div class="label">Date:</div>
      <div class="value">${date}</div>
    </div>
    <div class="field">
      <div class="label">Consent ID:</div>
      <div class="value">${consentData.consent_id}</div>
    </div>
    <div class="field">
      <div class="label">Status:</div>
      <div class="value">${consentData.status}</div>
    </div>
    <div class="field">
      <div class="label">Consent Type:</div>
      <div class="value">${consentData.consent_type}</div>
    </div>
    <div class="field">
      <div class="label">Categories:</div>
      <div class="value">${consentData.categories?.join(', ') || 'None'}</div>
    </div>
    ${consentData.page_url ? `
    <div class="field">
      <div class="label">Website:</div>
      <div class="value">${consentData.page_url}</div>
    </div>
    ` : ''}
    <div class="footer">
      <p>This is an automated receipt for your consent preferences. You can update your preferences at any time by visiting the website.</p>
      <p>Powered by Consently - DPDPA 2023 & GDPR Compliant</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send consent receipt email
 */
async function sendConsentReceiptEmail(
  email: string,
  receipt: any,
  consentData: any
) {
  try {
    await sendEmail(
      'consent_receipt',
      email,
      {
        receipt_number: receipt.receipt_number,
        consent_id: consentData.consent_id,
        status: consentData.status,
        categories: consentData.categories?.join(', ') || 'None',
        date: new Date().toLocaleString(),
        website: consentData.page_url || 'N/A',
      }
    );
  } catch (error) {
    console.error('Failed to send consent receipt email:', error);
    // Don't throw - email failures shouldn't fail the consent log
  }
}
