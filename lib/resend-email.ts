import { Resend } from 'resend';
import crypto from 'crypto';
import { logger } from './logger';

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
    logger.error('RESEND_API_KEY not configured. Email sending will fail.', undefined, {
      check1: '.env.local file has RESEND_API_KEY set',
      check2: 'Vercel environment variables are configured',
      check3: 'The variable name is exactly RESEND_API_KEY (case-sensitive)'
    });
    return null;
  }

  // Validate API key format
  if (!resendApiKey.startsWith('re_')) {
    logger.error('RESEND_API_KEY format is invalid. Should start with "re_"', undefined, {
      currentPrefix: resendApiKey.substring(0, 3)
    });
    return null;
  }

  // Initialize client if not already initialized
  if (!resendClient) {
    try {
      resendClient = new Resend(resendApiKey);
      logger.info('Resend client initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Resend client', error);
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

      logger.error('Email send failed', undefined, { reason: errorMsg });
      return {
        success: false,
        error: 'Email service not configured. Please check RESEND_API_KEY environment variable.'
      };
    }

    const { to, subject, html, text, replyTo } = options;
    const fromEmail = getFromEmail();

    logger.debug('Attempting to send email', { to, from: fromEmail, subject });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      ...(replyTo && { reply_to: replyTo }),
    });

    if (error) {
      logger.error('Resend API error', error, { errorDetails: error });
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend API'
      };
    }

    if (!data?.id) {
      logger.error('Resend API returned no email ID');
      return {
        success: false,
        error: 'Email send completed but no email ID returned'
      };
    }

    logger.info('Email sent successfully via Resend', { emailId: data.id });
    return { success: true, id: data.id };
  } catch (error: any) {
    logger.error('Exception while sending email', error, {
      errorType: error?.constructor?.name,
      errorMessage: error?.message
    });

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
  const subject = `${otp} is your Consently verification code`;

  // Split OTP into individual digits for better mobile display
  const otpDigits = otp.split('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>Your Verification Code: ${otp}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .otp-digit { width: 40px !important; }
  </style>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .content-padding { padding: 24px 20px !important; }
      .header-padding { padding: 28px 20px !important; }
      .otp-container { padding: 20px 12px !important; }
      .otp-digit { width: 36px !important; height: 48px !important; font-size: 24px !important; margin: 0 3px !important; }
      .otp-label { font-size: 12px !important; }
      .main-text { font-size: 15px !important; }
      .footer-text { font-size: 11px !important; }
    }
    @media only screen and (max-width: 380px) {
      .otp-digit { width: 32px !important; height: 44px !important; font-size: 20px !important; margin: 0 2px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f4f8; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table class="email-container" width="520" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden; max-width: 520px;">
          
          <!-- Header -->
          <tr>
            <td class="header-padding" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 36px 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: inline-block; line-height: 56px;">
                      <span style="font-size: 28px;">🔐</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                      Verification Code
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                      Enter this code to verify your email
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- OTP Display -->
          <tr>
            <td class="otp-container" style="padding: 32px 24px; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
              <p class="otp-label" style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                Your Code
              </p>
              <!-- OTP Digits as separate boxes for better mobile display -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  ${otpDigits.map(digit => `
                    <td>
                      <div class="otp-digit" style="width: 44px; height: 56px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; margin: 0 4px; display: inline-block; line-height: 56px; text-align: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                        <span style="color: #ffffff; font-size: 28px; font-weight: 800; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;">${digit}</span>
                      </div>
                    </td>
                  `).join('')}
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 13px; color: #94a3b8;">
                ⏱️ Expires in <strong style="color: #475569;">${expiresInMinutes} minutes</strong>
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 28px 32px;">
              <p class="main-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #475569;">
                You're linking your privacy preferences to <strong style="color: #1e293b;">${email}</strong>. This allows you to manage your consent choices across all your devices.
              </p>
              
              <!-- Security Notice -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 16px; margin-top: 20px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="32" valign="top">
                      <span style="font-size: 18px;">🔒</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                        <strong>Security Tip:</strong> Never share this code. Consently will never ask for your OTP via phone or chat.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                Didn't request this? You can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p class="footer-text" style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                Sent by <strong style="color: #3b82f6;">Consently</strong>
              </p>
              <p class="footer-text" style="margin: 0; font-size: 11px; color: #94a3b8;">
                Protecting your privacy under DPDPA 2023
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Copyright -->
        <table width="520" cellpadding="0" cellspacing="0" style="margin-top: 16px; max-width: 520px;">
          <tr>
            <td style="text-align: center; padding: 8px;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} Consently • <a href="https://consently.in" style="color: #64748b; text-decoration: none;">consently.in</a>
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
Your Consently Verification Code: ${otp}

You're linking your privacy preferences to ${email}.

YOUR CODE: ${otp}

This code expires in ${expiresInMinutes} minutes.

Security Tip: Never share this code. Consently will never ask for your OTP via phone or chat.

Didn't request this? You can safely ignore this email.

---
© ${new Date().getFullYear()} Consently | consently.in
Protected under DPDPA 2023
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
 * Send Guardian Consent Request email
 * Sent to a parent/guardian when a minor requires parental consent under DPDPA 2023
 */
export async function sendGuardianConsentEmail(
  guardianEmail: string,
  options: {
    verificationLink: string;
    minorAge: number;
    domain: string;
    relationship: string;
    expiresAt: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { verificationLink, minorAge, domain, relationship, expiresAt } = options;
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = 'Guardian Consent Required - Consently';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>Guardian Consent Required</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .content-padding { padding: 24px 20px !important; }
      .header-padding { padding: 28px 20px !important; }
      .cta-button { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f4f8; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table class="email-container" width="520" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden; max-width: 520px;">

          <!-- Header -->
          <tr>
            <td class="header-padding" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 36px 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: inline-block; line-height: 56px;">
                      <span style="font-size: 28px;">&#x1F6E1;&#xFE0F;</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                      Guardian Consent Required
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Under the Digital Personal Data Protection Act, 2023
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 32px;">
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #475569;">
                A minor (age <strong style="color: #1e293b;">${minorAge}</strong>) has requested consent for data processing on
                <strong style="color: #1e293b;">${domain}</strong>. As their <strong style="color: #1e293b;">${relationship}</strong>,
                your verification and approval is required under the DPDPA 2023.
              </p>

              <!-- Info Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #1e40af; font-weight: 600;">
                  What you need to do:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #1e3a8a;">
                  <li>Click the button below to open the verification page</li>
                  <li>Verify your identity using DigiLocker (government-backed)</li>
                  <li>Review and approve or reject the consent request</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                      Review &amp; Verify
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 16px; margin-top: 20px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="32" valign="top">
                      <span style="font-size: 18px;">&#x1F512;</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                        <strong>Privacy &amp; Security:</strong> Only your age will be verified via DigiLocker.
                        Your date of birth and other personal details will not be stored.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                This link expires on <strong style="color: #64748b;">${expiryDate}</strong>.
                If you did not expect this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                Sent by <strong style="color: #3b82f6;">Consently</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Protecting your privacy under DPDPA 2023
              </p>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <table width="520" cellpadding="0" cellspacing="0" style="margin-top: 16px; max-width: 520px;">
          <tr>
            <td style="text-align: center; padding: 8px;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Consently &bull; <a href="https://consently.in" style="color: #64748b; text-decoration: none;">consently.in</a>
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
Guardian Consent Required - Consently

A minor (age ${minorAge}) has requested consent for data processing on ${domain}. As their ${relationship}, your verification and approval is required under the DPDPA 2023.

What you need to do:
1. Click the link below to open the verification page
2. Verify your identity using DigiLocker (government-backed)
3. Review and approve or reject the consent request

Verify here: ${verificationLink}

Privacy & Security: Only your age will be verified via DigiLocker. Your date of birth and other personal details will not be stored.

This link expires on ${expiryDate}. If you did not expect this request, you can safely ignore this email.

---
(c) ${new Date().getFullYear()} Consently | consently.in
Protected under DPDPA 2023
  `.trim();

  return sendEmail({
    to: guardianEmail,
    subject,
    html,
    text,
  });
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
