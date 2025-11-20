import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/resend-email';

/**
 * Contact Form API
 * Handles contact form submissions and sends emails using Resend
 */

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { name, email, company, message } = validation.data;

    // Prepare email content
    const subject = `New Contact Form Submission from ${name}`;

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form Submission</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">📧 New Contact Form Submission</h1>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Contact Information
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
          ${company ? `
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Company:</td>
            <td style="padding: 10px 0; color: #1f2937;">${escapeHtml(company)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Message
        </h2>
        <div style="color: #1f2937; white-space: pre-wrap; line-height: 1.8;">
${escapeHtml(message)}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;">
          <strong>💡 Quick Actions:</strong> Reply directly to this email to respond to ${escapeHtml(name)}
        </p>
      </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">Sent from Consently Contact Form</p>
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
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}

Message:
${message}

---
Reply directly to this email to respond to ${name}
Received at ${new Date().toISOString()}
    `.trim();

    // Send email using Resend helper
    const emailResult = await sendEmail({
      to: 'hello@consently.in',
      subject,
      html,
      text,
      replyTo: email,
    });

    if (!emailResult.success) {
      console.error('Failed to send contact form email:', emailResult.error);
      return NextResponse.json(
        {
          error: 'Failed to send message. Please try again or email us directly at hello@consently.in',
          details: emailResult.error
        },
        { status: 500 }
      );
    }

    console.log('✅ Contact form email sent successfully:', emailResult.id);

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      emailId: emailResult.id
    });

  } catch (error) {
    console.error('Error in contact form API:', error);
    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again or email us directly at hello@consently.in',
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

