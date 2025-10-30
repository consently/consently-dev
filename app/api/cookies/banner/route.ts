import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

/**
 * Banner Configuration API
 * Comprehensive banner customization and management
 * 
 * Features:
 * - Full CRUD operations for banner configs
 * - Theme customization (colors, fonts, borders)
 * - Position & layout options
 * - Button customization
 * - Multi-language support
 * - Preview mode
 * - Version history
 */

// Validation schemas
const bannerPositionSchema = z.enum([
  'top',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
  'center-modal'
]);

const bannerLayoutSchema = z.enum([
  'bar',
  'box',
  'modal',
  'popup',
  'inline',
  'floating'
]);

const hexColorSchema = z.string().refine(
  (val) => {
    // Allow hex colors
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) return true;
    // Allow transparent
    if (val === 'transparent') return true;
    // Allow other common CSS color keywords
    const cssColors = ['inherit', 'currentColor', 'initial', 'unset'];
    return cssColors.includes(val);
  },
  { message: 'Must be a valid hex color, "transparent", or CSS color keyword' }
);

const buttonStyleSchema = z.object({
  text: z.string().min(1),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  borderColor: hexColorSchema.optional(),
  borderRadius: z.number().min(0).max(50).optional(),
  fontSize: z.number().min(10).max(24).optional(),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
});

const bannerConfigSchema = z.object({
  name: z.string().min(1, 'Banner name is required'),
  description: z.string().optional().or(z.literal('')),
  position: bannerPositionSchema,
  layout: bannerLayoutSchema,
  
  // Theme customization
  theme: z.object({
    primaryColor: hexColorSchema,
    secondaryColor: hexColorSchema,
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    fontFamily: z.string().optional(),
    fontSize: z.number().min(12).max(20).optional(),
    borderRadius: z.number().min(0).max(50).optional(),
    boxShadow: z.boolean().optional(),
  }),
  
  // Content
  title: z.string().min(1),
  message: z.string().min(1),
  privacyPolicyUrl: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    try {
      new URL(val);
      return val;
    } catch {
      throw new Error('Invalid URL format');
    }
  }),
  privacyPolicyText: z.string().optional().or(z.literal('')).default('Privacy Policy'),
  
  // Buttons
  acceptButton: buttonStyleSchema,
  rejectButton: buttonStyleSchema.optional(),
  settingsButton: buttonStyleSchema.optional(),
  
  // Behavior
  showRejectButton: z.boolean().default(true),
  showSettingsButton: z.boolean().default(true),
  autoShow: z.boolean().default(true),
  showAfterDelay: z.number().min(0).max(60000).optional().default(0),
  respectDNT: z.boolean().default(false),
  blockContent: z.boolean().default(false),
  
  // Advanced
  customCSS: z.string().optional().or(z.literal('')),
  customJS: z.string().optional().or(z.literal('')),
  zIndex: z.number().min(1).max(999999).optional().default(9999),
  
  // Status
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type BannerConfig = z.infer<typeof bannerConfigSchema>;

// Helper function to transform snake_case database fields to camelCase
function transformBannerToCamelCase(banner: any) {
  return {
    id: banner.id,
    name: banner.name,
    description: banner.description,
    position: banner.position,
    layout: banner.layout,
    theme: banner.theme,
    title: banner.title,
    message: banner.message,
    privacyPolicyUrl: banner.privacy_policy_url,
    privacyPolicyText: banner.privacy_policy_text,
    acceptButton: banner.accept_button,
    rejectButton: banner.reject_button,
    settingsButton: banner.settings_button,
    showRejectButton: banner.show_reject_button,
    showSettingsButton: banner.show_settings_button,
    autoShow: banner.auto_show,
    showAfterDelay: banner.show_after_delay,
    respectDNT: banner.respect_dnt,
    blockContent: banner.block_content,
    customCSS: banner.custom_css,
    customJS: banner.custom_js,
    zIndex: banner.z_index,
    is_active: banner.is_active,
    is_default: banner.is_default,
    created_at: banner.created_at,
    updated_at: banner.updated_at,
  };
}

