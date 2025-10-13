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

    // Prepare banner data
    const bannerData = {
      user_id: user.id,
      website_url: config.website_url || '',
      banner_style: config.template || 'modal',
      position: config.position || 'bottom',
      primary_color: config.primaryColor || '#3b82f6',
      text_color: config.textColor || '#1f2937',
      background_color: config.backgroundColor || '#ffffff',
      title: config.title || 'We value your privacy',
      message: config.message || 'This website uses cookies to enhance your experience.',
      accept_text: config.acceptText || 'Accept All',
      reject_text: config.rejectText || 'Reject All',
      settings_text: config.settingsText || 'Cookie Settings',
      categories: config.categories ? JSON.stringify(config.categories) : JSON.stringify(['necessary']),
      is_active: true,
    };

    // Check if user already has a banner config
    const { data: existing } = await supabase
      .from('cookie_banners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let bannerId: string;

    if (existing) {
      // Update existing config
      const { error: updateError, data: updated } = await supabase
        .from('cookie_banners')
        .update({
          ...bannerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError) throw updateError;
      bannerId = updated.id;
    } else {
      // Create new config
      const { error: insertError, data: inserted } = await supabase
        .from('cookie_banners')
        .insert(bannerData)
        .select('id')
        .single();

      if (insertError) throw insertError;
      bannerId = inserted.id;
    }

    // If cookies data is provided, bulk import them
    if (config.cookies && Array.isArray(config.cookies) && config.cookies.length > 0) {
      const cookiesData = config.cookies.map((cookie: any) => ({
        user_id: user.id,
        name: cookie.name,
        domain: config.website_url || 'unknown',
        category: cookie.category || 'necessary',
        purpose: cookie.description || '',
        description: cookie.description || '',
        provider: cookie.provider || 'Unknown',
        expiry: cookie.expiry || 'Session',
        is_active: true,
      }));

      // Upsert cookies (insert or update if exists)
      const { error: cookiesError } = await supabase
        .from('cookies')
        .upsert(cookiesData, {
          onConflict: 'user_id,name,domain',
          ignoreDuplicates: false,
        });

      if (cookiesError) {
        console.error('Error saving cookies:', cookiesError);
        // Don't fail the entire request if cookies save fails
      }
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
