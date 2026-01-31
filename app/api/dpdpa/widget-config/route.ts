import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { displayRulesSchema } from '@/types/dpdpa-widget.types';
import { logSuccess, logFailure } from '@/lib/audit';
import { checkRateLimit, getUserIdentifier } from '@/lib/rate-limit';
import { cache } from '@/lib/cache';

// Validation schema
// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const widgetConfigSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must not exceed 200 characters'),
  domain: z.string()
    .min(3, 'Domain is required')
    .max(255, 'Domain must not exceed 255 characters'),
  dpoEmail: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .optional()
    .or(z.literal('')),
  position: z.enum(['top', 'bottom', 'center', 'bottom-left', 'bottom-right', 'modal']).optional(),
  layout: z.enum(['modal', 'slide-in', 'banner']).optional(),
  theme: z.any().optional(),
  title: z.string()
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  message: z.string()
    .max(2000, 'Message must not exceed 2000 characters')
    .optional(),
  acceptButtonText: z.string()
    .max(50, 'Button text must not exceed 50 characters')
    .optional(),
  rejectButtonText: z.string()
    .max(50, 'Button text must not exceed 50 characters')
    .optional(),
  customizeButtonText: z.string()
    .max(50, 'Button text must not exceed 50 characters')
    .optional(),
  selectedActivities: z.array(z.string().uuid('Invalid activity ID format'))
    .max(100, 'Cannot select more than 100 activities')
    .optional(),
  mandatoryPurposes: z.array(z.string().uuid('Invalid purpose ID format'))
    .max(100, 'Cannot have more than 100 mandatory purposes')
    .optional(),
  autoShow: z.boolean().optional(),
  showAfterDelay: z.number()
    .min(0)
    .max(30000, 'Delay must not exceed 30 seconds')
    .optional(),
  consentDuration: z.number().min(1).max(730).optional(),
  respectDNT: z.boolean().optional(),
  requireExplicitConsent: z.boolean().optional(),
  showDataSubjectsRights: z.boolean().optional(),
  language: z.string().optional(),
  enableAnalytics: z.boolean().optional(),
  enableAuditLog: z.boolean().optional(),
  showBranding: z.boolean().optional(),
  customCSS: z.string().optional(),
  isActive: z.boolean().optional(),
  supportedLanguages: z.array(z.string()).optional(),
  displayRules: displayRulesSchema.optional(),
  // Age Gate Settings (LEGACY - Deprecated, use DigiLocker verification)
  enableAgeGate: z.boolean().optional(),
  ageGateThreshold: z.number().min(13).max(21).optional(),
  ageGateMinorMessage: z.string().max(500, 'Minor message must not exceed 500 characters').optional(),
  // DigiLocker Age Verification (DPDPA 2023 Verifiable Parental Consent)
  requireAgeVerification: z.boolean().optional(),
  ageVerificationThreshold: z.number().min(13).max(21).optional(),
  ageVerificationProvider: z.enum(['digilocker', 'apisetu', 'custom']).optional(),
  minorHandling: z.enum(['block', 'limited_access']).optional(),
  verificationValidityDays: z.number().min(1).max(365).optional(),
  // Smart Email Pre-fill
  enableSmartPreFill: z.boolean().optional(),
  emailFieldSelectors: z.string().max(1000).optional(),
});

