import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      industry,
      websiteUrl,
      companyName,
      language,
      categories,
      bannerStyle,
      primaryColor
    } = body;

    // Validate required fields
    if (!industry || !websiteUrl || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update user profile with onboarding data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: companyName,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // Create cookie banner configuration
    const { error: bannerError } = await supabase
      .from('cookie_banners')
      .insert({
        user_id: user.id,
        website_url: websiteUrl,
        banner_style: bannerStyle,
        primary_color: primaryColor,
        language: language,
        categories: categories,
        industry: industry,
        is_active: true
      });

    if (bannerError) {
      console.error('Error creating banner config:', bannerError);
      // Continue even if banner creation fails - user can set it up later
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
