# Email Service Setup Guide

This guide explains how to set up the email service for Consently using Resend.

## Why Resend?

- ✅ **Free Tier**: 100 emails/day for free
- ✅ **Developer-Friendly**: Simple REST API
- ✅ **No Credit Card Required**: For the free tier
- ✅ **High Deliverability**: Industry-leading email delivery
- ✅ **Easy Setup**: Just one API key needed

## Setup Instructions

### Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" (free, no credit card required)
3. Verify your email address

### Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Consently Production")
5. Select the appropriate permissions:
   - ✅ Sending access (required)
   - ✅ Domain access (optional, for custom domains)
6. Copy the API key (it will only be shown once!)

### Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Email addresses
RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
CONTACT_EMAIL="hello@consently.in"
```

**Important Notes:**
- `RESEND_API_KEY`: Your Resend API key (starts with `re_`)
- `RESEND_FROM_EMAIL`: The email address to send from (must be verified in Resend)
- `CONTACT_EMAIL`: Where contact form submissions should be sent

### Step 4: Verify Your Domain (Optional but Recommended)

For better deliverability and to use your own domain:

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `consently.in`)
4. Add the provided DNS records to your domain:
   - **SPF Record**: Verifies your domain can send emails
   - **DKIM Record**: Adds email authentication
   - **DMARC Record**: Sets email policy
5. Wait for DNS propagation (usually 5-10 minutes)
6. Click "Verify Domain" in Resend

### Step 5: Test the Email Service

#### Using the Free Tier (Testing)

If you don't want to verify a domain immediately, Resend provides a test domain:

```bash
RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"
```

This works immediately but emails will have "via resend.dev" in the sender.

#### Testing the Contact Form

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/contact`

3. Fill out and submit the form

4. Check your email inbox (CONTACT_EMAIL)

5. Verify:
   - Email received successfully
   - Formatting looks good
   - Reply-to address is correct

## Usage in Code

The contact form automatically uses the Resend API:

```typescript
// app/api/contact/route.ts
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: process.env.RESEND_FROM_EMAIL,
    to: process.env.CONTACT_EMAIL,
    subject: 'Contact Form Submission',
    html: '...',
  }),
});
```

## Fallback Behavior

If `RESEND_API_KEY` is not configured:
- Contact form submissions are logged to console
- Success message is still shown to user
- Development continues without errors

This allows development without immediate email service setup.

## Free Tier Limits

Resend Free Tier includes:
- ✅ 100 emails per day
- ✅ 1 custom domain
- ✅ Full API access
- ✅ Email analytics
- ✅ Webhook support

This is perfect for:
- Contact forms
- User notifications
- Account verification emails
- Password resets

## Upgrading Plans

If you need more emails:
- **Pro Plan**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing for high volume

View pricing at: [resend.com/pricing](https://resend.com/pricing)

## Alternative Email Services

If you prefer a different service, you can modify the API endpoint:

### SendGrid
```typescript
// Install: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### AWS SES
```typescript
// Install: npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
```

### Postmark
```typescript
// Install: npm install postmark
import postmark from 'postmark';
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);
```

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check From Email**: Must be verified domain or use `onboarding@resend.dev`
3. **Check Console**: Look for error messages in terminal
4. **Test API Key**: Use Resend dashboard to test sends

### Email Goes to Spam

1. **Verify Domain**: Add SPF, DKIM, DMARC records
2. **Warm Up Domain**: Start with low volume, gradually increase
3. **Check Content**: Avoid spam trigger words
4. **Set Up DMARC**: Use Resend's recommended DMARC policy

### Rate Limits

Free tier: 100 emails/day
- Monitor usage in Resend dashboard
- Implement rate limiting on contact form if needed
- Upgrade plan if consistently hitting limits

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** on contact form endpoint
4. **Validate input** before sending emails
5. **Sanitize user content** to prevent injection attacks

## Support

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Resend Discord**: [resend.com/discord](https://resend.com/discord)
- **Consently Support**: hello@consently.in

## Summary

✅ Sign up for Resend (free)  
✅ Get API key  
✅ Add to `.env.local`  
✅ Test contact form  
✅ Verify domain (optional)  
✅ Monitor usage

Your contact form is now fully functional with professional email delivery! 🎉

