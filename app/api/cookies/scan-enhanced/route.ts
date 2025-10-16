import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieScanner } from '@/lib/cookies/cookie-scanner';
import { CookieService } from '@/lib/cookies/cookie-service';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

/**
 * Enhanced Cookie Scanning API
 * POST /api/cookies/scan-enhanced
 * 
 * Features:
 * - Async scanning with status tracking
 * - Real-time progress updates
 * - Automatic cookie import
 * - Webhook notifications
 * - Compliance scoring
 */

const scanRequestSchema = z.object({
  url: z.string().url('Invalid website URL'),
  scanDepth: z.enum(['shallow', 'medium', 'deep']),
  autoImport: z.boolean().optional().default(true),
  webhookUrl: z.string().url().optional(),
  scheduledFor: z.string().datetime().optional(),
});

type ScanRequest = z.infer<typeof scanRequestSchema>;

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = scanRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { url, scanDepth, autoImport, webhookUrl, scheduledFor } = validationResult.data;

    // Check if a scan is already running for this URL
    const { data: existingScans } = await supabase
      .from('cookie_scan_history')
      .select('scan_id, scan_status')
      .eq('user_id', user.id)
      .eq('website_url', url)
      .eq('scan_status', 'running')
      .limit(1);

    if (existingScans && existingScans.length > 0) {
      return NextResponse.json(
        { 
          error: 'A scan is already running for this URL',
          scanId: existingScans[0].scan_id 
        },
        { status: 409 }
      );
    }

    // If scheduled, create pending scan
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }

      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await supabase.from('cookie_scan_history').insert({
        user_id: user.id,
        scan_id: scanId,
        website_url: url,
        scan_status: 'pending',
        scan_depth: scanDepth,
        created_at: new Date().toISOString(),
      });

      // TODO: Schedule with a job queue (Bull, BullMQ, etc.)
      // For now, return the scheduled scan
      return NextResponse.json({
        success: true,
        message: 'Scan scheduled successfully',
        scanId,
        scheduledFor: scheduledDate.toISOString(),
        statusUrl: `/api/cookies/scan-enhanced/status?scanId=${scanId}`,
      });
    }

    // Generate scan ID first
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Perform immediate scan asynchronously
    // In production, this should be moved to a background job queue
    const scanPromise = performScan(user.id, url, scanDepth, autoImport, webhookUrl, scanId);
    
    // Don't await - return immediately with scan ID

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'scan_initiated',
      resource_type: 'cookie_scan',
      resource_id: scanId,
      changes: { url, scanDepth },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Scan initiated successfully',
      scanId,
      statusUrl: `/api/cookies/scan-enhanced/status?scanId=${scanId}`,
      webhookConfigured: !!webhookUrl,
    });

  } catch (error) {
    console.error('Error initiating scan:', error);
    return NextResponse.json(
      { error: 'Failed to initiate scan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cookies/scan-enhanced/status
 * Get scan status and results
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
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      // Return list of recent scans
      const scans = await CookieScanner.getScanHistory(user.id, 20);
      
      return NextResponse.json({
        success: true,
        scans: scans.map(scan => ({
          scanId: scan.scan_id,
          url: scan.website_url,
          status: scan.scan_status,
          depth: scan.scan_depth,
          cookiesFound: scan.cookies_found,
          complianceScore: scan.compliance_score,
          startedAt: scan.started_at,
          completedAt: scan.completed_at,
          createdAt: scan.created_at,
        })),
      });
    }

    // Get specific scan status
    const scan = await CookieScanner.getScanResult(user.id, scanId);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scan: {
        scanId: scan.scan_id,
        url: scan.website_url,
        status: scan.scan_status,
        depth: scan.scan_depth,
        pagesScanned: scan.pages_scanned,
        cookiesFound: scan.cookies_found,
        newCookies: scan.new_cookies,
        changedCookies: scan.changed_cookies,
        removedCookies: scan.removed_cookies,
        duration: scan.scan_duration,
        classification: scan.classification,
        complianceScore: scan.compliance_score,
        recommendations: scan.recommendations,
        error: scan.error_message,
        startedAt: scan.started_at,
        completedAt: scan.completed_at,
        createdAt: scan.created_at,
        cookies: scan.cookies_data || [],
      },
    });

  } catch (error) {
    console.error('Error fetching scan status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/scan-enhanced
 * Delete a scan record
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
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Delete scan record
    const { error } = await supabase
      .from('cookie_scan_history')
      .delete()
      .eq('scan_id', scanId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'scan_deleted',
      resource_type: 'cookie_scan',
      resource_id: scanId,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting scan:', error);
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to perform the actual scan
 * In production, this should be a background job
 */
async function performScan(
  userId: string,
  url: string,
  scanDepth: 'shallow' | 'medium' | 'deep',
  autoImport: boolean,
  webhookUrl?: string,
  scanId?: string
) {
  try {
    // Determine tier based on scan depth to allow multi-page scanning
    let tier: 'free' | 'premium' | 'enterprise' = 'free';
    if (scanDepth === 'medium') tier = 'premium';
    if (scanDepth === 'deep') tier = 'enterprise';
    
    // Perform the scan
    const result = await CookieScanner.scanWebsite({
      url,
      scanDepth,
      userId,
      tier,
    });

    // Auto-import cookies if enabled
    if (autoImport && result.cookies.length > 0) {
      const importedCount = await CookieService.bulkImportCookies(
        userId,
        result.cookies
      );
      console.log(`Auto-imported ${importedCount} cookies from scan ${result.scanId}`);
    }

    // Send webhook notification if configured
    if (webhookUrl) {
      await sendWebhookNotification(webhookUrl, {
        event: 'scan.completed',
        scanId: result.scanId,
        url,
        status: 'completed',
        cookiesFound: result.cookies.length,
        complianceScore: result.summary.compliance_score,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    console.error('Error performing scan:', error);
    
    // Send error webhook if configured
    if (webhookUrl) {
      await sendWebhookNotification(webhookUrl, {
        event: 'scan.failed',
        url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
    
    throw error;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(webhookUrl: string, payload: any) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Consently-Scanner/1.0',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send webhook notification:', error);
    // Don't throw - webhook failures shouldn't fail the scan
  }
}
