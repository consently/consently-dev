import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/resend-email';

/**
 * Careers Application Form API
 * Handles career application submissions and sends emails using Resend
 */

// Validation schema
const careersSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  coverLetter: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = careersSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, email, phone, position, coverLetter } = validation.data;

    // Prepare email content
    const subject = `Career Application: ${position} - ${name}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career Application</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">💼 New Career Application</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        Applicant Information
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #6b7280; width: 120px;">Name:</td>
          <td style="padding: 10px 0; color: #1f2937;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Email:</td>
          <td style="padding: 10px 0;">
            <a href="mailto:${escapeHtml(email)}" style="color: #3b82f6; text-decoration: none;">
              ${escapeHtml(email)}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Phone:</td>
          <td style="padding: 10px 0; color: #1f2937;">${escapeHtml(phone)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Position:</td>
          <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${escapeHtml(position)}</td>
        </tr>
      </table>
    </div>
    
    ${coverLetter ? `
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        Cover Letter
      </h2>
      <div style="color: #1f2937; white-space: pre-wrap; line-height: 1.8;">
${escapeHtml(coverLetter)}
      </div>
    </div>
    ` : ''}
    
    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>📎 Note:</strong> This application was submitted through the Consently careers page. 
        Please check if the applicant has attached their resume separately or follow up to request it.
      </p>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>💡 Quick Actions:</strong> Reply directly to this email to contact ${escapeHtml(name)}
      </p>
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p style="margin: 5px 0;">Sent from Consently Careers Page</p>
    <p style="margin: 5px 0;">Received at ${new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    })}</p>
  </div>
</body>
</html>
    `.trim();

    const text = `
New Career Application

Applicant Information:
-------------------
Name: ${name}
Email: ${email}
Phone: ${phone}
Position: ${position}
${coverLetter ? `\nCover Letter:\n${coverLetter}` : ''}

---
Note: This application was submitted through the Consently careers page.
Please check if the applicant has attached their resume separately or follow up to request it.

Reply directly to this email to contact ${name}
Received at ${new Date().toISOString()}
    `.trim();

    // Send email using Resend
    const emailResult = await sendEmail({
      to: 'hello@consently.in',
      subject,
      html,
      text,
    });

    if (!emailResult.success) {
      console.error('Failed to send careers application email:', emailResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to submit application. Please try again or email us directly at hello@consently.in',
          details: emailResult.error
        },
        { status: 500 }
      );
    }

    console.log('✅ Careers application email sent successfully:', emailResult.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your application! We\'ll review it and get back to you soon.',
      emailId: emailResult.id 
    });

  } catch (error) {
    console.error('Error in careers application API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit application. Please try again or email us directly at hello@consently.in',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

