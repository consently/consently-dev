import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CookieService } from '@/lib/cookies/cookie-service';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

/**
 * Compliance Check API
 * Automated compliance checking and reporting
 * 
 * Features:
 * - Run compliance checks (GDPR, DPDPA, CCPA, etc.)
 * - Generate compliance reports
 * - Get actionable recommendations
 * - Schedule periodic checks
 * - Track compliance score over time
 * - Issue detection and remediation
 */

const complianceCheckSchema = z.object({
  regulations: z.array(z.enum(['gdpr', 'dpdpa', 'ccpa', 'lgpd', 'pipeda', 'all'])).default(['gdpr']),
  include_cookies: z.boolean().default(true),
  include_consents: z.boolean().default(true),
  include_data_mapping: z.boolean().default(true),
  severity_threshold: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

const scheduleCheckSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  day_of_week: z.number().min(0).max(6).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  regulations: z.array(z.string()),
  notify_email: z.string().email().optional(),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/cookies/compliance
 * Get compliance status and history
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
    const checkId = searchParams.get('id');
    const includeHistory = searchParams.get('history') === 'true';
    const regulation = searchParams.get('regulation');

    // Get specific compliance check
    if (checkId) {
      const { data: check, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('id', checkId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!check) {
        return NextResponse.json(
          { error: 'Compliance check not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: check,
      });
    }

    // Get compliance history
    let query = supabase
      .from('compliance_checks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (regulation) {
      query = query.contains('regulations', [regulation]);
    }

    if (!includeHistory) {
      query = query.limit(1);
    } else {
      query = query.limit(50);
    }

    const { data: checks, error } = await query;

    if (error) throw error;

    // Get current compliance status
    const latestCheck = checks?.[0];
    const complianceScore = latestCheck?.overall_score || 0;
    const complianceStatus = getComplianceStatus(complianceScore);

    // Get scheduled checks
    const { data: scheduledChecks } = await supabase
      .from('compliance_schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      current_status: {
        score: complianceScore,
        status: complianceStatus,
        last_checked: latestCheck?.created_at,
        regulations_checked: latestCheck?.regulations || [],
      },
      history: checks,
      scheduled_checks: scheduledChecks,
    });

  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/compliance
 * Run a new compliance check
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

    // Validate request
    const validationResult = complianceCheckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    // Run compliance checks
    const complianceReport = await runComplianceChecks(user.id, config, supabase);

    // Save compliance check result
    const { data: savedCheck, error: saveError } = await supabase
      .from('compliance_checks')
      .insert({
        user_id: user.id,
        regulations: config.regulations,
        overall_score: complianceReport.overall_score,
        issues: complianceReport.issues,
        recommendations: complianceReport.recommendations,
        checks_performed: complianceReport.checks_performed,
        status: complianceReport.status,
        details: complianceReport.details,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'compliance_check_run',
      resource_type: 'compliance_check',
      resource_id: savedCheck.id,
      changes: { 
        regulations: config.regulations,
        score: complianceReport.overall_score,
      },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: savedCheck,
      report: complianceReport,
      message: 'Compliance check completed successfully',
    });

  } catch (error) {
    console.error('Error running compliance check:', error);
    return NextResponse.json(
      { error: 'Failed to run compliance check' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cookies/compliance
 * Schedule or update compliance checks
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
    const { schedule_id, ...scheduleData } = body;

    // Validate schedule data
    const validationResult = scheduleCheckSchema.safeParse(scheduleData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid schedule data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    if (schedule_id) {
      // Update existing schedule
      const { data: updatedSchedule, error } = await supabase
        .from('compliance_schedules')
        .update(config)
        .eq('id', schedule_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: updatedSchedule,
        message: 'Compliance check schedule updated',
      });
    } else {
      // Create new schedule
      const { data: newSchedule, error } = await supabase
        .from('compliance_schedules')
        .insert({
          ...config,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: newSchedule,
        message: 'Compliance check scheduled successfully',
      });
    }

  } catch (error) {
    console.error('Error scheduling compliance check:', error);
    return NextResponse.json(
      { error: 'Failed to schedule compliance check' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/compliance
 * Delete a scheduled compliance check
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
    const scheduleId = searchParams.get('schedule_id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('compliance_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Scheduled compliance check deleted',
    });

  } catch (error) {
    console.error('Error deleting scheduled check:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled check' },
      { status: 500 }
    );
  }
}

// Helper functions

async function runComplianceChecks(
  userId: string,
  config: any,
  supabase: any
): Promise<any> {
  const issues: any[] = [];
  const recommendations: any[] = [];
  const checksPerformed: any[] = [];
  let totalScore = 0;
  let checkCount = 0;

  // Get all cookies
  const { cookies } = await CookieService.getCookies(userId, {});

  // Get consent logs
  const { logs: consentLogs } = await CookieService.getConsentLogs(userId, {});

  // Run cookie compliance checks
  if (config.include_cookies) {
    const cookieChecks = runCookieComplianceChecks(cookies, config.regulations);
    issues.push(...cookieChecks.issues);
    recommendations.push(...cookieChecks.recommendations);
    checksPerformed.push(...cookieChecks.checks);
    totalScore += cookieChecks.score;
    checkCount++;
  }

  // Run consent compliance checks
  if (config.include_consents) {
    const consentChecks = runConsentComplianceChecks(consentLogs, config.regulations);
    issues.push(...consentChecks.issues);
    recommendations.push(...consentChecks.recommendations);
    checksPerformed.push(...consentChecks.checks);
    totalScore += consentChecks.score;
    checkCount++;
  }

  // Run data mapping checks
  if (config.include_data_mapping) {
    const { data: activities } = await supabase
      .from('processing_activities')
      .select('*')
      .eq('user_id', userId);

    const dataChecks = runDataMappingChecks(activities || [], config.regulations);
    issues.push(...dataChecks.issues);
    recommendations.push(...dataChecks.recommendations);
    checksPerformed.push(...dataChecks.checks);
    totalScore += dataChecks.score;
    checkCount++;
  }

  const overallScore = checkCount > 0 ? Math.round(totalScore / checkCount) : 0;

  return {
    overall_score: overallScore,
    status: getComplianceStatus(overallScore),
    issues: issues.filter(i => 
      config.severity_threshold === 'low' ||
      (config.severity_threshold === 'medium' && ['medium', 'high', 'critical'].includes(i.severity)) ||
      (config.severity_threshold === 'high' && ['high', 'critical'].includes(i.severity)) ||
      (config.severity_threshold === 'critical' && i.severity === 'critical')
    ),
    recommendations: recommendations.slice(0, 20),
    checks_performed: checksPerformed,
    details: {
      cookies_checked: cookies.length,
      consents_checked: consentLogs.length,
      regulations: config.regulations,
    },
  };
}

function runCookieComplianceChecks(cookies: any[], regulations: string[]) {
  const issues: any[] = [];
  const recommendations: any[] = [];
  const checks: any[] = [];
  let score = 100;

  // Check 1: All cookies have purposes
  const cookiesWithoutPurpose = cookies.filter(c => !c.purpose);
  if (cookiesWithoutPurpose.length > 0) {
    score -= 15;
    issues.push({
      severity: 'high',
      type: 'missing_purpose',
      message: `${cookiesWithoutPurpose.length} cookies are missing purpose descriptions`,
      affected_cookies: cookiesWithoutPurpose.map(c => c.name),
    });
    recommendations.push({
      type: 'cookie_documentation',
      priority: 'high',
      action: 'Add purpose descriptions to all cookies',
      details: 'Each cookie must have a clear purpose description for compliance',
    });
  }
  checks.push({ name: 'Cookie Purpose Documentation', passed: cookiesWithoutPurpose.length === 0 });

  // Check 2: Legal basis documented
  const cookiesWithoutLegalBasis = cookies.filter(c => !c.legal_basis);
  if (cookiesWithoutLegalBasis.length > 0) {
    score -= 20;
    issues.push({
      severity: 'critical',
      type: 'missing_legal_basis',
      message: `${cookiesWithoutLegalBasis.length} cookies lack legal basis documentation`,
      affected_cookies: cookiesWithoutLegalBasis.map(c => c.name),
    });
    recommendations.push({
      type: 'legal_basis',
      priority: 'critical',
      action: 'Document legal basis for all cookies',
      details: 'GDPR requires a valid legal basis for all cookie processing',
    });
  }
  checks.push({ name: 'Legal Basis Documentation', passed: cookiesWithoutLegalBasis.length === 0 });

  // Check 3: Third-party cookie scrutiny
  const thirdPartyCookies = cookies.filter(c => c.is_third_party);
  if (thirdPartyCookies.length > cookies.length * 0.5) {
    score -= 10;
    issues.push({
      severity: 'medium',
      type: 'excessive_third_party',
      message: 'High number of third-party cookies detected',
      count: thirdPartyCookies.length,
    });
    recommendations.push({
      type: 'third_party_review',
      priority: 'medium',
      action: 'Review and minimize third-party cookie usage',
      details: 'Excessive third-party cookies increase privacy risks',
    });
  }
  checks.push({ name: 'Third-Party Cookie Control', passed: thirdPartyCookies.length <= cookies.length * 0.5 });

  // Check 4: Cookie expiry reasonable
  const longExpiryCookies = cookies.filter(c => {
    const days = c.expiry_days || 0;
    return days > 365;
  });
  if (longExpiryCookies.length > 0) {
    score -= 5;
    issues.push({
      severity: 'low',
      type: 'long_expiry',
      message: `${longExpiryCookies.length} cookies have expiry periods longer than 1 year`,
      affected_cookies: longExpiryCookies.map(c => c.name),
    });
  }
  checks.push({ name: 'Reasonable Cookie Expiry', passed: longExpiryCookies.length === 0 });

  return { issues, recommendations, checks, score: Math.max(0, score) };
}

function runConsentComplianceChecks(consentLogs: any[], regulations: string[]) {
  const issues: any[] = [];
  const recommendations: any[] = [];
  const checks: any[] = [];
  let score = 100;

  if (consentLogs.length === 0) {
    score = 50;
    issues.push({
      severity: 'high',
      type: 'no_consent_records',
      message: 'No consent records found',
    });
    recommendations.push({
      type: 'consent_implementation',
      priority: 'high',
      action: 'Implement consent collection mechanism',
      details: 'Start collecting and recording user consent',
    });
    checks.push({ name: 'Consent Collection Active', passed: false });
    return { issues, recommendations, checks, score };
  }

  // Check 1: Consent acceptance rate
  const acceptedConsents = consentLogs.filter(l => l.status === 'accepted').length;
  const acceptanceRate = (acceptedConsents / consentLogs.length) * 100;
  
  if (acceptanceRate < 30) {
    score -= 10;
    recommendations.push({
      type: 'consent_ux',
      priority: 'medium',
      action: 'Review consent banner UX and messaging',
      details: 'Low acceptance rate may indicate unclear or aggressive consent requests',
    });
  }
  checks.push({ name: 'Healthy Consent Acceptance Rate', passed: acceptanceRate >= 30 });

  // Check 2: Consent granularity
  const partialConsents = consentLogs.filter(l => l.status === 'partial').length;
  const granularityRate = (partialConsents / consentLogs.length) * 100;
  
  if (granularityRate > 0) {
    // Good - users have granular control
    checks.push({ name: 'Granular Consent Options', passed: true });
  } else {
    score -= 15;
    issues.push({
      severity: 'medium',
      type: 'no_granular_consent',
      message: 'No partial consents detected - may indicate lack of granular options',
    });
    recommendations.push({
      type: 'consent_granularity',
      priority: 'high',
      action: 'Implement granular consent categories',
      details: 'GDPR requires giving users choice over different cookie categories',
    });
    checks.push({ name: 'Granular Consent Options', passed: false });
  }

  // Check 3: Consent refresh/renewal
  const oldestConsent = consentLogs[consentLogs.length - 1];
  const daysSinceOldest = oldestConsent ? 
    Math.floor((Date.now() - new Date(oldestConsent.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  if (daysSinceOldest > 365) {
    score -= 5;
    recommendations.push({
      type: 'consent_refresh',
      priority: 'low',
      action: 'Consider implementing consent refresh mechanism',
      details: 'Periodic consent renewal is a best practice',
    });
  }
  checks.push({ name: 'Consent Refresh Mechanism', passed: daysSinceOldest <= 365 });

  return { issues, recommendations, checks, score: Math.max(0, score) };
}

function runDataMappingChecks(activities: any[], regulations: string[]) {
  const issues: any[] = [];
  const recommendations: any[] = [];
  const checks: any[] = [];
  let score = 100;

  if (activities.length === 0) {
    score = 60;
    issues.push({
      severity: 'high',
      type: 'no_data_mapping',
      message: 'No data processing activities documented',
    });
    recommendations.push({
      type: 'data_mapping',
      priority: 'high',
      action: 'Document all data processing activities',
      details: 'Maintain a record of processing activities (ROPA) as required by GDPR Article 30',
    });
    checks.push({ name: 'Data Processing Activities Documented', passed: false });
    return { issues, recommendations, checks, score };
  }

  // Check 1: Activities have retention periods
  const activitiesWithoutRetention = activities.filter(a => !a.retention_period);
  if (activitiesWithoutRetention.length > 0) {
    score -= 15;
    issues.push({
      severity: 'high',
      type: 'missing_retention',
      message: `${activitiesWithoutRetention.length} processing activities missing retention periods`,
    });
    recommendations.push({
      type: 'retention_policy',
      priority: 'high',
      action: 'Define retention periods for all data processing activities',
      details: 'Data retention policies are required for compliance',
    });
  }
  checks.push({ name: 'Retention Periods Defined', passed: activitiesWithoutRetention.length === 0 });

  // Check 2: Activities have legal basis
  const activitiesWithoutBasis = activities.filter(a => !a.purpose);
  if (activitiesWithoutBasis.length > 0) {
    score -= 20;
    issues.push({
      severity: 'critical',
      type: 'missing_legal_basis_activity',
      message: `${activitiesWithoutBasis.length} activities lack documented purpose/legal basis`,
    });
  }
  checks.push({ name: 'Processing Purpose Documented', passed: activitiesWithoutBasis.length === 0 });

  // Check 3: Data processor agreements
  const activitiesWithProcessors = activities.filter(a => 
    a.data_processors && Object.keys(a.data_processors).length > 0
  );
  if (activitiesWithProcessors.length > 0) {
    // Good practice detected
    checks.push({ name: 'Data Processor Relationships Documented', passed: true });
  } else if (activities.length > 5) {
    recommendations.push({
      type: 'processor_agreements',
      priority: 'medium',
      action: 'Document relationships with data processors',
      details: 'Maintain records of third-party data processors and ensure DPA agreements',
    });
    checks.push({ name: 'Data Processor Relationships Documented', passed: false });
  }

  return { issues, recommendations, checks, score: Math.max(0, score) };
}

function getComplianceStatus(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'needs_improvement';
  return 'critical';
}