// GET - Fetch widget configuration(s)
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
    const widgetId = searchParams.get('widgetId');

    if (widgetId) {
      // Fetch specific widget configuration
      const { data, error } = await supabase
        .from('dpdpa_widget_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('widget_id', widgetId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Widget configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data });
    } else {
      // Fetch all widget configurations for user
      const { data, error } = await supabase
        .from('dpdpa_widget_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching widget configs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch widget configurations' },
          { status: 500 }
        );
      }

      // If no DPDPA widget configs found, check for onboarding data in cookie_banners
      if (!data || data.length === 0) {
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('cookie_banners')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (onboardingData && !onboardingError) {
          // Map onboarding data to widget config structure
          // This creates a "virtual" config that hasn't been saved to dpdpa_widget_configs yet
          const virtualConfig = {
            // Don't set widget_id so the frontend treats it as a new widget
            name: 'My DPDPA Widget',
            domain: onboardingData.website_url || '',
            position: 'bottom-right',
            layout: onboardingData.banner_style === 'floating' ? 'modal' : 'banner',
            theme: {
              primaryColor: onboardingData.primary_color || '#3b82f6',
              backgroundColor: '#ffffff',
              textColor: '#1f2937',
              borderRadius: 12
            },
            title: 'Your Data Privacy Rights',
            message: 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
            accept_button_text: 'Accept All',
            reject_button_text: 'Reject All',
            customize_button_text: 'Manage Preferences',
            selected_activities: [], // User will need to select these
            auto_show: true,
            show_after_delay: 1000,
            consent_duration: 365,
            respect_dnt: false,
            require_explicit_consent: true,
            show_data_subjects_rights: true,
            show_branding: true,
            is_active: true,
            language: onboardingData.language || 'en',
            supported_languages: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
            display_rules: []
          };

          return NextResponse.json({ data: [virtualConfig] });
        }
      }

      return NextResponse.json({ data: data || [] });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new widget configuration
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

    // Rate limiting: 30 requests per minute for creating widgets
    const rateLimitResult = await checkRateLimit({
      max: 30,
      window: 60000,
      identifier: getUserIdentifier(user.id),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = widgetConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const configData = validationResult.data;

    // Generate unique widget ID
    const widgetId = `dpdpa_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Validate and filter UUIDs for security
    const validatedActivities = (configData.selectedActivities || [])
      .filter(id => UUID_REGEX.test(id));

    // Validate mandatory purposes UUIDs
    const validatedMandatoryPurposes = (configData.mandatoryPurposes || [])
      .filter(id => UUID_REGEX.test(id));

    // Prepare data for insertion
    const insertData = {
      user_id: user.id,
      widget_id: widgetId,
      name: configData.name,
      domain: configData.domain,
      dpo_email: configData.dpoEmail || null,
      position: configData.position || 'bottom-right',
      layout: configData.layout || 'modal',
      theme: configData.theme,
      title: configData.title,
      message: configData.message,
      accept_button_text: configData.acceptButtonText,
      reject_button_text: configData.rejectButtonText,
      customize_button_text: configData.customizeButtonText,
      selected_activities: validatedActivities,
      mandatory_purposes: validatedMandatoryPurposes,
      auto_show: configData.autoShow ?? true,
      show_after_delay: configData.showAfterDelay ?? 1000,
      consent_duration: configData.consentDuration ?? 365,
      respect_dnt: configData.respectDNT ?? false,
      require_explicit_consent: configData.requireExplicitConsent ?? true,
      show_data_subjects_rights: configData.showDataSubjectsRights ?? true,
      language: configData.language || 'en',
      enable_analytics: configData.enableAnalytics ?? true,
      enable_audit_log: configData.enableAuditLog ?? true,
      show_branding: configData.showBranding ?? true,
      custom_css: configData.customCSS,
      is_active: configData.isActive ?? true,
      supported_languages: configData.supportedLanguages || ['en', 'hi', 'pa', 'te', 'ta'],
      display_rules: configData.displayRules || [],
      // Age Gate Settings (LEGACY) - Auto-disabled when DigiLocker is enabled
      enable_age_gate: configData.requireAgeVerification ? false : (configData.enableAgeGate ?? false),
      age_gate_threshold: configData.ageGateThreshold ?? 18,
      age_gate_minor_message: configData.ageGateMinorMessage || 'This content requires adult supervision.',
      // DigiLocker Age Verification (DPDPA 2023)
      require_age_verification: configData.requireAgeVerification ?? false,
      age_verification_threshold: configData.ageVerificationThreshold ?? 18,
      age_verification_provider: configData.ageVerificationProvider || 'digilocker',
      minor_handling: configData.minorHandling || 'block',
      verification_validity_days: configData.verificationValidityDays ?? 365,
      // Smart Pre-fill
      enable_smart_pre_fill: configData.enableSmartPreFill ?? false,
      email_field_selectors: configData.emailFieldSelectors || '',
    };

    // Insert widget configuration
    const { data, error } = await supabase
      .from('dpdpa_widget_configs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating widget config:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Log widget creation failure
      await logFailure(
        user.id,
        'widget.create',
        'dpdpa_widget',
        error.message,
        request
      );

      return NextResponse.json(
        { error: 'Failed to create widget configuration', details: error.message },
        { status: 500 }
      );
    }

    // Log successful widget creation
    await logSuccess(
      user.id,
      'widget.create',
      'dpdpa_widget',
      widgetId,
      {
        name: configData.name,
        domain: configData.domain,
        activities_count: validatedActivities.length
      },
      request
    );

    // Invalidate any existing cache for this widget ID (in case of recreation)
    const cacheKey = `dpdpa-widget-config:${widgetId}`;
    await cache.del(cacheKey);

    return NextResponse.json({ data, widgetId }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update widget configuration
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

    // Rate limiting: 30 requests per minute for updating widgets
    const rateLimitResult = await checkRateLimit({
      max: 30,
      window: 60000,
      identifier: getUserIdentifier(user.id),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { widgetId, ...updateData } = body;

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    // Validate update data
    const validationResult = widgetConfigSchema.partial().safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const configData = validationResult.data;

    // Prepare data for update (convert camelCase to snake_case)
    const updatePayload: any = {};

    if (configData.name !== undefined) updatePayload.name = configData.name;
    if (configData.domain !== undefined) updatePayload.domain = configData.domain;
    if (configData.dpoEmail !== undefined) updatePayload.dpo_email = configData.dpoEmail || null;
    if (configData.position !== undefined) updatePayload.position = configData.position;
    if (configData.layout !== undefined) updatePayload.layout = configData.layout;
    if (configData.theme !== undefined) updatePayload.theme = configData.theme;
    if (configData.title !== undefined) updatePayload.title = configData.title;
    if (configData.message !== undefined) updatePayload.message = configData.message;
    if (configData.acceptButtonText !== undefined) updatePayload.accept_button_text = configData.acceptButtonText;
    if (configData.rejectButtonText !== undefined) updatePayload.reject_button_text = configData.rejectButtonText;
    if (configData.customizeButtonText !== undefined) updatePayload.customize_button_text = configData.customizeButtonText;

    // Validate and filter UUIDs for selectedActivities (same as POST)
    if (configData.selectedActivities !== undefined) {
      const validatedActivities = (configData.selectedActivities || [])
        .filter(id => UUID_REGEX.test(id));
      updatePayload.selected_activities = validatedActivities;
      console.log('[Widget Config API] Updating selected_activities:', {
        originalCount: configData.selectedActivities.length,
        validatedCount: validatedActivities.length,
        validatedIds: validatedActivities
      });
    }
    // Validate and filter UUIDs for mandatoryPurposes
    if (configData.mandatoryPurposes !== undefined) {
      const validatedMandatoryPurposes = (configData.mandatoryPurposes || [])
        .filter(id => UUID_REGEX.test(id));
      updatePayload.mandatory_purposes = validatedMandatoryPurposes;
      console.log('[Widget Config API] Updating mandatory_purposes:', {
        originalCount: configData.mandatoryPurposes.length,
        validatedCount: validatedMandatoryPurposes.length
      });
    }
    if (configData.autoShow !== undefined) updatePayload.auto_show = configData.autoShow;
    if (configData.showAfterDelay !== undefined) updatePayload.show_after_delay = configData.showAfterDelay;
    if (configData.consentDuration !== undefined) updatePayload.consent_duration = configData.consentDuration;
    if (configData.respectDNT !== undefined) updatePayload.respect_dnt = configData.respectDNT;
    if (configData.requireExplicitConsent !== undefined) updatePayload.require_explicit_consent = configData.requireExplicitConsent;
    if (configData.showDataSubjectsRights !== undefined) updatePayload.show_data_subjects_rights = configData.showDataSubjectsRights;
    if (configData.language !== undefined) updatePayload.language = configData.language;
    if (configData.enableAnalytics !== undefined) updatePayload.enable_analytics = configData.enableAnalytics;
    if (configData.enableAuditLog !== undefined) updatePayload.enable_audit_log = configData.enableAuditLog;
    if (configData.showBranding !== undefined) updatePayload.show_branding = configData.showBranding;
    if (configData.customCSS !== undefined) updatePayload.custom_css = configData.customCSS;
    if (configData.isActive !== undefined) updatePayload.is_active = configData.isActive;
    if (configData.supportedLanguages !== undefined) updatePayload.supported_languages = configData.supportedLanguages;

    // Age Gate Settings (LEGACY)
    if (configData.enableAgeGate !== undefined) updatePayload.enable_age_gate = configData.enableAgeGate;
    if (configData.ageGateThreshold !== undefined) updatePayload.age_gate_threshold = configData.ageGateThreshold;
    if (configData.ageGateMinorMessage !== undefined) updatePayload.age_gate_minor_message = configData.ageGateMinorMessage;

    // DigiLocker Age Verification (DPDPA 2023)
    if (configData.requireAgeVerification !== undefined) updatePayload.require_age_verification = configData.requireAgeVerification;
    if (configData.ageVerificationThreshold !== undefined) updatePayload.age_verification_threshold = configData.ageVerificationThreshold;
    if (configData.ageVerificationProvider !== undefined) updatePayload.age_verification_provider = configData.ageVerificationProvider;
    if (configData.minorHandling !== undefined) updatePayload.minor_handling = configData.minorHandling;

    if (configData.verificationValidityDays !== undefined) updatePayload.verification_validity_days = configData.verificationValidityDays;

    // Auto-disable legacy age gate when DigiLocker verification is enabled
    // This prevents confusion from having both methods active
    if (configData.requireAgeVerification === true) {
      updatePayload.enable_age_gate = false;
      console.log('[Widget Config API] DigiLocker enabled - auto-disabling legacy age gate');
    }

    // Smart Pre-fill
    if (configData.enableSmartPreFill !== undefined) updatePayload.enable_smart_pre_fill = configData.enableSmartPreFill;
    if (configData.emailFieldSelectors !== undefined) updatePayload.email_field_selectors = configData.emailFieldSelectors;

    // IMPROVED: Validate and clean display rules with empty state detection
    if (configData.displayRules !== undefined) {
      // Get the selected_activities to validate against
      const selectedActivities = updatePayload.selected_activities || configData.selectedActivities || [];

      // Clean display rules: ensure rule activities are subset of selected_activities
      const cleanedDisplayRules = (configData.displayRules || []).map((rule: any) => {
        // If rule has activities specified, filter to only include those in selected_activities
        if (rule.activities && Array.isArray(rule.activities) && rule.activities.length > 0) {
          const validRuleActivities = rule.activities.filter((activityId: string) =>
            selectedActivities.includes(activityId)
          );

          // Log if any activities were filtered out
          if (validRuleActivities.length !== rule.activities.length) {
            const invalidActivities = rule.activities.filter((id: string) => !selectedActivities.includes(id));
            console.warn('[Widget Config API] Display rule has activities not in selected_activities:', {
              ruleId: rule.id,
              ruleName: rule.rule_name,
              invalidActivities,
              validActivities: validRuleActivities
            });
          }

          // EMPTY STATE VALIDATION: Warn if rule will result in zero activities
          if (validRuleActivities.length === 0) {
            console.error('[Widget Config API] ⚠️ CRITICAL: Display rule will show ZERO activities!', {
              ruleId: rule.id,
              ruleName: rule.rule_name,
              urlPattern: rule.url_pattern,
              reason: 'All rule activities filtered out - not in widget selected_activities',
              fix: 'Add valid activity IDs to rule.activities that exist in widget.selected_activities'
            });
            // Mark rule as inactive to prevent showing empty widget
            return { ...rule, activities: validRuleActivities, is_active: false, _auto_disabled: true };
          }

          return { ...rule, activities: validRuleActivities };
        }

        // If no activities specified, rule shows all selected_activities
        // Validate that selected_activities is not empty
        if (selectedActivities.length === 0) {
          console.error('[Widget Config API] ⚠️ CRITICAL: Display rule with no activities specified, but widget has NO selected_activities!', {
            ruleId: rule.id,
            ruleName: rule.rule_name,
            urlPattern: rule.url_pattern,
            fix: 'Add activities to widget.selected_activities or specify activities in rule'
          });
          // Mark rule as inactive
          return { ...rule, is_active: false, _auto_disabled: true };
        }

        return rule;
      });

      updatePayload.display_rules = cleanedDisplayRules;

      // Count auto-disabled rules
      const autoDisabledCount = cleanedDisplayRules.filter((r: any) => r._auto_disabled).length;

      console.log('[Widget Config API] Display rules validated:', {
        rulesCount: cleanedDisplayRules.length,
        activeRulesCount: cleanedDisplayRules.filter((r: any) => r.is_active).length,
        autoDisabledCount,
        selectedActivitiesCount: selectedActivities.length
      });

      if (autoDisabledCount > 0) {
        console.warn('[Widget Config API] ⚠️ Some rules were auto-disabled due to empty state. Check logs above for details.');
      }
    }

    // Update widget configuration
    const { data, error } = await supabase
      .from('dpdpa_widget_configs')
      .update(updatePayload)
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Widget Config API] Error updating widget config:', error);
      console.error('[Widget Config API] Error details:', JSON.stringify(error, null, 2));
      console.error('[Widget Config API] Update payload:', JSON.stringify(updatePayload, null, 2));

      // Log widget update failure
      await logFailure(
        user.id,
        'widget.update',
        'dpdpa_widget',
        error.message,
        request
      );

      return NextResponse.json(
        { error: 'Failed to update widget configuration', details: error.message },
        { status: 500 }
      );
    }

    // Log successful widget update
    await logSuccess(
      user.id,
      'widget.update',
      'dpdpa_widget',
      widgetId,
      updatePayload,
      request
    );

    if (!data) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // Log what was actually saved
    console.log('[Widget Config API] Widget config updated successfully:', {
      widgetId: data.widget_id,
      selectedActivitiesCount: data.selected_activities?.length || 0,
      selectedActivities: data.selected_activities
    });

    // Invalidate the public widget config cache so users see updated settings immediately
    const cacheKey = `dpdpa-widget-config:${data.widget_id}`;
    await cache.del(cacheKey);
    console.log('[Widget Config API] Cache invalidated for widget:', data.widget_id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete widget configuration and all related data
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

    // Rate limiting: 30 requests per minute for deleting widgets
    const rateLimitResult = await checkRateLimit({
      max: 30,
      window: 60000,
      identifier: getUserIdentifier(user.id),
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    console.log('Deleting DPDPA widget:', widgetId, 'for user:', user.id);

    // First, delete all related grievances for this widget
    console.log('Deleting related grievances...');
    const { error: grievancesError } = await supabase
      .from('dpdpa_grievances')
      .delete()
      .eq('widget_id', widgetId);

    if (grievancesError) {
      console.error('Error deleting grievances:', grievancesError);
      // Continue with deletion even if this fails
    }

    // Delete all related consent records for this widget
    console.log('Deleting related consent records...');
    const { error: consentError } = await supabase
      .from('dpdpa_consent_records')
      .delete()
      .eq('widget_id', widgetId);

    if (consentError) {
      console.error('Error deleting consent records:', consentError);
      // Continue with deletion even if this fails
    }

    // Finally, delete the widget configuration itself
    console.log('Deleting widget config...');
    const { error } = await supabase
      .from('dpdpa_widget_configs')
      .delete()
      .eq('widget_id', widgetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting widget config:', error);
      return NextResponse.json(
        { error: 'Failed to delete widget configuration', details: error.message },
        { status: 500 }
      );
    }

    console.log('DPDPA widget and all related data deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Widget and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
