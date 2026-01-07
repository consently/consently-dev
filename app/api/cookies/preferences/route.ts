import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { widgetId, preferences } = body;
    
    if (!widgetId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'widgetId and preferences are required' },
        { status: 400 }
      );
    }
    
    // Validate that the widget exists
    const { data: widget, error: widgetError } = await supabase
      .from('widget_configs')
      .select('id')
      .eq('widget_id', widgetId)
      .single();
    
    if (widgetError || !widget) {
      return NextResponse.json(
        { success: false, error: 'Invalid widget ID' },
        { status: 404 }
      );
    }
    
    // Save or update cookie preferences
    const { data, error } = await supabase
      .from('user_cookie_preferences')
      .upsert({
        user_id: user.id,
        widget_id: widgetId,
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving cookie preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Error in cookie preferences API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');
    
    if (!widgetId) {
      return NextResponse.json(
        { success: false, error: 'widgetId is required' },
        { status: 400 }
      );
    }
    
    // Get user's cookie preferences
    const { data, error } = await supabase
      .from('user_cookie_preferences')
      .select('preferences, updated_at')
      .eq('user_id', user.id)
      .eq('widget_id', widgetId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching cookie preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data || { preferences: {}, updated_at: null }
    });
    
  } catch (error) {
    console.error('Error in cookie preferences API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
