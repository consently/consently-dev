# Quick Setup Guide: Email Verification with OTP

This guide will help you set up email verification for cross-device preference linking in under 10 minutes.

## Prerequisites

- Consently application running locally or deployed
- Access to Supabase database
- Node.js and npm installed

## Step 1: Install Resend Package ✅

Already completed! Resend package is installed.

```bash
npm install resend
```

## Step 2: Sign Up for Resend (5 minutes)

1. Go to [resend.com](https://resend.com/signup)
2. Create a free account
3. Navigate to **API Keys** in the dashboard
4. Click **Create API Key**
5. Copy your API key (starts with `re_`)

**Free Tier Includes:**
- 100 emails/day
- 3,000 emails/month
- Perfect for testing and small projects

## Step 3: Configure Environment Variables (2 minutes)

Add these to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
```

**For Testing (No Domain Verification Required):**
```bash
RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"
```

**For Production (Domain Verification Required):**
```bash
RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
```

## Step 4: Run Database Migration (2 minutes)

### Option A: Using Supabase CLI
```bash
cd /Users/krissdev/consently-dev
supabase db push
```

### Option B: Using Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy contents from: `supabase/migrations/20250119000001_create_email_verification_otp.sql`
5. Run the query

### Verify Migration
```sql
-- Check if table exists
SELECT * FROM email_verification_otps LIMIT 1;
```

Should return empty result (no errors).

## Step 5: Restart Your Application

```bash
# Stop your dev server (Ctrl+C)
# Start again
npm run dev
```

## Step 6: Test the Feature (1 minute)

1. Open your browser to Privacy Centre:
   ```
   http://localhost:3000/privacy-centre/[YOUR_WIDGET_ID]?visitorId=[ANY_VISITOR_ID]
   ```

2. You should see a new card: **"Link Your Preferences"**

3. Enter your email address and click **"Send Verification Code"**

4. Check your email inbox for the OTP

5. Enter the 6-digit code and click **"Verify & Link"**

6. Success! You should see: "Email verified! Your preferences are now linked across X device(s)"

## Verification Checklist

- [ ] Resend API key obtained
- [ ] Environment variables added
- [ ] Database migration completed
- [ ] Application restarted
- [ ] Email received successfully
- [ ] OTP verified successfully

## Common Setup Issues

### Issue: "Email service not configured"

**Solution**: Check your environment variables
```bash
echo $RESEND_API_KEY
echo $RESEND_FROM_EMAIL
```

Make sure they're set in `.env.local` and restart your server.

### Issue: "Widget not found"

**Solution**: Use a valid widget ID from your database
```sql
SELECT widget_id FROM dpdpa_widget_configs LIMIT 5;
```

### Issue: Email not received

**Solution**: 
1. Check spam folder
2. Verify Resend API key is correct
3. Check Resend dashboard for delivery status
4. For production: Verify your domain in Resend

### Issue: Migration fails

**Solution**:
1. Check if table already exists:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'email_verification_otps';
   ```
2. If exists, drop and recreate:
   ```sql
   DROP TABLE IF EXISTS email_verification_otps CASCADE;
   -- Then run migration again
   ```

## Domain Verification (For Production)

### Why Verify Your Domain?

- Better email deliverability
- Professional sender address
- Remove "via resend.dev" notice
- Higher sending limits

### How to Verify

1. **Add DNS Records**
   
   In Resend Dashboard → Domains → Add Domain
   
   Add these DNS records to your domain:
   
   ```
   TXT  @  v=spf1 include:_spf.resend.com ~all
   CNAME resend._domainkey  resend._domainkey.resend.com
   ```

2. **Wait for Verification** (usually 5-10 minutes)

3. **Test**
   ```bash
   nslookup -type=TXT yourdomain.com
   ```

4. **Update Environment Variable**
   ```bash
   RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
   ```

## Security Best Practices

1. **Never commit** `.env.local` to git
2. **Rotate API keys** regularly (every 90 days)
3. **Use different keys** for development and production
4. **Monitor usage** in Resend dashboard
5. **Set up alerts** for quota limits

## Testing in Development

### Test Email Sending

Create a test script `scripts/test-email.ts`:

```typescript
import { sendOTPEmail } from '../lib/resend-email';

async function test() {
  const result = await sendOTPEmail('your@email.com', '123456', 10);
  console.log('Result:', result);
}

test();
```

Run:
```bash
npx tsx scripts/test-email.ts
```

### Test API Endpoints

Using curl:

```bash
# Send OTP
curl -X POST http://localhost:3000/api/privacy-centre/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "visitorId": "test-123",
    "widgetId": "your-widget-id"
  }'

# Verify OTP
curl -X POST http://localhost:3000/api/privacy-centre/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456",
    "visitorId": "test-123",
    "widgetId": "your-widget-id"
  }'
```

## Production Deployment

### Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```bash
RESEND_API_KEY=re_prod_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
```

### Database

Run migration on production database:

```bash
# Using Supabase CLI with production project
supabase link --project-ref your-prod-ref
supabase db push
```

### Monitoring

1. **Resend Dashboard**: Monitor email delivery
2. **Database Logs**: Track OTP requests and verifications
3. **Application Logs**: Watch for errors

## Need Help?

- 📖 [Full Documentation](./EMAIL_VERIFICATION_OTP.md)
- 🔗 [Resend Documentation](https://resend.com/docs)
- 💬 Check application logs for detailed error messages
- 🐛 Report issues on GitHub

## Next Steps

- [ ] Test with multiple devices
- [ ] Monitor email delivery rates
- [ ] Set up domain verification for production
- [ ] Configure email templates (optional)
- [ ] Set up database cleanup cron job

---

**Setup Time**: ~10 minutes  
**Difficulty**: Easy  
**Last Updated**: November 19, 2025

