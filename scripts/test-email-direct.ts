#!/usr/bin/env node
/**
 * Direct Email Test for Contact and Careers
 * Tests email sending directly without requiring the server to be running
 */

// Load environment variables FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Dynamic import for resend-email to ensure env vars are loaded
let sendEmail: any;

async function loadResendModule() {
  const resendModule = await import('../lib/resend-email');
  sendEmail = resendModule.sendEmail;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

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

async function testContactEmail() {
  // Ensure resend module is loaded
  if (!sendEmail) {
    await loadResendModule();
  }
  
  log('\n=== Testing Contact Form Email ===', colors.cyan);
  
  const name = 'Test User';
  const email = 'test@example.com';
  const company = 'Test Company';
  const message = 'This is a test message from the contact form. Please ignore.';
  
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
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Company:</td>
          <td style="padding: 10px 0; color: #1f2937;">${escapeHtml(company)}</td>
        </tr>
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
    <p style="margin: 5px 0;">Sent from Consently Contact Form (TEST)</p>
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
New Contact Form Submission (TEST)

Name: ${name}
Email: ${email}
Company: ${company}

Message:
${message}

---
Reply directly to this email to respond to ${name}
Received at ${new Date().toISOString()}
  `.trim();

  const result = await sendEmail({
    to: 'hello@consently.in',
    subject: `[TEST] New Contact Form Submission from ${name}`,
    html,
    text,
  });

  if (result.success) {
    success('Contact form email sent successfully!');
    info(`Email ID: ${result.id}`);
    return true;
  } else {
    error(`Failed to send contact email: ${result.error}`);
    return false;
  }
}

async function testCareersEmail() {
  // Ensure resend module is loaded
  if (!sendEmail) {
    await loadResendModule();
  }
  
  log('\n=== Testing Careers Form Email ===', colors.cyan);
  
  const name = 'Test Applicant';
  const email = 'applicant@example.com';
  const phone = '+91 1234567890';
  const position = 'Software Engineer';
  const coverLetter = 'This is a test application. Please ignore.';
  
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
    
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        Cover Letter
      </h2>
      <div style="color: #1f2937; white-space: pre-wrap; line-height: 1.8;">
${escapeHtml(coverLetter)}
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>📎 Note:</strong> This application was submitted through the Consently careers page (TEST). 
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
    <p style="margin: 5px 0;">Sent from Consently Careers Page (TEST)</p>
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
New Career Application (TEST)

Applicant Information:
-------------------
Name: ${name}
Email: ${email}
Phone: ${phone}
Position: ${position}

Cover Letter:
${coverLetter}

---
Note: This application was submitted through the Consently careers page (TEST).
Please check if the applicant has attached their resume separately or follow up to request it.

Reply directly to this email to contact ${name}
Received at ${new Date().toISOString()}
  `.trim();

  const result = await sendEmail({
    to: 'hello@consently.in',
    subject: `[TEST] Career Application: ${position} - ${name}`,
    html,
    text,
  });

  if (result.success) {
    success('Careers application email sent successfully!');
    info(`Email ID: ${result.id}`);
    return true;
  } else {
    error(`Failed to send careers email: ${result.error}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════╗', colors.cyan);
  log('║  Direct Email Test (Contact & Careers)       ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  info('Testing email sending directly to hello@consently.in');
  info('These are TEST emails - they will be marked with [TEST] in the subject');
  console.log('');

  // Check environment variables
  if (!process.env.RESEND_API_KEY) {
    error('RESEND_API_KEY is not set!');
    info('Please add it to your .env.local file');
    process.exit(1);
  }

  success('RESEND_API_KEY is configured');
  console.log('');

  // Test contact email
  const contactOk = await testContactEmail();
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test careers email
  const careersOk = await testCareersEmail();

  // Summary
  console.log('');
  log('=== Summary ===', colors.cyan);
  
  if (contactOk && careersOk) {
    success('All tests passed! Both email templates are working correctly.');
    console.log('');
    info('Check hello@consently.in inbox for the test emails');
    info('Look for emails with [TEST] in the subject line');
  } else {
    if (!contactOk) {
      error('Contact form email test failed');
    }
    if (!careersOk) {
      error('Careers form email test failed');
    }
  }
  
  console.log('');
}

main().catch((err) => {
  error(`Unhandled error: ${err}`);
  process.exit(1);
});

