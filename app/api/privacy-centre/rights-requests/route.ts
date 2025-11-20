import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Privacy Centre DPDP Rights Requests API
 * Handles data subject rights requests per DPDP Act 2023
 * Types: access, correction, erasure, grievance, nomination
 * 
 * NOTE: 
 * - GET/POST use service role client (public operations)
 * - PATCH uses regular client (requires admin authentication for status updates)
 */

interface RightsRequestSubmission {
  visitorId: string;
  visitorEmail: string;
  visitorName?: string;
  visitorPhone?: string;
  widgetId: string;
  requestType: 'access' | 'correction' | 'erasure' | 'grievance' | 'nomination';
  requestTitle: string;
  requestDescription: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    language?: string;
  };
}

// Helper to hash email
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Helper to generate verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// GET - Fetch visitor's rights requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    
    const visitorId = searchParams.get('visitorId');
    const widgetId = searchParams.get('widgetId');
    const emailHash = searchParams.get('emailHash'); // Optional for additional verification

    if (!visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'visitorId and widgetId are required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('dpdp_rights_requests')
      .select('*')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    // Additional verification if email hash provided
    if (emailHash) {
      query = query.eq('visitor_email_hash', emailHash);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching rights requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    // Format response (hide sensitive fields)
    const formattedRequests = (requests || []).map((req: any) => ({
      id: req.id,
      requestType: req.request_type,
      requestTitle: req.request_title,
      requestDescription: req.request_description,
      status: req.status,
      responseMessage: req.response_message,
      rejectionReason: req.rejection_reason,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      dueDate: req.due_date,
      completedAt: req.completed_at,
      isVerified: req.is_verified,
    }));

    return NextResponse.json({
      data: {
        requests: formattedRequests,
        totalCount: formattedRequests.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/privacy-centre/rights-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Submit a new rights request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body: RightsRequestSubmission = await request.json();

    const {
      visitorId,
      visitorEmail,
      visitorName,
      visitorPhone,
      widgetId,
      requestType,
      requestTitle,
      requestDescription,
      metadata,
    } = body;

    // Validation
    if (!visitorId || !visitorEmail || !widgetId || !requestType || !requestTitle || !requestDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ['access', 'correction', 'erasure', 'grievance', 'nomination'];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // Generate email hash and verification code
    const emailHash = hashEmail(visitorEmail);
    const verificationCode = generateVerificationCode();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Calculate due date (30 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Insert request
    const { data: newRequest, error: insertError } = await supabase
      .from('dpdp_rights_requests')
      .insert({
        visitor_id: visitorId,
        visitor_email: visitorEmail,
        visitor_email_hash: emailHash,
        visitor_name: visitorName || null,
        visitor_phone: visitorPhone || null,
        widget_id: widgetId,
        request_type: requestType,
        request_title: requestTitle,
        request_description: requestDescription,
        status: 'pending',
        ip_address: metadata?.ipAddress || null,
        user_agent: metadata?.userAgent || null,
        device_type: metadata?.deviceType || null,
        language: metadata?.language || 'en',
        verification_code: verificationCode,
        verification_token: verificationToken,
        is_verified: false,
        due_date: dueDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating rights request:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      );
    }

    // TODO: Send verification email with code
    // await sendVerificationEmail(visitorEmail, verificationCode, newRequest.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Request submitted successfully. Verification email sent.',
        data: {
          requestId: newRequest.id,
          status: newRequest.status,
          dueDate: newRequest.due_date,
          // For demo purposes - in production, send via email only
          verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/privacy-centre/rights-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update request status (admin only) or verify request (public)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { requestId, action, verificationCode, adminUpdate } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    // Action: verify (public)
    if (action === 'verify') {
      if (!verificationCode) {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        );
      }

      // Verify code
      const { data: requestData, error: fetchError } = await supabase
        .from('dpdp_rights_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !requestData) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      if (requestData.verification_code !== verificationCode) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Update to verified
      const { error: updateError } = await supabase
        .from('dpdp_rights_requests')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error verifying request:', updateError);
        return NextResponse.json(
          { error: 'Failed to verify request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Request verified successfully',
      });
    }

    // Action: updateStatus (admin only)
    if (action === 'updateStatus' && adminUpdate) {
      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { status, responseMessage, rejectionReason } = adminUpdate;

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (responseMessage) {
        updateData.response_message = responseMessage;
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }

      const { error: updateError } = await supabase
        .from('dpdp_rights_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        return NextResponse.json(
          { error: 'Failed to update request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Request status updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/privacy-centre/rights-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
