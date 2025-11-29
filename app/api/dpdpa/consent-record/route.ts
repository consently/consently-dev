import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { ConsentRecordRequest, ConsentDetails, RuleContext, PartialRuleContext } from '@/types/dpdpa-widget.types';
import { consentRecordRequestSchema } from '@/types/dpdpa-widget.types';
import { logSuccess } from '@/lib/audit';
import { generateVerifiedConsentId, generateUnverifiedConsentId } from '@/lib/consent-id-utils';
import crypto from 'crypto';

/**
 * Public API endpoint to record DPDPA consent
 * Called by the widget JavaScript on external sites
 * No authentication required - it's publicly accessible
 */

// Types moved to @/types/dpdpa-widget.types.ts

// Note: Consent ID system - visitor ID is now a user-visible code (CNST-XXXX-XXXX-XXXX)

// Helper function to detect device type from user agent
function detectDeviceType(userAgent: string): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }

  if (/mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(ua)) {
    return 'Mobile';
  }

  if (/windows|macintosh|linux/i.test(ua)) {
    return 'Desktop';
  }

  return 'Unknown';
}

// Helper function to extract browser info
function extractBrowserInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';

  return 'Unknown';
}

// Helper function to extract OS info
function extractOSInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';

  return 'Unknown';
}

