import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const config = await request.json();

    const { data: existing } = await supabase
      .from('widget_configs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from('widget_configs')
        .update({
          widget_id: config.widgetId,
          domain: config.domain,
          categories: config.categories,
          behavior: config.behavior,
          consent_duration: config.consentDuration,
          show_branding_link: config.showBrandingLink,
          block_scripts: config.blockScripts,
          respect_dnt: config.respectDNT,
          gdpr_applies: config.gdprApplies,
          auto_block: config.autoBlock,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('widget_configs')
        .insert({
          user_id: user.id,
          widget_id: config.widgetId,
          domain: config.domain,
          categories: config.categories,
          behavior: config.behavior,
          consent_duration: config.consentDuration,
          show_branding_link: config.showBrandingLink,
          block_scripts: config.blockScripts,
          respect_dnt: config.respectDNT,
          gdpr_applies: config.gdprApplies,
          auto_block: config.autoBlock
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving widget config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'No configuration found' },
        { status: 404 }
      );
    }

    // Map database fields to frontend format
    const config = {
      widgetId: data.widget_id,
      domain: data.domain,
      categories: data.categories,
      behavior: data.behavior,
      consentDuration: data.consent_duration,
      showBrandingLink: data.show_branding_link,
      blockScripts: data.block_scripts,
      respectDNT: data.respect_dnt,
      gdprApplies: data.gdpr_applies,
      autoBlock: data.auto_block || []
    };

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