/**
 * GET /api/cookies/banner
 * Get banner configurations for the authenticated user
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
    const bannerId = searchParams.get('id');
    const activeOnly = searchParams.get('active') === 'true';
    const includeVersions = searchParams.get('versions') === 'true';

    // Get single banner
    if (bannerId) {
      const { data: banner, error } = await supabase
        .from('banner_configs')
        .select('*')
        .eq('id', bannerId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!banner) {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }

      // Transform snake_case to camelCase
      const transformedBanner = transformBannerToCamelCase(banner);

      // Get version history if requested
      let versions = null;
      if (includeVersions) {
        const { data: versionData } = await supabase
          .from('banner_versions')
          .select('*')
          .eq('banner_id', bannerId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        versions = versionData;
      }

      return NextResponse.json({
        success: true,
        data: transformedBanner,
        versions: versions,
      });
    }

    // Get all banners
    let query = supabase
      .from('banner_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: banners, error } = await query;

    if (error) throw error;

    // Transform all banners from snake_case to camelCase
    const transformedBanners = banners?.map(transformBannerToCamelCase) || [];

    return NextResponse.json({
      success: true,
      data: transformedBanners,
      total: transformedBanners.length,
    });

  } catch (error) {
    console.error('Error fetching banner configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookies/banner
 * Create a new banner configuration
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

    // Validate request body
    const validationResult = bannerConfigSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    // If this is set as default, unset other defaults
    if (config.is_default) {
      await supabase
        .from('banner_configs')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Transform camelCase to snake_case for database
    const dbConfig = {
      name: config.name,
      description: config.description,
      position: config.position,
      layout: config.layout,
      theme: config.theme,
      title: config.title,
      message: config.message,
      privacy_policy_url: config.privacyPolicyUrl,
      privacy_policy_text: config.privacyPolicyText,
      accept_button: config.acceptButton,
      reject_button: config.rejectButton,
      settings_button: config.settingsButton,
      show_reject_button: config.showRejectButton,
      show_settings_button: config.showSettingsButton,
      auto_show: config.autoShow,
      show_after_delay: config.showAfterDelay,
      respect_dnt: config.respectDNT,
      block_content: config.blockContent,
      custom_css: config.customCSS,
      custom_js: config.customJS,
      z_index: config.zIndex,
      is_active: config.is_active,
      is_default: config.is_default,
      user_id: user.id,
    };

    // Create banner config
    const { data: banner, error } = await supabase
      .from('banner_configs')
      .insert(dbConfig)
      .select()
      .single();

    if (error) throw error;

    // Create initial version
    await supabase
      .from('banner_versions')
      .insert({
        banner_id: banner.id,
        user_id: user.id,
        config: config,
        version: 1,
        change_description: 'Initial version',
      });

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'banner_configured',
      resource_type: 'banner_config',
      resource_id: banner.id,
      changes: { created: banner },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    // Transform to camelCase for response
    const transformedBanner = transformBannerToCamelCase(banner);

    return NextResponse.json({
      success: true,
      data: transformedBanner,
      message: 'Banner configuration created successfully',
    });

  } catch (error) {
    console.error('Error creating banner config:', error);
    return NextResponse.json(
      { error: 'Failed to create banner configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cookies/banner
 * Update an existing banner configuration
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

    if (!body.id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      );
    }

    // Get existing banner
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banner_configs')
      .select('*')
      .eq('id', body.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Validate update data
    const { id, ...updates } = body;
    const validationResult = bannerConfigSchema.partial().safeParse(updates);

    if (!validationResult.success) {
      console.error('Validation failed (update):', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (validationResult.data.is_default) {
      await supabase
        .from('banner_configs')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id);
    }

    // Transform camelCase to snake_case for database (only fields that are present)
    const config = validationResult.data;
    const dbUpdates: any = {};
    
    if (config.name !== undefined) dbUpdates.name = config.name;
    if (config.description !== undefined) dbUpdates.description = config.description;
    if (config.position !== undefined) dbUpdates.position = config.position;
    if (config.layout !== undefined) dbUpdates.layout = config.layout;
    if (config.theme !== undefined) dbUpdates.theme = config.theme;
    if (config.title !== undefined) dbUpdates.title = config.title;
    if (config.message !== undefined) dbUpdates.message = config.message;
    if (config.privacyPolicyUrl !== undefined) dbUpdates.privacy_policy_url = config.privacyPolicyUrl;
    if (config.privacyPolicyText !== undefined) dbUpdates.privacy_policy_text = config.privacyPolicyText;
    if (config.acceptButton !== undefined) dbUpdates.accept_button = config.acceptButton;
    if (config.rejectButton !== undefined) dbUpdates.reject_button = config.rejectButton;
    if (config.settingsButton !== undefined) dbUpdates.settings_button = config.settingsButton;
    if (config.showRejectButton !== undefined) dbUpdates.show_reject_button = config.showRejectButton;
    if (config.showSettingsButton !== undefined) dbUpdates.show_settings_button = config.showSettingsButton;
    if (config.autoShow !== undefined) dbUpdates.auto_show = config.autoShow;
    if (config.showAfterDelay !== undefined) dbUpdates.show_after_delay = config.showAfterDelay;
    if (config.respectDNT !== undefined) dbUpdates.respect_dnt = config.respectDNT;
    if (config.blockContent !== undefined) dbUpdates.block_content = config.blockContent;
    if (config.customCSS !== undefined) dbUpdates.custom_css = config.customCSS;
    if (config.customJS !== undefined) dbUpdates.custom_js = config.customJS;
    if (config.zIndex !== undefined) dbUpdates.z_index = config.zIndex;
    if (config.is_active !== undefined) dbUpdates.is_active = config.is_active;
    if (config.is_default !== undefined) dbUpdates.is_default = config.is_default;

    // Update banner
    const { data: updatedBanner, error } = await supabase
      .from('banner_configs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Get current version number
    const { data: versions } = await supabase
      .from('banner_versions')
      .select('version')
      .eq('banner_id', id)
      .order('version', { ascending: false })
      .limit(1);

    const newVersion = (versions?.[0]?.version || 0) + 1;

    // Create new version
    await supabase
      .from('banner_versions')
      .insert({
        banner_id: id,
        user_id: user.id,
        config: updatedBanner,
        version: newVersion,
        change_description: body.change_description || 'Updated configuration',
      });

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'banner_configured',
      resource_type: 'banner_config',
      resource_id: id,
      changes: { 
        before: existingBanner,
        after: updatedBanner 
      },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    // Transform to camelCase for response
    const transformedBanner = transformBannerToCamelCase(updatedBanner);

    return NextResponse.json({
      success: true,
      data: transformedBanner,
      version: newVersion,
      message: 'Banner configuration updated successfully',
    });

  } catch (error) {
    console.error('Error updating banner config:', error);
    return NextResponse.json(
      { error: 'Failed to update banner configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookies/banner
 * Delete a banner configuration
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
    const bannerId = searchParams.get('id');

    if (!bannerId) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      );
    }

    // Get banner before deletion
    const { data: banner, error: fetchError } = await supabase
      .from('banner_configs')
      .select('*')
      .eq('id', bannerId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Delete associated versions
    await supabase
      .from('banner_versions')
      .delete()
      .eq('banner_id', bannerId);

    // Delete banner
    const { error } = await supabase
      .from('banner_configs')
      .delete()
      .eq('id', bannerId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Log audit
    await logAudit({
      user_id: user.id,
      action: 'banner.delete',
      resource_type: 'banner_config',
      resource_id: bannerId,
      changes: { deleted: banner },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Banner configuration deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting banner config:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner configuration' },
      { status: 500 }
    );
  }
}
