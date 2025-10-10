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

    // Check if user already has a banner config
    const { data: existing } = await supabase
      .from('cookie_banners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing config
      const { error: updateError } = await supabase
        .from('cookie_banners')
        .update({
          banner_style: config.template,
          position: config.position,
          primary_color: config.primaryColor,
          text_color: config.textColor,
          background_color: config.backgroundColor,
          title: config.title,
          message: config.message,
          accept_text: config.acceptText,
          reject_text: config.rejectText,
          settings_text: config.settingsText,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Create new config
      const { error: insertError } = await supabase
        .from('cookie_banners')
        .insert({
          user_id: user.id,
          banner_style: config.template,
          position: config.position,
          primary_color: config.primaryColor,
          text_color: config.textColor,
          background_color: config.backgroundColor,
          title: config.title,
          message: config.message,
          accept_text: config.acceptText,
          reject_text: config.rejectText,
          settings_text: config.settingsText,
          is_active: true
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving banner config:', error);
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
      .from('cookie_banners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'No configuration found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching banner config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
