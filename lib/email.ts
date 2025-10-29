import { createClient } from '@/lib/supabase/server';

type EmailVariables = Record<string, string | number>;

/**
 * Send a transactional email using a template
 */
export async function sendEmail(
  templateName: string,
  recipientEmail: string,
  variables: EmailVariables,
  userId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Fetch email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Email template not found:', templateName);
      return false;
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, String(value));
      body = body.replace(placeholder, String(value));
    });

    // In a production environment, you would integrate with an email service
    // like SendGrid, AWS SES, Postmark, or similar
    // For now, we'll log the email and save it to the database

    console.log('Sending email:');
    console.log('To:', recipientEmail);
    console.log('Subject:', subject);
    console.log('Body:', body);

    // Log the email attempt
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId || null,
        template_name: templateName,
        recipient_email: recipientEmail,
        subject: subject,
        status: 'sent', // Would be 'pending' in production until confirmed
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log email:', logError);
    }

    // TODO: Integrate with actual email service provider
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: recipientEmail,
    //   from: 'noreply@consently.in',
    //   subject: subject,
    //   html: body,
    // });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  userId: string
): Promise<boolean> {
  return sendEmail(
    'welcome',
    email,
    {
      name: name || 'User',
      dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    },
    userId
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  return sendEmail(
    'password_reset',
    email,
    {
      reset_url: resetUrl
    }
  );
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  userId: string,
  subscriptionDetails: {
    plan: string;
    amount: number;
    billingCycle: string;
    startDate: string;
    endDate: string;
  }
): Promise<boolean> {
  return sendEmail(
    'subscription_confirmation',
    email,
    {
      plan: subscriptionDetails.plan,
      amount: subscriptionDetails.amount,
      billing_cycle: subscriptionDetails.billingCycle,
      start_date: new Date(subscriptionDetails.startDate).toLocaleDateString(),
      end_date: new Date(subscriptionDetails.endDate).toLocaleDateString(),
      dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`
    },
    userId
  );
}

/**
 * Send consent receipt email to visitors
 */
export async function sendConsentReceiptEmail(
  email: string,
  consentDetails: {
    website: string;
    status: string;
    categories: string[];
    consentId: string;
  }
): Promise<boolean> {
  return sendEmail(
    'consent_receipt',
    email,
    {
      website: consentDetails.website,
      status: consentDetails.status,
      categories: consentDetails.categories.join(', '),
      date: new Date().toLocaleDateString(),
      consent_id: consentDetails.consentId
    }
  );
}
