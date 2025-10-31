import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Cookie Policy Generator API
 * Generates customizable cookie policy documents based on scan results
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
    const { 
      companyName, 
      websiteUrl, 
      contactEmail, 
      companyAddress,
      scanId, // Optional: link to a specific scan
      includeInventory = true 
    } = body;

    // Validate required fields
    if (!companyName || !websiteUrl || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, websiteUrl, contactEmail' },
        { status: 400 }
      );
    }

    // Get cookie inventory from scan if scanId provided
    let cookieInventory = null;
    if (scanId) {
      const { data: scanData } = await supabase
        .from('cookie_scans')
        .select('cookies')
        .eq('id', scanId)
        .eq('user_id', user.id)
        .single();
      
      if (scanData) {
        cookieInventory = scanData.cookies;
      }
    }

    // Generate policy metadata
    const policyData = {
      company_name: companyName,
      website_url: websiteUrl,
      contact_email: contactEmail,
      company_address: companyAddress,
      last_updated_date: new Date().toISOString().split('T')[0],
      policy_version: '1.0',
      cookie_inventory: includeInventory ? cookieInventory : null,
    };

    // Store policy configuration
    const { data: policy, error: insertError } = await supabase
      .from('cookie_policies')
      .insert({
        user_id: user.id,
        company_name: companyName,
        website_url: websiteUrl,
        contact_email: contactEmail,
        company_address: companyAddress,
        policy_data: policyData,
        scan_id: scanId || null,
        version: '1.0',
        is_published: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating policy:', insertError);
      return NextResponse.json(
        { error: 'Failed to create policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: policy.id,
        ...policyData,
      },
      message: 'Cookie policy generated successfully',
    });

  } catch (error) {
    console.error('Error in policy generator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve user's cookie policies
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
    const policyId = searchParams.get('id');

    if (policyId) {
      // Get specific policy
      const { data: policy, error } = await supabase
        .from('cookie_policies')
        .select('*')
        .eq('id', policyId)
        .eq('user_id', user.id)
        .single();

      if (error || !policy) {
        return NextResponse.json(
          { error: 'Policy not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: policy,
      });
    }

    // Get all policies
    const { data: policies, error } = await supabase
      .from('cookie_policies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch policies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policies || [],
      total: policies?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update cookie policy
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    // Update policy
    const { data: policy, error } = await supabase
      .from('cookie_policies')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy updated successfully',
    });

  } catch (error) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
