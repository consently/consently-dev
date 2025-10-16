import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { INDIAN_LANGUAGE_TRANSLATIONS, getTranslationByCode } from '@/lib/indian-language-translations';

/**
 * Widget Translations API
 * Multi-language support for cookie consent widgets
 * 
 * Features:
 * - Manage translations for all widget text
 * - Language detection
 * - Auto-translation suggestions (placeholder for AI integration)
 * - Translation validation
 * - Import/export translations
 * - RTL language support
 * - Fallback language handling
 */

const translationSchema = z.object({
  language_code: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code (e.g., en, en-US)'),
  language_name: z.string().min(1),
  is_rtl: z.boolean().default(false),
  is_default: z.boolean().default(false),
  translations: z.object({
    banner: z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      accept_button: z.string().min(1),
      reject_button: z.string().min(1),
      settings_button: z.string().min(1),
      close_button: z.string().optional(),
      privacy_policy_link: z.string().optional(),
    }),
    settings_modal: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      save_button: z.string().min(1),
      accept_all_button: z.string().min(1),
      reject_all_button: z.string().min(1),
      close_button: z.string().min(1),
    }),
    categories: z.object({
      necessary: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
      functional: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
      analytics: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
      advertising: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
      social: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }).optional(),
      preferences: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }).optional(),
    }),
    messages: z.object({
      consent_saved: z.string().optional(),
      consent_updated: z.string().optional(),
      error_message: z.string().optional(),
    }).optional(),
  }),
  is_active: z.boolean().default(true),
  is_complete: z.boolean().default(true),
});

const bulkTranslationSchema = z.object({
  translations: z.array(translationSchema),
});

