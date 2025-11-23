/**
 * Helper function to escape HTML to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
    if (typeof text !== 'string') {
        return '';
    }

    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Helper function to generate privacy notice HTML
 */
export function generatePrivacyNoticeHTML(activities: any[], domain: string): string {
    const companyName = domain || '[Your Company Name]';

    const activitySections = activities.map((activity, index) => {
        // Use new purposes structure (ONLY structure now - no legacy fallback)
        let purposesList = '';
        let allDataCategories: string[] = [];
        let retentionText = 'N/A';

        if (activity.purposes && activity.purposes.length > 0) {
            // Show all purposes
            purposesList = activity.purposes.map((p: any) => {
                const dataCategories = p.dataCategories?.map((cat: any) => cat.categoryName) || [];
                allDataCategories.push(...dataCategories);

                const retentionPeriods = p.dataCategories?.map((cat: any) =>
                    `${cat.categoryName}: ${cat.retentionPeriod}`
                ) || [];

                if (retentionPeriods.length > 0) {
                    retentionText = retentionPeriods.join(', ');
                }

                return `<li>${escapeHtml(p.purposeName)} (${escapeHtml(p.legalBasis.replace('-', ' '))})</li>`;
            }).join('');
        } else {
            purposesList = '<li>No purposes defined</li>';
        }

        const dataCategoriesText = allDataCategories.length > 0
            ? allDataCategories.map((c: string) => escapeHtml(c)).join(', ')
            : 'N/A';

        return `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${escapeHtml(activity.activity_name)}
      </h3>
      
      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Purposes:</strong>
        <ul style="margin: 4px 0 0 0; color: #6b7280; padding-left: 20px;">
          ${purposesList}
        </ul>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Categories:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${dataCategoriesText}</p>
      </div>

      <div>
        <strong style="color: #374151;">Retention Period:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(retentionText)}</p>
      </div>
    </div>
  `;
    }).join('');

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
      This notice explains how ${escapeHtml(companyName)} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
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
      You can manage your consent preferences or raise a grievance through our consent widget on ${escapeHtml(domain)}, 
      or contact us at [contact-email@${escapeHtml(domain)}].
    </p>

    <p style="color: #6b7280; margin-top: 16px;">
      <strong>Response Time:</strong> We will respond to your requests within 72 hours as required by DPDPA 2023.
    </p>
  </div>

  <div style="margin-top: 32px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Contact:</strong> [contact-email@${escapeHtml(domain)}]<br>
      <strong>Compliance:</strong> This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Sanitize HTML content (basic sanitization for privacy notice)
 * In production, consider using a library like DOMPurify for more robust sanitization
 */
export function sanitizeHTML(html: string): string {
    if (typeof html !== 'string') {
        return '';
    }

    // Basic sanitization: remove script tags and event handlers
    // For production, consider using DOMPurify or similar library
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}