// Helper function to hash email for privacy (SHA-256)
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth required
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all';
    const widgetId = searchParams.get('widgetId') || undefined;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('dpdpa_consent_records')
      .select('*', { count: 'exact' })
      .order('consent_given_at', { ascending: false });

    // Filter by widgets owned by the user
    const { data: widgets } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id')
      .eq('user_id', user.id);

    const widgetIds = (widgets || []).map((w: any) => w.widget_id);
    if (widgetId) {
      if (!widgetIds.includes(widgetId)) {
        return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 404 });
      }
      query = query.eq('widget_id', widgetId);
    } else if (widgetIds.length > 0) {
      query = query.in('widget_id', widgetIds);
    } else {
      return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } });
    }

    if (search) {
      // search by consent id
      query = query.eq('id', search);
    }

    if (status !== 'all') {
      query = query.eq('consent_status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching DPDPA consent records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // Fetch activity names for all records
    const allActivityIds = new Set<string>();
    (data || []).forEach((record: any) => {
      (record.consented_activities || []).forEach((id: string) => allActivityIds.add(id));
      (record.rejected_activities || []).forEach((id: string) => allActivityIds.add(id));
    });

    let activityMap = new Map<string, string>();
    if (allActivityIds.size > 0) {
      const { data: activities, error: actError } = await supabase
        .from('processing_activities')
        .select('id, activity_name')
        .in('id', Array.from(allActivityIds));

      if (!actError && activities) {
        activities.forEach((act: any) => {
          activityMap.set(act.id, act.activity_name);
        });
      }
    }

    // Enrich records with activity names and emails from visitor_consent_preferences or email_verification_otps if missing
    const visitorIds = [...new Set((data || []).map((r: any) => r.visitor_id))];
    const widgetIdsForEmailLookup = widgetId ? [widgetId] : widgetIds;

    // Fetch emails for records that don't have email (check for null, undefined, or empty string)
    const recordsWithoutEmail = (data || []).filter((r: any) => !r.visitor_email || r.visitor_email.trim() === '');
    const emailMap = new Map<string, string>();

    if (recordsWithoutEmail.length > 0) {
      console.log('[Consent Record API] Found', recordsWithoutEmail.length, 'records without email, attempting to fetch from other sources');
      
      // First, try to get emails from visitor_consent_preferences
      if (widgetIdsForEmailLookup.length > 0) {
        const { data: preferencesWithEmail } = await supabase
          .from('visitor_consent_preferences')
          .select('visitor_id, visitor_email')
          .in('visitor_id', visitorIds)
          .in('widget_id', widgetIdsForEmailLookup)
          .not('visitor_email', 'is', null);

        if (preferencesWithEmail) {
          console.log('[Consent Record API] Found', preferencesWithEmail.length, 'emails from visitor_consent_preferences');
          preferencesWithEmail.forEach((p: any) => {
            if (p.visitor_email && !emailMap.has(p.visitor_id)) {
              emailMap.set(p.visitor_id, p.visitor_email);
            }
          });
        }
      }

      // Second, for records with email_hash but no email yet, lookup in email_verification_otps
      const recordsWithHashButNoEmail = recordsWithoutEmail.filter((r: any) => r.visitor_email_hash);
      if (recordsWithHashButNoEmail.length > 0) {
        const emailHashes = [...new Set(recordsWithHashButNoEmail.map((r: any) => r.visitor_email_hash))];
        console.log('[Consent Record API] Found', recordsWithHashButNoEmail.length, 'records with email_hash but no email');
        console.log('[Consent Record API] Looking up', emailHashes.length, 'unique email hashes in email_verification_otps');
        
        const { data: verifiedEmails, error: emailLookupError } = await supabase
          .from('email_verification_otps')
          .select('email_hash, email')
          .in('email_hash', emailHashes)
          .eq('verified', true)
          .order('verified_at', { ascending: false });

        if (emailLookupError) {
          console.error('[Consent Record API] Error looking up emails from email_verification_otps:', emailLookupError);
        }

        if (verifiedEmails && verifiedEmails.length > 0) {
          console.log('[Consent Record API] Found', verifiedEmails.length, 'verified emails from email_verification_otps');
          
          // Create a hash-to-email map
          const hashToEmailMap = new Map<string, string>();
          verifiedEmails.forEach((e: any) => {
            if (e.email && !hashToEmailMap.has(e.email_hash)) {
              hashToEmailMap.set(e.email_hash, e.email);
            }
          });

          // Map emails back to visitor_ids based on their email_hash
          recordsWithHashButNoEmail.forEach((r: any) => {
            if (r.visitor_email_hash && hashToEmailMap.has(r.visitor_email_hash)) {
              const email = hashToEmailMap.get(r.visitor_email_hash)!;
              emailMap.set(r.visitor_id, email);
              console.log('[Consent Record API] Mapped email for visitor', r.visitor_id.substring(0, 10) + '...');
            }
          });
          
          console.log('[Consent Record API] Successfully mapped', emailMap.size, 'emails total');
        } else {
          console.log('[Consent Record API] No verified emails found in email_verification_otps');
        }
      }
    } else {
      console.log('[Consent Record API] All records already have visitor_email set');
    }

    // Enrich records with activity names and emails
    const enrichedData = (data || []).map((record: any) => ({
      ...record,
      acceptedActivityNames: (record.consented_activities || []).map((id: string) =>
        activityMap.get(id) || 'Unknown Activity'
      ),
      rejectedActivityNames: (record.rejected_activities || []).map((id: string) =>
        activityMap.get(id) || 'Unknown Activity'
      ),
      // Use email from consent record, or fallback to visitor_consent_preferences
      visitor_email: record.visitor_email || emailMap.get(record.visitor_id) || null,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: enrichedData,
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
    console.error('Error fetching DPDPA consent records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const rateLimitResult = checkRateLimit({
      max: 100, // 100 consent records per minute per IP
      window: 60000, // 1 minute
      identifier: getClientIdentifier(request.headers),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Parse and validate request body
    let body: ConsentRecordRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate request using Zod schema
    const validationResult = consentRecordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Use validated data
    body = validationResult.data;

    // SERVER-SIDE VALIDATION: Use validation utilities for additional security
    const { validateUUIDs, validateConsentActivities, sanitizeMetadata, validateActivityPurposeConsents } = await import('@/lib/validation-utils');

    // Validate and filter activity arrays (SERVER-SIDE validation, not just client-side)
    body.acceptedActivities = validateUUIDs(body.acceptedActivities || [], 100);
    body.rejectedActivities = validateUUIDs(body.rejectedActivities || [], 100);

    // Validate activity-purpose consents
    if (body.activityPurposeConsents) {
      body.activityPurposeConsents = validateActivityPurposeConsents(body.activityPurposeConsents);
    }

    // Sanitize metadata
    if (body.metadata) {
      body.metadata = sanitizeMetadata(body.metadata);
    }

    // Validate consent status matches activities
    const activityValidation = validateConsentActivities(
      body.consentStatus,
      body.acceptedActivities,
      body.rejectedActivities
    );

    if (!activityValidation.valid) {
      return NextResponse.json(
        {
          error: activityValidation.error || 'Invalid consent data',
          code: 'INVALID_CONSENT_ACTIVITIES'
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Use adjusted status if validation suggests it
    if (activityValidation.adjustedStatus) {
      console.log('[Consent Record API] Adjusted consent status:', {
        original: body.consentStatus,
        adjusted: activityValidation.adjustedStatus
      });
      body.consentStatus = activityValidation.adjustedStatus;
    }

    // Enhanced logging
    console.log('[Consent Record API] Received request (after validation):', {
      widgetId: body.widgetId,
      visitorId: body.visitorId,
      consentStatus: body.consentStatus,
      acceptedActivitiesCount: body.acceptedActivities?.length || 0,
      rejectedActivitiesCount: body.rejectedActivities?.length || 0,
      acceptedActivities: body.acceptedActivities,
      rejectedActivities: body.rejectedActivities,
      hasRuleContext: !!body.ruleContext,
      timestamp: new Date().toISOString()
    });

    // Create public supabase client (no auth required for this endpoint)
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify widget exists and is active
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, consent_duration, user_id')
      .eq('widget_id', body.widgetId)
      .eq('is_active', true)
      .single();

    if (widgetError || !widgetConfig) {
      console.error('[Consent Record API] Widget validation failed:', {
        widgetId: body.widgetId,
        error: widgetError?.message,
        code: widgetError?.code,
        details: widgetError?.details,
      });
      return NextResponse.json(
        {
          error: 'Invalid widget ID or widget is not active',
          code: 'INVALID_WIDGET'
        },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // ===== CONSENT LIMIT ENFORCEMENT =====
    // Check if user has exceeded their monthly consent quota
    const userId = widgetConfig.user_id;
    if (userId) {
      const { getEntitlements, checkConsentQuota } = await import('@/lib/subscription');
      const entitlements = await getEntitlements();
      const quotaCheck = await checkConsentQuota(userId, entitlements);

      if (!quotaCheck.allowed) {
        console.warn('[Consent Record API] Consent limit exceeded:', {
          userId,
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          plan: entitlements.plan
        });

        return NextResponse.json(
          {
            error: 'Monthly consent limit exceeded',
            code: 'CONSENT_LIMIT_EXCEEDED',
            details: {
              used: quotaCheck.used,
              limit: quotaCheck.limit,
              plan: entitlements.plan,
              message: 'Please upgrade your plan to record more consents this month.'
            }
          },
          {
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      console.log('[Consent Record API] Consent quota check passed:', {
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: quotaCheck.remaining
      });
    }

    // Extract metadata from request
    const userAgent = request.headers.get('user-agent') || body.metadata?.userAgent || '';
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      body.metadata?.ipAddress ||
      'unknown';

    const deviceType = body.metadata?.deviceType || detectDeviceType(userAgent);
    const browser = body.metadata?.browser || extractBrowserInfo(userAgent);
    const os = body.metadata?.os || extractOSInfo(userAgent);
    const country = body.metadata?.country || 'Unknown';
    const language = body.metadata?.language || request.headers.get('accept-language')?.split(',')[0] || 'en';
    const referrer = body.metadata?.referrer || request.headers.get('referer') || null;
    const currentUrl = body.metadata?.currentUrl || null;
    const pageTitle = body.metadata?.pageTitle || null;

    // Calculate expiration date
    const consentDuration = body.consentDuration || widgetConfig.consent_duration || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + consentDuration);

    // Hash visitor email if provided (for cross-device consent management)
    const visitorEmailHash = body.visitorEmail ? hashEmail(body.visitorEmail) : null;
    // Store actual email if provided (for admin dashboard identification)
    const visitorEmail = body.visitorEmail || null;

    // Check if consent record already exists for this visitor AND this specific page URL
    // OR if email is verified, check for existing consent by email hash
    // This allows tracking consent per page, which is needed for the Pages tab
    let existingConsent = null;

    // First priority: Check for email-based consent (for verified emails)
    if (visitorEmailHash) {
      console.log('[Consent Record API] Checking for existing consent by email hash...');

      const { data: emailConsents, error: emailConsentError } = await supabase
        .from('dpdpa_consent_records')
        .select('id, consent_status, consented_activities, rejected_activities, consent_details')
        .eq('widget_id', body.widgetId)
        .eq('visitor_email_hash', visitorEmailHash)
        .order('consent_given_at', { ascending: false })
        .limit(1);

      if (!emailConsentError && emailConsents && emailConsents.length > 0) {
        const latestEmailConsent = emailConsents[0];

        // Determine if we should update existing or create new
        // Update if: same consent status and similar activities
        const isSameStatus = latestEmailConsent.consent_status === body.consentStatus;
        const activitiesMatch =
          JSON.stringify((latestEmailConsent.consented_activities || []).sort()) ===
          JSON.stringify((body.acceptedActivities || []).sort()) &&
          JSON.stringify((latestEmailConsent.rejected_activities || []).sort()) ===
          JSON.stringify((body.rejectedActivities || []).sort());

        if (isSameStatus && activitiesMatch) {
          // Update existing record instead of creating new one
          existingConsent = { id: latestEmailConsent.id };
          console.log('[Consent Record API] Found existing consent for verified email with matching status/activities, will update');
        } else {
          // Different consent - will create new record with email-based consent_id
          console.log('[Consent Record API] Consent changed for verified email (status or activities differ), will create new record with email-based ID');
        }
      } else if (emailConsentError) {
        console.error('[Consent Record API] Error checking for existing email consent:', emailConsentError);
        // Continue with creating new record if check fails
      }
    }

    // Second priority: Check for URL-specific consent (existing logic)
    if (!existingConsent && currentUrl) {
      // Import URL normalization utility for consistent URL handling
      const { normalizeUrl } = await import('@/lib/url-utils');

      const normalizedCurrentUrl = normalizeUrl(currentUrl);

      // Get all consent records for this visitor and widget
      const { data: allConsents, error: existingConsentError } = await supabase
        .from('dpdpa_consent_records')
        .select('id, consent_details')
        .eq('widget_id', body.widgetId)
        .eq('visitor_id', body.visitorId)
        .order('consent_given_at', { ascending: false });

      if (existingConsentError) {
        console.error('[Consent Record API] Error checking for existing consent:', {
          error: existingConsentError.message,
          code: existingConsentError.code,
          widgetId: body.widgetId,
          visitorId: body.visitorId,
        });
        // Continue with creating new record if check fails
      }

      // Find a record that matches the current URL
      if (allConsents && allConsents.length > 0) {
        for (const record of allConsents) {
          const recordUrl = record.consent_details?.metadata?.currentUrl;
          if (recordUrl) {
            const normalizedRecordUrl = normalizeUrl(recordUrl);
            if (normalizedRecordUrl === normalizedCurrentUrl) {
              existingConsent = { id: record.id };
              console.log('[Consent Record API] Found existing consent for this URL, will update');
              break;
            }
          }
        }

        if (!existingConsent) {
          console.log('[Consent Record API] No existing consent for this URL, will create new record');
        }
      }
    }

    let result;

    // Build consent_details JSONB with rule context, activity consents, and extra metadata
    // Validate and sanitize rule context (only include if all required fields are present)
    const ruleContext: RuleContext | null = body.ruleContext &&
      body.ruleContext.ruleId &&
      body.ruleContext.ruleName &&
      body.ruleContext.urlPattern &&
      body.ruleContext.pageUrl ? {
      ruleId: body.ruleContext.ruleId,
      ruleName: body.ruleContext.ruleName,
      urlPattern: body.ruleContext.urlPattern,
      pageUrl: body.ruleContext.pageUrl,
      matchedAt: body.ruleContext.matchedAt || new Date().toISOString(),
    } : null;

    // Validate activity IDs are UUIDs (security: prevent injection)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validatedAcceptedActivities = (body.acceptedActivities || []).filter(id =>
      typeof id === 'string' && uuidRegex.test(id)
    );
    const validatedRejectedActivities = (body.rejectedActivities || []).filter(id =>
      typeof id === 'string' && uuidRegex.test(id)
    );

    // Limit number of activities (prevent abuse)
    if (validatedAcceptedActivities.length > 100 || validatedRejectedActivities.length > 100) {
      return NextResponse.json(
        {
          error: 'Too many activities in consent record',
          code: 'TOO_MANY_ACTIVITIES'
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate activityPurposeConsents (DEPRECATED - kept for backward compatibility)
    let validatedActivityPurposeConsents: Record<string, string[]> | undefined = undefined;
    if (body.activityPurposeConsents && typeof body.activityPurposeConsents === 'object') {
      validatedActivityPurposeConsents = {};
      for (const [activityId, purposeIds] of Object.entries(body.activityPurposeConsents)) {
        // Validate activity ID is UUID
        if (typeof activityId === 'string' && uuidRegex.test(activityId)) {
          // Validate purpose IDs are UUIDs
          if (Array.isArray(purposeIds)) {
            const validatedPurposeIds = purposeIds.filter(id =>
              typeof id === 'string' && uuidRegex.test(id)
            );
            if (validatedPurposeIds.length > 0) {
              validatedActivityPurposeConsents[activityId] = validatedPurposeIds;
            }
          }
        }
      }
      // Set to undefined if empty
      if (Object.keys(validatedActivityPurposeConsents).length === 0) {
        validatedActivityPurposeConsents = undefined;
      }
    }

    // Validate acceptedPurposeConsents (NEW)
    let validatedAcceptedPurposeConsents: Record<string, string[]> | undefined = undefined;
    if (body.acceptedPurposeConsents && typeof body.acceptedPurposeConsents === 'object') {
      validatedAcceptedPurposeConsents = {};
      for (const [activityId, purposeIds] of Object.entries(body.acceptedPurposeConsents)) {
        if (typeof activityId === 'string' && uuidRegex.test(activityId)) {
          if (Array.isArray(purposeIds)) {
            const validatedPurposeIds = purposeIds.filter(id =>
              typeof id === 'string' && uuidRegex.test(id)
            );
            if (validatedPurposeIds.length > 0) {
              validatedAcceptedPurposeConsents[activityId] = validatedPurposeIds;
            }
          }
        }
      }
      if (Object.keys(validatedAcceptedPurposeConsents).length === 0) {
        validatedAcceptedPurposeConsents = undefined;
      }
    }

    // Validate rejectedPurposeConsents (NEW)
    let validatedRejectedPurposeConsents: Record<string, string[]> | undefined = undefined;
    if (body.rejectedPurposeConsents && typeof body.rejectedPurposeConsents === 'object') {
      validatedRejectedPurposeConsents = {};
      for (const [activityId, purposeIds] of Object.entries(body.rejectedPurposeConsents)) {
        if (typeof activityId === 'string' && uuidRegex.test(activityId)) {
          if (Array.isArray(purposeIds)) {
            const validatedPurposeIds = purposeIds.filter(id =>
              typeof id === 'string' && uuidRegex.test(id)
            );
            if (validatedPurposeIds.length > 0) {
              validatedRejectedPurposeConsents[activityId] = validatedPurposeIds;
            }
          }
        }
      }
      if (Object.keys(validatedRejectedPurposeConsents).length === 0) {
        validatedRejectedPurposeConsents = undefined;
      }
    }


    // Status validation already done above using validation utilities
    const finalConsentStatus = body.consentStatus;

    // Generate privacy notice snapshot for this consent record
    // This ensures we have an exact copy of what the user saw
    let privacyNoticeSnapshot: string | undefined = undefined;
    try {
      const { generatePrivacyNoticeHTML, sanitizeHTML } = await import('@/lib/dpdpa-notice');

      // Fetch widget configuration and activities to generate the notice
      const { data: widgetConfigData, error: widgetConfigError } = await supabase
        .from('dpdpa_widget_configs')
        .select('selected_activities, domain')
        .eq('widget_id', body.widgetId)
        .eq('is_active', true)
        .single();

      if (!widgetConfigError && widgetConfigData) {
        const selectedActivitiesIds = widgetConfigData.selected_activities || [];

        // Fetch activities with full details
        const { data: activitiesRaw, error: activitiesError } = await supabase
          .from('processing_activities')
          .select(`
            id,
            activity_name,
            industry,
            activity_purposes(
              id,
              purpose_id,
              legal_basis,
              custom_description,
              purposes(
                id,
                purpose_name,
                description
              ),
              purpose_data_categories(
                id,
                category_name,
                retention_period
              )
            )
          `)
          .in('id', selectedActivitiesIds)
          .eq('is_active', true);

        if (!activitiesError && activitiesRaw) {
          // Transform activities to match the format expected by generatePrivacyNoticeHTML
          const activities = activitiesRaw.map((activity: any) => ({
            id: activity.id,
            activity_name: activity.activity_name,
            industry: activity.industry,
            purposes: (activity.activity_purposes || []).map((ap: any) => ({
              id: ap.id,
              purposeId: ap.purpose_id,
              purposeName: ap.purposes?.purpose_name || 'Unknown Purpose',
              legalBasis: ap.legal_basis,
              customDescription: ap.custom_description,
              dataCategories: (ap.purpose_data_categories || []).map((c: any) => ({
                id: c.id,
                categoryName: c.category_name,
                retentionPeriod: c.retention_period,
              })),
            })),
          }));

          const generatedHTML = generatePrivacyNoticeHTML(activities, widgetConfigData.domain, widgetConfigData.dpo_email || 'dpo@consently.in');
          privacyNoticeSnapshot = sanitizeHTML(generatedHTML);
        }
      }
    } catch (error) {
      console.error('[Consent Record API] Error generating privacy notice snapshot:', error);
      // Continue without snapshot - not critical
    }

    const consentDetails: ConsentDetails = {
      activityConsents: body.activityConsents || {},
      activityPurposeConsents: validatedActivityPurposeConsents, // DEPRECATED: kept for backward compatibility
      acceptedPurposeConsents: validatedAcceptedPurposeConsents, // NEW: accepted purposes
      rejectedPurposeConsents: validatedRejectedPurposeConsents, // NEW: rejected purposes
      ruleContext: ruleContext,
      privacy_notice_snapshot: privacyNoticeSnapshot, // NEW: Store snapshot of the notice
      metadata: {
        referrer: referrer || undefined,
        currentUrl: currentUrl || undefined,
        pageTitle: pageTitle || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        deviceType: deviceType || undefined,
        browser: browser || undefined,
        os: os || undefined,
        country: country || undefined,
        language: language || undefined,
      },
    };


    if (existingConsent) {
      // Update existing consent record
      const updateData: any = {
        consent_status: finalConsentStatus, // Use adjusted status
        consented_activities: validatedAcceptedActivities,
        rejected_activities: validatedRejectedActivities,
        consent_details: consentDetails, // Store rule context and activity consents
        visitor_email_hash: visitorEmailHash, // Optional: for cross-device consent management
        visitor_email: visitorEmail, // Store actual email for admin dashboard identification
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        country_code: country?.substring(0, 3) || null, // Truncate to 3 chars for country_code
        language: language,
        updated_at: new Date().toISOString(),
        consent_expires_at: expiresAt.toISOString(),
        // Set revocation fields if status is revoked
        revoked_at: finalConsentStatus === 'revoked' ? new Date().toISOString() : null,
        revocation_reason: finalConsentStatus === 'revoked'
          ? (body.revocationReason || 'User revoked consent via widget')
          : null,
      };

      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .update(updateData)
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('[Consent Record API] Error updating consent record:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          widgetId: body.widgetId,
          visitorId: body.visitorId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          {
            error: 'Failed to update consent record',
            code: 'UPDATE_FAILED'
          },
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      result = data;
    } else {
      // Generate consent_id with different patterns for verified vs unverified emails
      // Format for verified emails: ${widgetId}_${emailHash16}_${timestamp}
      // Format for unverified: ${widgetId}_${visitorId}_${timestamp}_${randomSuffix}
      // Note: Widget IDs and visitor IDs may contain underscores
      const timestamp = Date.now();
      let consentId: string;

      if (visitorEmailHash) {
        // Deterministic pattern for verified emails using email hash prefix
        // This allows identifying all consents from the same email while maintaining uniqueness
        consentId = generateVerifiedConsentId(body.widgetId, visitorEmailHash, timestamp);
      } else {
        // Random pattern for unverified/anonymous visitors
        consentId = generateUnverifiedConsentId(body.widgetId, body.visitorId, timestamp);
      }

      // Create new consent record
      const insertData: any = {
        widget_id: body.widgetId,
        visitor_id: body.visitorId,
        consent_id: consentId,
        consent_status: finalConsentStatus, // Use adjusted status
        consented_activities: validatedAcceptedActivities,
        rejected_activities: validatedRejectedActivities,
        consent_details: consentDetails, // Store rule context and activity consents
        visitor_email_hash: visitorEmailHash, // Optional: for cross-device consent management
        visitor_email: visitorEmail, // Store actual email for admin dashboard identification
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        country_code: country?.substring(0, 3) || null, // Truncate to 3 chars for country_code
        region: null, // Region not tracked yet
        language: language,
        consent_given_at: new Date().toISOString(),
        consent_expires_at: expiresAt.toISOString(),
        privacy_notice_version: '3.0', // Updated version for Consent ID system
        // Set revocation fields if status is revoked
        revoked_at: finalConsentStatus === 'revoked' ? new Date().toISOString() : null,
        revocation_reason: finalConsentStatus === 'revoked'
          ? (body.revocationReason || 'User revoked consent via widget')
          : null,
      };

      console.log('[Consent Record API] Attempting to insert consent record:', {
        widgetId: body.widgetId,
        visitorId: body.visitorId,
        originalConsentStatus: body.consentStatus,
        finalConsentStatus: finalConsentStatus,
        acceptedCount: validatedAcceptedActivities.length,
        rejectedCount: validatedRejectedActivities.length,
        hasRuleContext: !!ruleContext,
        hasPurposeConsents: !!validatedActivityPurposeConsents
      });

      const { data, error } = await supabase
        .from('dpdpa_consent_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Check if this is a constraint violation
        const isConstraintViolation = error.code === '23514' || // Check constraint violation
          error.message?.includes('valid_consent_activities') ||
          error.hint?.includes('valid_consent_activities');

        console.error('[Consent Record API] Error creating consent record:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          isConstraintViolation,
          widgetId: body.widgetId,
          visitorId: body.visitorId,
          originalConsentStatus: body.consentStatus,
          finalConsentStatus: finalConsentStatus,
          acceptedCount: validatedAcceptedActivities.length,
          rejectedCount: validatedRejectedActivities.length,
          insertData: JSON.stringify(insertData, null, 2),
          timestamp: new Date().toISOString(),
        });

        // Return more specific error for constraint violations
        if (isConstraintViolation) {
          return NextResponse.json(
            {
              error: 'Invalid consent data: status does not match activity arrays',
              code: 'CONSTRAINT_VIOLATION',
              details: {
                status: finalConsentStatus,
                acceptedCount: validatedAcceptedActivities.length,
                rejectedCount: validatedRejectedActivities.length,
                message: 'The consent status must match the provided activities according to database constraints.'
              }
            },
            {
              status: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        return NextResponse.json(
          {
            error: 'Failed to create consent record',
            code: 'CREATE_FAILED',
            details: error.message
          },
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      result = data;
    }

    // Sync consent to visitor_consent_preferences table for preference center
    // This ensures that consent given on any page (career, contact, etc.) shows up in manage preferences
    try {
      // Handle revoked status - mark all existing preferences as withdrawn
      if (finalConsentStatus === 'revoked') {
        const { error: revokeError } = await supabase
          .from('visitor_consent_preferences')
          .update({
            consent_status: 'withdrawn',
            last_updated: new Date().toISOString(),
          })
          .eq('visitor_id', body.visitorId)
          .eq('widget_id', body.widgetId);

        if (revokeError) {
          console.error('[Consent Record API] Error withdrawing preferences:', {
            error: revokeError.message,
            code: revokeError.code,
            widgetId: body.widgetId,
            visitorId: body.visitorId,
          });
        } else {
          console.log('[Consent Record API] Successfully withdrew all preferences');
        }
      } else {
        // For accepted/rejected/partial status, sync individual activities
        const preferenceUpdates: Array<{
          visitor_id: string;
          widget_id: string;
          activity_id: string;
          consent_status: 'accepted' | 'rejected';
          visitor_email_hash: string | null;
          visitor_email: string | null;
          ip_address: string | null;
          user_agent: string | null;
          device_type: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' | null;
          language: string | null;
          expires_at: string;
          consent_version: string;
        }> = [];

        // Add accepted activities
        for (const activityId of validatedAcceptedActivities) {
          preferenceUpdates.push({
            visitor_id: body.visitorId,
            widget_id: body.widgetId,
            activity_id: activityId,
            consent_status: 'accepted',
            visitor_email_hash: visitorEmailHash,
            visitor_email: visitorEmail,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
            device_type: deviceType || null,
            language: language || null,
            expires_at: expiresAt.toISOString(),
            consent_version: '1.0',
          });
        }

        // Add rejected activities
        for (const activityId of validatedRejectedActivities) {
          preferenceUpdates.push({
            visitor_id: body.visitorId,
            widget_id: body.widgetId,
            activity_id: activityId,
            consent_status: 'rejected',
            visitor_email_hash: visitorEmailHash,
            visitor_email: visitorEmail,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
            device_type: deviceType || null,
            language: language || null,
            expires_at: expiresAt.toISOString(),
            consent_version: '1.0',
          });
        }

        // Only upsert if we have activities to sync
        if (preferenceUpdates.length > 0) {
          const { error: syncError } = await supabase
            .from('visitor_consent_preferences')
            .upsert(preferenceUpdates, {
              onConflict: 'visitor_id,widget_id,activity_id',
              ignoreDuplicates: false,
            });

          if (syncError) {
            // Log error but don't fail the request - consent was already recorded
            console.error('[Consent Record API] Error syncing to visitor_consent_preferences:', {
              error: syncError.message,
              code: syncError.code,
              widgetId: body.widgetId,
              visitorId: body.visitorId,
              activityCount: preferenceUpdates.length,
            });
          } else {
            console.log('[Consent Record API] Successfully synced consent to visitor_consent_preferences:', {
              widgetId: body.widgetId,
              visitorId: body.visitorId,
              acceptedCount: validatedAcceptedActivities.length,
              rejectedCount: validatedRejectedActivities.length,
            });
          }
        }
      }
    } catch (syncError) {
      // Log error but don't fail the request - consent was already recorded successfully
      console.error('[Consent Record API] Unexpected error syncing preferences:', {
        error: syncError instanceof Error ? syncError.message : 'Unknown error',
        widgetId: body.widgetId,
        visitorId: body.visitorId,
      });
    }

    // Log successful consent recording (use widget owner's user_id since this is a public endpoint)
    await logSuccess(
      widgetConfig.user_id,
      'consent.record',
      'dpdpa_consent',
      result.id,
      {
        widget_id: body.widgetId,
        consent_status: finalConsentStatus,
        accepted_count: validatedAcceptedActivities.length,
        rejected_count: validatedRejectedActivities.length,
        is_update: !!existingConsent
      },
      request
    );

    // Return success response
    return NextResponse.json({
      success: true,
      consentId: result.id,
      visitorId: body.visitorId, // Return the Consent ID to display to user
      expiresAt: result.consent_expires_at,
      message: 'Consent recorded successfully'
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    // Enhanced error logging for production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Consent Record API] Unexpected error:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
