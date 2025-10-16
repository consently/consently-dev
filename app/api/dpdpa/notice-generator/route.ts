import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Generates consent notice templates based on selected activities
 * This creates ready-to-use privacy notices and consent text
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityIds, format = 'html' } = await request.json();

    if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
      return NextResponse.json({ error: 'Activity IDs are required' }, { status: 400 });
    }

    // Fetch the selected activities
    const { data: activities, error } = await supabase
      .from('processing_activities')
      .select('*')
      .in('id', activityIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Generate consent notice
    const noticeData = generateConsentNotice(activities, format);

    return NextResponse.json({
      success: true,
      notice: noticeData,
      activities: activities.map(a => ({
        id: a.id,
        name: a.activity_name,
        purpose: a.purpose,
      })),
    });

  } catch (error) {
    console.error('Error generating notice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateConsentNotice(activities: any[], format: string) {
  const companyName = '[Your Company Name]';
  const websiteUrl = '[your-website.com]';
  
  if (format === 'html') {
    return {
      title: 'Privacy Notice - Data Processing Activities',
      html: generateHTMLNotice(activities, companyName, websiteUrl),
      plainText: generatePlainTextNotice(activities, companyName, websiteUrl),
    };
  }

  return {
    title: 'Privacy Notice - Data Processing Activities',
    plainText: generatePlainTextNotice(activities, companyName, websiteUrl),
  };
}

function generateHTMLNotice(activities: any[], companyName: string, websiteUrl: string) {
  const activitySections = activities.map((activity, index) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${activity.activity_name}
      </h3>
      
      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Purpose:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.purpose}</p>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Categories:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.data_attributes.join(', ')}</p>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Sources:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.data_processors?.sources?.join(', ') || 'Not specified'}</p>
      </div>

      <div>
        <strong style="color: #374151;">Retention Period:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.retention_period}</p>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Notice - Data Processing Activities</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 32px 16px;">
  
  <h1 style="color: #111827; font-size: 32px; margin-bottom: 16px;">Privacy Notice</h1>
  
  <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
    <p style="margin: 0; color: #1e40af; font-weight: 500;">
      This notice explains how ${companyName} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
    </p>
  </div>

  <h2 style="color: #1f2937; font-size: 24px; margin-top: 32px; margin-bottom: 16px;">Data Processing Activities</h2>
  
  <p style="color: #6b7280; margin-bottom: 24px;">
    We process your personal data for the following purposes. You have the right to provide or withdraw consent for each activity.
  </p>

  ${activitySections}

  <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
    <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">Your Rights Under DPDPA 2023</h2>
    
    <ul style="color: #6b7280; line-height: 1.8;">
      <li><strong>Right to Access:</strong> You can request information about what personal data we hold about you.</li>
      <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.</li>
      <li><strong>Right to Erasure:</strong> You can request deletion of your personal data in certain circumstances.</li>
      <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
      <li><strong>Right to Grievance Redressal:</strong> You can raise concerns or complaints about data processing.</li>
    </ul>

    <p style="color: #6b7280; margin-top: 24px;">
      <strong>How to Exercise Your Rights:</strong><br>
      You can manage your consent preferences or raise a grievance through our consent widget on ${websiteUrl}, 
      or contact us at [contact-email@${websiteUrl}].
    </p>

    <p style="color: #6b7280; margin-top: 16px;">
      <strong>Response Time:</strong> We will respond to your requests within 72 hours as required by DPDPA 2023.
    </p>
  </div>

  <div style="margin-top: 32px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Contact:</strong> [contact-email@${websiteUrl}]<br>
      <strong>Compliance:</strong> This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
    </p>
  </div>

</body>
</html>
  `.trim();
}

function generatePlainTextNotice(activities: any[], companyName: string, websiteUrl: string) {
  const activitySections = activities.map((activity, index) => `
${index + 1}. ${activity.activity_name}

Purpose: ${activity.purpose}

Data Categories: ${activity.data_attributes.join(', ')}

Data Sources: ${activity.data_processors?.sources?.join(', ') || 'Not specified'}

Retention Period: ${activity.retention_period}

---
  `).join('\n');

  return `
PRIVACY NOTICE - DATA PROCESSING ACTIVITIES
=============================================

This notice explains how ${companyName} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).

DATA PROCESSING ACTIVITIES
---------------------------

We process your personal data for the following purposes. You have the right to provide or withdraw consent for each activity.

${activitySections}

YOUR RIGHTS UNDER DPDPA 2023
------------------------------

- Right to Access: You can request information about what personal data we hold about you.
- Right to Correction: You can request correction of inaccurate or incomplete data.
- Right to Erasure: You can request deletion of your personal data in certain circumstances.
- Right to Withdraw Consent: You can withdraw your consent at any time.
- Right to Grievance Redressal: You can raise concerns or complaints about data processing.

HOW TO EXERCISE YOUR RIGHTS

You can manage your consent preferences or raise a grievance through our consent widget on ${websiteUrl}, 
or contact us at [contact-email@${websiteUrl}].

Response Time: We will respond to your requests within 72 hours as required by DPDPA 2023.

---
Last Updated: ${new Date().toLocaleDateString()}
Contact: [contact-email@${websiteUrl}]
Compliance: This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
  `.trim();
}