/**
 * GET /api/cookies/translations
 * Get widget translations
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
    const languageCode = searchParams.get('language');
    const activeOnly = searchParams.get('active') === 'true';
    const exportFormat = searchParams.get('export');

    // Get specific language
    if (languageCode) {
      const { data: translation, error } = await supabase
        .from('widget_translations')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_code', languageCode)
        .single();

      if (error) {
        // If not found, return default template
        if (error.code === 'PGRST116') {
          const defaultTranslation = getDefaultTranslation(languageCode);
          return NextResponse.json({
            success: true,
            data: defaultTranslation,
            is_default: true,
            message: 'Using default translation template',
          });
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: translation,
        is_default: false,
      });
    }

    // Get all translations
    let query = supabase
      .from('widget_translations')
      .select('*')
      .eq('user_id', user.id)
      .order('language_code', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: translations, error } = await query;

    if (error) throw error;

    // Handle export
    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(translations, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="widget-translations-${Date.now()}.json"`,
        },
      });
    }

    // Get supported languages list
    const supportedLanguages = getSupportedLanguages();

    return NextResponse.json({
      success: true,
      data: translations,
      total: translations?.length || 0,
      supported_languages: supportedLanguages,
    });

  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/translations
 * Create or import translations
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

    // Check for bulk import
    if (body.translations && Array.isArray(body.translations)) {
      const bulkValidation = bulkTranslationSchema.safeParse(body);

      if (!bulkValidation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid bulk translation data',
            details: bulkValidation.error.issues 
          },
          { status: 400 }
        );
      }

      const translationsToCreate = bulkValidation.data.translations.map(t => ({
        ...t,
        user_id: user.id,
      }));

      const { data: created, error } = await supabase
        .from('widget_translations')
        .upsert(translationsToCreate, {
          onConflict: 'user_id,language_code',
        })
        .select();

      if (error) throw error;

      await logAudit({
        user_id: user.id,
        action: 'translation_created',
        resource_type: 'translation',
        changes: { bulk_import: created?.length },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        data: created,
        message: `${created?.length} translations imported successfully`,
      });
    }

    // Single translation create/update
    const validationResult = translationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid translation data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const translation = validationResult.data;

    // If setting as default, unset other defaults
    if (translation.is_default) {
      await supabase
        .from('widget_translations')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Validate translation completeness
    const completeness = validateTranslationCompleteness(translation.translations);
    const translationData = {
      ...translation,
      user_id: user.id,
      is_complete: completeness.is_complete,
      completion_percentage: completeness.percentage,
    };

    const { data: saved, error } = await supabase
      .from('widget_translations')
      .upsert(translationData, {
        onConflict: 'user_id,language_code',
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      user_id: user.id,
      action: 'translation_created',
      resource_type: 'translation',
      resource_id: saved.id,
      changes: { language: translation.language_code },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: saved,
      completeness: completeness,
      message: 'Translation saved successfully',
    });

  } catch (error) {
    console.error('Error creating translation:', error);
    return NextResponse.json(
      { error: 'Failed to create translation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cookies/translations
 * Update existing translation
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

    if (!body.id && !body.language_code) {
      return NextResponse.json(
        { error: 'Translation ID or language code is required' },
        { status: 400 }
      );
    }

    const { id, language_code, ...updates } = body;

    // Validate updates
    const validationResult = translationSchema.partial().safeParse(updates);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid update data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    let updateData = validationResult.data;

    // If translations are being updated, validate completeness
    let completenessData: any = {};
    if (updateData.translations) {
      const completeness = validateTranslationCompleteness(updateData.translations);
      // Note: is_complete and completion_percentage should be database columns
      // For now, we'll skip them in the update
      // completenessData = {
      //   is_complete: completeness.is_complete,
      //   completion_percentage: completeness.percentage,
      // };
    }

    // If setting as default, unset others
    if (updateData.is_default) {
      await supabase
        .from('widget_translations')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id || '');
    }

    // Update translation
    let query = supabase
      .from('widget_translations')
      .update(updateData)
      .eq('user_id', user.id);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('language_code', language_code);
    }

    const { data: updated, error } = await query.select().single();

    if (error) throw error;

    await logAudit({
      user_id: user.id,
      action: 'translation_updated',
      resource_type: 'translation',
      resource_id: updated.id,
      changes: updates,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Translation updated successfully',
    });

  } catch (error) {
    console.error('Error updating translation:', error);
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/translations
 * Delete a translation
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
    const translationId = searchParams.get('id');
    const languageCode = searchParams.get('language');

    if (!translationId && !languageCode) {
      return NextResponse.json(
        { error: 'Translation ID or language code is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('widget_translations')
      .delete()
      .eq('user_id', user.id);

    if (translationId) {
      query = query.eq('id', translationId);
    } else {
      query = query.eq('language_code', languageCode);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Translation deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting translation:', error);
    return NextResponse.json(
      { error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}

// Helper functions

function getDefaultTranslation(languageCode: string): any {
  // Check if it's an Indian language translation
  const indianTranslation = getTranslationByCode(languageCode);
  if (indianTranslation) {
    return indianTranslation;
  }

  // Default English translation
  const defaults: Record<string, any> = {
    'en': {
      language_code: 'en',
      language_name: 'English',
      is_rtl: false,
      translations: {
        banner: {
          title: 'We use cookies',
          message: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
          accept_button: 'Accept All',
          reject_button: 'Reject All',
          settings_button: 'Cookie Settings',
          privacy_policy_link: 'Privacy Policy',
        },
        settings_modal: {
          title: 'Cookie Settings',
          description: 'We use cookies to improve your experience. Choose which cookies you want to accept.',
          save_button: 'Save Preferences',
          accept_all_button: 'Accept All',
          reject_all_button: 'Reject All',
          close_button: 'Close',
        },
        categories: {
          necessary: {
            name: 'Necessary',
            description: 'These cookies are essential for the website to function properly.',
          },
          functional: {
            name: 'Functional',
            description: 'These cookies enable enhanced functionality and personalization.',
          },
          analytics: {
            name: 'Analytics',
            description: 'These cookies help us understand how visitors interact with our website.',
          },
          advertising: {
            name: 'Advertising',
            description: 'These cookies are used to deliver relevant advertisements.',
          },
        },
        messages: {
          consent_saved: 'Your preferences have been saved.',
          consent_updated: 'Your preferences have been updated.',
          error_message: 'An error occurred. Please try again.',
        },
      },
    },
  };

  return defaults[languageCode] || defaults['en'];
}

function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English', rtl: false },
    { code: 'es', name: 'Español', rtl: false },
    { code: 'fr', name: 'Français', rtl: false },
    { code: 'de', name: 'Deutsch', rtl: false },
    { code: 'it', name: 'Italiano', rtl: false },
    { code: 'pt', name: 'Português', rtl: false },
    { code: 'nl', name: 'Nederlands', rtl: false },
    { code: 'pl', name: 'Polski', rtl: false },
    { code: 'ru', name: 'Русский', rtl: false },
    { code: 'ja', name: '日本語', rtl: false },
    { code: 'zh', name: '中文', rtl: false },
    { code: 'ko', name: '한국어', rtl: false },
    { code: 'ar', name: 'العربية', rtl: true },
    { code: 'he', name: 'עברית', rtl: true },
    // Indian Languages (Schedule 8)
    { code: 'hi', name: 'हिन्दी', rtl: false },
    { code: 'bn', name: 'বাংলা', rtl: false },
    { code: 'ta', name: 'தமிழ்', rtl: false },
    { code: 'te', name: 'తెలుగు', rtl: false },
    { code: 'mr', name: 'मराठी', rtl: false },
  ];
}

function validateTranslationCompleteness(translations: any) {
  let totalFields = 0;
  let completedFields = 0;

  function checkObject(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        totalFields++;
        if (obj[key] && obj[key].trim().length > 0) {
          completedFields++;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkObject(obj[key]);
      }
    }
  }

  checkObject(translations);

  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return {
    is_complete: percentage === 100,
    percentage,
    completed_fields: completedFields,
    total_fields: totalFields,
    missing_fields: totalFields - completedFields,
  };
}
