import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const widgetConfigSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  domain: z.string().min(3, 'Domain is required'),
  position: z.enum(['top', 'bottom', 'center', 'bottom-left', 'bottom-right', 'modal']).optional(),
  layout: z.enum(['modal', 'slide-in', 'banner']).optional(),
  theme: z.any().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  acceptButtonText: z.string().optional(),
  rejectButtonText: z.string().optional(),
  customizeButtonText: z.string().optional(),
  selectedActivities: z.array(z.string()).optional(),
  autoShow: z.boolean().optional(),
  showAfterDelay: z.number().optional(),
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

    // Prepare data for insertion
    const insertData = {
      user_id: user.id,
      widget_id: widgetId,
      name: configData.name,
      domain: configData.domain,
      position: configData.position || 'bottom-right',
      layout: configData.layout || 'modal',
      theme: configData.theme,
      title: configData.title,
      message: configData.message,
      accept_button_text: configData.acceptButtonText,
      reject_button_text: configData.rejectButtonText,
      customize_button_text: configData.customizeButtonText,
      selected_activities: configData.selectedActivities || [],
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
    };

    // Insert widget configuration
    const { data, error } = await supabase
      .from('dpdpa_widget_configs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating widget config:', error);
      return NextResponse.json(
        { error: 'Failed to create widget configuration' },
        { status: 500 }
      );
    }

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
    if (configData.position !== undefined) updatePayload.position = configData.position;
    if (configData.layout !== undefined) updatePayload.layout = configData.layout;
    if (configData.theme !== undefined) updatePayload.theme = configData.theme;
    if (configData.title !== undefined) updatePayload.title = configData.title;
    if (configData.message !== undefined) updatePayload.message = configData.message;
    if (configData.acceptButtonText !== undefined) updatePayload.accept_button_text = configData.acceptButtonText;
    if (configData.rejectButtonText !== undefined) updatePayload.reject_button_text = configData.rejectButtonText;
    if (configData.customizeButtonText !== undefined) updatePayload.customize_button_text = configData.customizeButtonText;
    if (configData.selectedActivities !== undefined) updatePayload.selected_activities = configData.selectedActivities;
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

    // Update widget configuration
    const { data, error } = await supabase
      .from('dpdpa_widget_configs')
      .update(updatePayload)
      .eq('widget_id', widgetId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating widget config:', error);
      return NextResponse.json(
        { error: 'Failed to update widget configuration' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete widget configuration
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

    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    // Delete widget configuration
    const { error } = await supabase
      .from('dpdpa_widget_configs')
      .delete()
      .eq('widget_id', widgetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting widget config:', error);
      return NextResponse.json(
        { error: 'Failed to delete widget configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Widget configuration deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
