import { Resend } from 'resend';
import crypto from 'crypto';

/**
 * Resend Email Service
 * Handles all email sending through Resend API
 */

// Lazy initialization of Resend client to ensure env vars are available
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  // Check at runtime (not module load time) to ensure env vars are available
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured. Email sending will fail.');
    console.error('   Please check:');
    console.error('   1. .env.local file has RESEND_API_KEY set');
    console.error('   2. Vercel environment variables are configured');
    console.error('   3. The variable name is exactly RESEND_API_KEY (case-sensitive)');
    return null;
  }

  // Validate API key format
  if (!resendApiKey.startsWith('re_')) {
    console.error('❌ RESEND_API_KEY format is invalid. Should start with "re_"');
    console.error(`   Current value starts with: ${resendApiKey.substring(0, 3)}`);
    return null;
  }

  // Initialize client if not already initialized
  if (!resendClient) {
    try {
      resendClient = new Resend(resendApiKey);
      console.log('✅ Resend client initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize Resend client:', error?.message || error);
      return null;
    }
  }

  return resendClient;
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Consently <onboarding@resend.dev>';
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const resend = getResendClient();

    if (!resend) {
      const apiKey = process.env.RESEND_API_KEY;
      const errorMsg = apiKey
        ? 'Resend client initialization failed. Check RESEND_API_KEY format.'
        : 'RESEND_API_KEY environment variable is not set.';

      console.error('❌ Email send failed:', errorMsg);
      return {
        success: false,
        error: 'Email service not configured. Please check RESEND_API_KEY environment variable.'
      };
    }

    const { to, subject, html, text, replyTo } = options;
    const fromEmail = getFromEmail();

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: ${subject}`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      ...(replyTo && { reply_to: replyTo }),
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend API'
      };
    }

    if (!data?.id) {
      console.error('❌ Resend API returned no email ID');
      return {
        success: false,
        error: 'Email send completed but no email ID returned'
      };
    }

    console.log('✅ Email sent successfully via Resend:', data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('❌ Exception while sending email:', error);
    console.error('   Error type:', error?.constructor?.name);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);

    return {
      success: false,
      error: error?.message || 'Unknown error occurred while sending email'
    };
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  expiresInMinutes: number = 10
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Verify Your Email - Consently Privacy Centre';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔐 Verify Your Email
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Hello,
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                You requested to link your privacy preferences across devices. To verify your email address, please use the following One-Time Password (OTP):
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f0f9ff; border: 3px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Your OTP Code
                </p>
                <p style="margin: 0; font-size: 48px; font-weight: 700; color: #1e3a8a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>⏰ This code will expire in ${expiresInMinutes} minutes.</strong>
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you didn't request this verification, you can safely ignore this email. Your privacy preferences remain secure.
              </p>
              
              <!-- Security Notice -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                  <strong>🔒 Security Tip:</strong> Never share this code with anyone. Consently will never ask for your OTP.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                This email was sent by <strong>Consently</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Protecting your privacy under the Digital Personal Data Protection Act, 2023
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer links -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Consently. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Verify Your Email - Consently Privacy Centre

You requested to link your privacy preferences across devices.

Your OTP Code: ${otp}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request this verification, you can safely ignore this email.

Security Tip: Never share this code with anyone. Consently will never ask for your OTP.

---
© ${new Date().getFullYear()} Consently
Protected under the Digital Personal Data Protection Act, 2023
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send preferences linked confirmation email
 */
export async function sendPreferencesLinkedEmail(
  email: string,
  deviceCount: number
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Your Preferences Are Now Linked - Consently';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preferences Linked</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Preferences Successfully Linked!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Great news!
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Your privacy preferences have been successfully linked to your email address. Your consent choices will now be synchronized across all your devices.
              </p>
              
              <!-- Info Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: 600;">
                  📱 Linked Devices
                </p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e3a8a;">
                  ${deviceCount} ${deviceCount === 1 ? 'device' : 'devices'}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>What this means for you:</strong>
              </p>
              
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 10px; line-height: 1.6;">Your preferences are automatically synced across devices</li>
                <li style="margin-bottom: 10px; line-height: 1.6;">Changes on one device apply to all linked devices</li>
                <li style="margin-bottom: 10px; line-height: 1.6;">You only need to update your choices once</li>
              </ul>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                You can update your preferences anytime by visiting the Privacy Centre.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                Questions? We're here to help.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Protected under the Digital Personal Data Protection Act, 2023
              </p>
            </td>
          </tr>
        </table>
        
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Consently. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Preferences Successfully Linked - Consently

Your privacy preferences have been successfully linked to your email address.

Linked Devices: ${deviceCount}

What this means for you:
- Your preferences are automatically synced across devices
- Changes on one device apply to all linked devices
- You only need to update your choices once

You can update your preferences anytime by visiting the Privacy Centre.

---
© ${new Date().getFullYear()} Consently
Protected under the Digital Personal Data Protection Act, 2023
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash email for privacy (SHA-256)
 * Uses Node.js crypto for server-side compatibility
 */
export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Diagnostic function to check Resend configuration
 * Useful for debugging email sending issues
 */
export function checkResendConfig(): {
  apiKeyConfigured: boolean;
  apiKeyFormatValid: boolean;
  fromEmailConfigured: boolean;
  clientInitialized: boolean;
  fromEmail: string;
  apiKeyPrefix?: string;
} {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = getFromEmail();
  const apiKeyConfigured = !!apiKey;
  const apiKeyFormatValid = apiKey ? apiKey.startsWith('re_') : false;
  const fromEmailConfigured = !!process.env.RESEND_FROM_EMAIL;
  const clientInitialized = !!getResendClient();

  return {
    apiKeyConfigured,
    apiKeyFormatValid,
    fromEmailConfigured,
    clientInitialized,
    fromEmail,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : undefined,
  };
}


/**
 * Send Admin Action OTP email
 */
export async function sendAdminOTPEmail(
  email: string,
  otp: string,
  action: string = 'export data',
  expiresInMinutes: number = 10
): Promise<{ success: boolean; error?: string }> {
  const subject = `Verify your identity to ${action} - Consently`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Identity</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🛡️ Security Verification
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Hello,
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                We received a request to <strong>${action}</strong> from your account. To proceed, please verify your identity using the One-Time Password (OTP) below:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                  Your Verification Code
                </p>
                <p style="margin: 0; font-size: 42px; font-weight: 700; color: #111827; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>⏰ This code will expire in ${expiresInMinutes} minutes.</strong>
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you did not initiate this request, please ignore this email and consider changing your password if you suspect unauthorized access.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                This email was sent by <strong>Consently</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Verify Identity - Consently

We received a request to ${action} from your account.

Your Verification Code: ${otp}

This code will expire in ${expiresInMinutes} minutes.

If you did not initiate this request, please ignore this email.
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}
