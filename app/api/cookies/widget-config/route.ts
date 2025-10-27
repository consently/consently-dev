import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for better type safety
type WidgetConfigData = {
  widgetId: string;
  domain: string;
  categories?: string[];
  behavior?: string;
  consentDuration?: number;
  showBrandingLink?: boolean;
  blockScripts?: boolean;
  respectDNT?: boolean;
  gdprApplies?: boolean;
  autoBlock?: string[];
  bannerTemplateId?: string | null;
  language?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    fontFamily?: string;
    logoUrl?: string;
  };
  supportedLanguages?: string[];
  autoShow?: boolean;
  showAfterDelay?: number;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found in session');
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    console.log('Processing widget config save for user:', user.id);

    const config: WidgetConfigData = await request.json();
    console.log('Received config:', JSON.stringify(config, null, 2));

    // Validate required fields
    if (!config.widgetId || typeof config.widgetId !== 'string') {
      return NextResponse.json(
        { error: 'Valid widgetId is required' },
        { status: 400 }
      );
    }

    if (!config.domain || typeof config.domain !== 'string') {
      return NextResponse.json(
        { error: 'Valid domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format (basic check)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(config.domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Example: example.com' },
        { status: 400 }
      );
    }

    // Validate behavior (implicit removed)
    const validBehaviors = ['explicit', 'optout'];
    if (config.behavior && !validBehaviors.includes(config.behavior)) {
      return NextResponse.json(
        { error: 'Invalid behavior. Must be: explicit or optout' },
        { status: 400 }
      );
    }

    // Validate consent duration
    if (config.consentDuration && (config.consentDuration < 1 || config.consentDuration > 365)) {
      return NextResponse.json(
        { error: 'Consent duration must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Validate categories
    if (config.categories && !Array.isArray(config.categories)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    // Check if config already exists
    console.log('Checking for existing widget config...');
    const { data: existing, error: selectError } = await supabase
      .from('widget_configs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing config:', selectError);
      throw selectError;
    }

    // If bannerTemplateId is provided, verify it exists and belongs to user
    if (config.bannerTemplateId) {
      const { data: template, error: templateError } = await supabase
        .from('banner_configs')
        .select('id')
        .eq('id', config.bannerTemplateId)
        .eq('user_id', user.id)
        .single();
      
      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Invalid banner template ID or template does not belong to user' },
          { status: 400 }
        );
      }
    }

    // Prepare data for database (ensure proper types)
    const dbData = {
      user_id: user.id,
      widget_id: config.widgetId,
      domain: config.domain,
      categories: config.categories || ['necessary'], // Ensure it's an array
      behavior: config.behavior || 'explicit',
      consent_duration: config.consentDuration || 365,
      show_branding_link: config.showBrandingLink ?? true,
      block_scripts: config.blockScripts ?? true,
      respect_dnt: config.respectDNT ?? false,
      gdpr_applies: config.gdprApplies ?? true,
      auto_block: config.autoBlock || [],
      banner_template_id: config.bannerTemplateId || null,
      language: config.language || 'en',
      theme: config.theme || null,
      supported_languages: config.supportedLanguages || ['en'],
      auto_show: config.autoShow ?? true,
      show_after_delay: config.showAfterDelay ?? 1000
    };

    console.log('Database data:', JSON.stringify(dbData, null, 2));

    if (existing) {
      console.log('Updating existing config with ID:', existing.id);
      const { error: updateError } = await supabase
        .from('widget_configs')
        .update({
          widget_id: dbData.widget_id,
          domain: dbData.domain,
          categories: dbData.categories,
          behavior: dbData.behavior,
          consent_duration: dbData.consent_duration,
          show_branding_link: dbData.show_branding_link,
          block_scripts: dbData.block_scripts,
          respect_dnt: dbData.respect_dnt,
          gdpr_applies: dbData.gdpr_applies,
          auto_block: dbData.auto_block,
          banner_template_id: dbData.banner_template_id,
          language: dbData.language,
          theme: dbData.theme,
          supported_languages: dbData.supported_languages,
          auto_show: dbData.auto_show,
          show_after_delay: dbData.show_after_delay,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      console.log('Config updated successfully');
    } else {
      console.log('Creating new widget config...');
      const { error: insertError } = await supabase
        .from('widget_configs')
        .insert(dbData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      console.log('Config created successfully');
    }

    console.log('Widget config saved successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Configuration saved successfully' 
    });

  } catch (error) {
    console.error('Error saving widget config:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    // Handle different types of database errors
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';

    return NextResponse.json(
      { 
        error: 'Failed to save configuration',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in GET:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found in GET request');
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    console.log('Fetching widget config for user:', user.id);

    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No configuration found for user:', user.id);
        return NextResponse.json(
          { error: 'No configuration found' },
          { status: 404 }
        );
      }
      console.error('Database error in GET:', error);
      throw error;
    }

    console.log('Found widget config:', data.id);

    // Map database fields to frontend format
    const config = {
      widgetId: data.widget_id,
      domain: data.domain,
      categories: Array.isArray(data.categories) ? data.categories : ['necessary'],
      behavior: data.behavior === 'implicit' ? 'explicit' : data.behavior,
      consentDuration: data.consent_duration,
      showBrandingLink: data.show_branding_link,
      blockScripts: data.block_scripts,
      respectDNT: data.respect_dnt,
      gdprApplies: data.gdpr_applies,
      autoBlock: Array.isArray(data.auto_block) ? data.auto_block : [],
      bannerTemplateId: data.banner_template_id,
      language: data.language || 'en',
      theme: data.theme || {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 12
      },
      supportedLanguages: Array.isArray(data.supported_languages) ? data.supported_languages : ['en'],
      autoShow: data.auto_show ?? true,
      showAfterDelay: data.show_after_delay ?? 1000
    };

    console.log('Returning config:', JSON.stringify(config, null, 2));
    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching widget config:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';

    return NextResponse.json(
      { 
        error: 'Failed to fetch configuration',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
