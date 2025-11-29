import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { industryTemplates, convertLegacyTemplate } from '@/lib/industry-templates';
import { v4 as uuidv4 } from 'uuid';

// Map onboarding industry names to template industry keys
const industryMapping: Record<string, string> = {
  'E-commerce': 'e-commerce',
  'Healthcare': 'healthcare',
  'Financial Services': 'banking',
  'Education': 'education',
  'Technology/SaaS': 'other',
  'Media & Entertainment': 'other',
  'Travel & Hospitality': 'travel',
  'Real Estate': 'real-estate',
  'Government': 'other',
  'Other': 'other',
};

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

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
      bannerStyle,
      primaryColor
    } = body;
    
    // Default consent categories (since we removed the selection step)
    const categories = ['necessary', 'analytics', 'marketing', 'preferences'];

    // Validate required fields
    if (!industry || !websiteUrl || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const domain = extractDomain(websiteUrl);
    const templateIndustry = industryMapping[industry] || 'other';
    
    // Generate unique widget IDs
    const cookieWidgetId = `cookie_${uuidv4().substring(0, 8)}`;
    const dpdpaWidgetId = `dpdpa_${uuidv4().substring(0, 8)}`;

    // 1. Update user profile with onboarding data
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

    // 2. Create cookie banner configuration (legacy table)
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
    }

    // 3. Create Cookie Widget Config
    const { error: cookieWidgetError } = await supabase
      .from('widget_configs')
      .insert({
        user_id: user.id,
        widget_id: cookieWidgetId,
        domain: domain,
        categories: categories || ['necessary', 'analytics', 'marketing', 'preferences'],
        behavior: 'explicit',
        consent_duration: 365,
        show_branding_link: true,
        block_scripts: true,
        respect_dnt: false,
        gdpr_applies: true,
        auto_block: []
      });

    if (cookieWidgetError) {
      console.error('Error creating cookie widget config:', cookieWidgetError);
    }

    // 4. Create DPDPA Widget Config
    const dpdpaTheme = {
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: '#1e40af',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: 12,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      boxShadow: true
    };

    const { data: dpdpaWidget, error: dpdpaWidgetError } = await supabase
      .from('dpdpa_widget_configs')
      .insert({
        user_id: user.id,
        widget_id: dpdpaWidgetId,
        name: `${companyName} DPDPA Widget`,
        domain: domain,
        position: 'bottom-right',
        layout: bannerStyle === 'floating' ? 'modal' : 'banner',
        theme: dpdpaTheme,
        title: 'Your Data Privacy Rights',
        message: 'We process your personal data with your consent under the Digital Personal Data Protection Act, 2023. Please review the activities below and choose your preferences.',
        accept_button_text: 'Accept All',
        reject_button_text: 'Reject All',
        customize_button_text: 'Manage Preferences',
        selected_activities: [],
        auto_show: true,
        show_after_delay: 1000,
        consent_duration: 365,
        respect_dnt: false,
        require_explicit_consent: true,
        show_data_subjects_rights: true,
        language: language || 'en',
        supported_languages: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
        enable_analytics: true,
        enable_audit_log: true,
        show_branding: true,
        is_active: true,
        display_rules: []
      })
      .select('id, widget_id')
      .single();

    if (dpdpaWidgetError) {
      console.error('Error creating DPDPA widget config:', dpdpaWidgetError);
    }

    // 5. Create default processing activities based on industry
    const industryTemplate = industryTemplates.find(t => t.industry === templateIndustry);
    const createdActivityIds: string[] = [];

    if (industryTemplate && industryTemplate.activities.length > 0) {
      // Get predefined purposes for linking
      const { data: purposes } = await supabase
        .from('purposes')
        .select('id, purpose_name, name');

      const purposeMap = new Map(
        (purposes || []).map(p => [p.purpose_name || p.name, p.id])
      );

      // Create first 3 activities from the template
      const activitiesToCreate = industryTemplate.activities.slice(0, 3);

      for (const activityTemplate of activitiesToCreate) {
        const convertedTemplate = convertLegacyTemplate(activityTemplate);

        // Create the processing activity
        const { data: activity, error: activityError } = await supabase
          .from('processing_activities')
          .insert({
            user_id: user.id,
            activity_name: convertedTemplate.activity_name,
            industry: templateIndustry,
            data_attributes: convertedTemplate.data_attributes || [],
            purpose: convertedTemplate.purpose || '',
            retention_period: convertedTemplate.retention_period || '3 years',
            data_processors: convertedTemplate.data_processors || { sources: [] },
            legal_basis: convertedTemplate.legalBasis || 'consent',
            is_active: true
          })
          .select('id')
          .single();

        if (activityError) {
          console.error('Error creating processing activity:', activityError);
          continue;
        }

        if (activity) {
          createdActivityIds.push(activity.id);

          // Create activity purposes if template has them
          if (convertedTemplate.purposes && convertedTemplate.purposes.length > 0) {
            for (const purposeTemplate of convertedTemplate.purposes) {
              const purposeId = purposeMap.get(purposeTemplate.purposeName);
              
              if (purposeId) {
                const { data: activityPurpose, error: apError } = await supabase
                  .from('activity_purposes')
                  .insert({
                    activity_id: activity.id,
                    purpose_id: purposeId,
                    legal_basis: purposeTemplate.legalBasis
                  })
                  .select('id')
                  .single();

                if (apError) {
                  console.error('Error creating activity purpose:', apError);
                  continue;
                }

                // Create purpose data categories
                if (activityPurpose && purposeTemplate.dataCategories) {
                  for (const category of purposeTemplate.dataCategories) {
                    await supabase
                      .from('purpose_data_categories')
                      .insert({
                        activity_purpose_id: activityPurpose.id,
                        category_name: category.categoryName,
                        retention_period: category.retentionPeriod
                      });
                  }
                }
              }
            }
          }

          // Create data sources
          if (convertedTemplate.data_sources && convertedTemplate.data_sources.length > 0) {
            for (const source of convertedTemplate.data_sources) {
              await supabase
                .from('data_sources')
                .insert({
                  activity_id: activity.id,
                  source_name: source
                });
            }
          }

          // Create data recipients
          if (convertedTemplate.data_recipients && convertedTemplate.data_recipients.length > 0) {
            for (const recipient of convertedTemplate.data_recipients) {
              await supabase
                .from('data_recipients')
                .insert({
                  activity_id: activity.id,
                  recipient_name: recipient
                });
            }
          }
        }
      }

      // 6. Update DPDPA widget with created activity IDs
      if (dpdpaWidget && createdActivityIds.length > 0) {
        await supabase
          .from('dpdpa_widget_configs')
          .update({
            selected_activities: createdActivityIds
          })
          .eq('id', dpdpaWidget.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        cookieWidgetId,
        dpdpaWidgetId,
        activitiesCreated: createdActivityIds.length,
        industry: templateIndustry
      }
    });

  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
