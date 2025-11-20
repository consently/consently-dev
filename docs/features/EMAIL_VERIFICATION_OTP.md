# Email Verification with OTP for Cross-Device Preference Linking

## Overview

This feature allows visitors to link their privacy preferences across multiple devices by verifying their email address using a One-Time Password (OTP). Once verified, their consent choices automatically sync across all linked devices.

## Features

✅ **Secure Email Verification**: 6-digit OTP sent via email  
✅ **Cross-Device Sync**: Preferences automatically sync across devices  
✅ **Rate Limiting**: Max 3 OTP requests per hour per email  
✅ **Attempt Limiting**: Max 3 verification attempts per OTP  
✅ **Auto-Expiry**: OTP codes expire after 10 minutes  
✅ **Beautiful Email Templates**: Professional, branded verification emails  
✅ **Privacy-First**: Emails are hashed (SHA-256) for storage  
✅ **Responsive UI**: Mobile-friendly verification interface  

## Architecture

### Database Schema

```sql
email_verification_otps
├── id (UUID)
├── email (VARCHAR) - Plain email for sending
├── email_hash (VARCHAR) - SHA-256 hash for privacy
├── otp_code (VARCHAR) - 6-digit code
├── visitor_id (VARCHAR) - Visitor identifier
├── widget_id (UUID) - Widget reference
├── expires_at (TIMESTAMP) - 10 minutes from creation
├── verified (BOOLEAN)
├── verified_at (TIMESTAMP)
├── attempts (INTEGER) - Failed verification attempts
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### API Endpoints

#### 1. Send OTP
**POST** `/api/privacy-centre/send-otp`

Request:
```json
{
  "email": "user@example.com",
  "visitorId": "visitor-uuid",
  "widgetId": "widget-uuid"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2025-11-19T12:10:00Z",
  "expiresInSeconds": 600
}
```

Error Responses:
- `400`: Invalid input or email format
- `404`: Widget not found
- `429`: Rate limit exceeded (3 requests/hour)
- `500`: Failed to send email

#### 2. Verify OTP
**POST** `/api/privacy-centre/verify-otp`

Request:
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "visitorId": "visitor-uuid",
  "widgetId": "widget-uuid"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Email verified successfully",
  "linkedDevices": 2,
  "verified_at": "2025-11-19T12:05:00Z"
}
```

Response (Invalid OTP):
```json
{
  "error": "Invalid OTP code",
  "code": "INVALID_OTP",
  "remainingAttempts": 2,
  "maxAttemptsExceeded": false
}
```

Error Codes:
- `INVALID_OTP`: Wrong OTP code
- `OTP_NOT_FOUND`: OTP expired or doesn't exist
- `MAX_ATTEMPTS_EXCEEDED`: Used all 3 attempts

### Email Service

The system uses **Resend** for email delivery with two email templates:

1. **OTP Verification Email**
   - Beautiful gradient design
   - Large, easy-to-read OTP code
   - Security tips and warnings
   - Mobile-responsive

2. **Preferences Linked Confirmation**
   - Success notification
   - Shows number of linked devices
   - Explains what cross-device sync means

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
```

### 2. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use `onboarding@resend.dev` for testing
3. Generate an API key from the dashboard
4. Add to environment variables

### 3. Run Database Migration

Apply the migration to create the OTP table:

```bash
# Using Supabase CLI
supabase db push

# Or run the migration file directly in Supabase dashboard
# File: supabase/migrations/20250119000001_create_email_verification_otp.sql
```

### 4. Verify Installation

Test the feature:

1. Navigate to Privacy Centre: `/privacy-centre/[widgetId]?visitorId=[visitorId]`
2. Find the "Link Your Preferences" card
3. Enter your email address
4. Check your inbox for the OTP
5. Enter the 6-digit code
6. Verify successful linking

## User Flow

### Step 1: Email Input
```
┌─────────────────────────────────┐
│  Link Your Preferences          │
│  ─────────────────────────────  │
│  📧 Email Address               │
│  [your@email.com          ]     │
│                                 │
│  [Send Verification Code]       │
│                                 │
│  🔒 Privacy Notice: Your email  │
│  is encrypted and only used for │
│  verification.                  │
└─────────────────────────────────┘
```

### Step 2: OTP Verification
```
┌─────────────────────────────────┐
│  Code Sent!                     │
│  your@email.com        [Change] │
│  ─────────────────────────────  │
│  Enter 6-Digit Code             │
│  [  1  2  3  4  5  6  ]        │
│                                 │
│  [Verify & Link]                │
│  [Resend Code]                  │
│                                 │
│  ⏰ Code expires in 10 minutes  │
└─────────────────────────────────┘
```

### Step 3: Success
```
✅ Email verified!
Your preferences are now linked across 2 device(s)
```

## Security Features

### 1. Email Hashing
Emails are hashed using SHA-256 before storage:
```typescript
const emailHash = crypto
  .createHash('sha256')
  .update(email.toLowerCase().trim())
  .digest('hex');
```

### 2. Rate Limiting
- **Per Email**: Max 3 OTP requests per hour
- Prevents spam and abuse
- Returns `429 Too Many Requests` when exceeded

### 3. Attempt Limiting
- **Per OTP**: Max 3 verification attempts
- Prevents brute force attacks
- Forces new OTP request after exhausting attempts

### 4. Time-Based Expiry
- OTP expires after **10 minutes**
- Automatic cleanup of expired OTPs via database function
- Reduces attack window

### 5. CORS Protection
- API endpoints include CORS headers
- Can be restricted to specific domains

## UI Components

### EmailLinkCard Component

Location: `components/privacy-centre/email-link-card.tsx`

Features:
- Two-step flow (email input → OTP verification)
- Real-time validation
- Countdown timer for resend
- Attempt tracking
- Loading states
- Error handling
- Responsive design

Props:
```typescript
interface EmailLinkCardProps {
  visitorId: string;
  widgetId: string;
  onVerified?: () => void; // Callback after successful verification
}
```

## How It Works

### 1. User Enters Email
```typescript
POST /api/privacy-centre/send-otp
├── Validate email format
├── Check rate limit (3/hour)
├── Generate 6-digit OTP
├── Store in database with expiry
├── Send email via Resend
└── Return success
```

### 2. User Receives Email
```
Subject: Verify Your Email - Consently Privacy Centre

Your OTP Code: 123456

This code expires in 10 minutes.
```

### 3. User Enters OTP
```typescript
POST /api/privacy-centre/verify-otp
├── Validate OTP format
├── Find OTP record
├── Check expiry
├── Check attempts (max 3)
├── Verify code
├── Mark as verified
├── Link email to visitor preferences
├── Count linked devices
├── Send confirmation email
└── Return success with device count
```

### 4. Preferences Linked
All preferences for this visitor get updated:
```sql
UPDATE visitor_consent_preferences
SET visitor_email_hash = 'sha256_hash'
WHERE visitor_id = 'visitor-uuid'
  AND widget_id = 'widget-uuid'
```

### 5. Cross-Device Sync
When preferences are saved:
```typescript
// Future saves automatically include the email hash
{
  visitor_id: "visitor-uuid",
  visitor_email_hash: "sha256_hash", // Links across devices
  consent_status: "accepted",
  ...
}
```

## Error Handling

### Common Errors

1. **Invalid Email Format**
   ```
   Error: "Invalid email format"
   Status: 400
   ```

2. **Rate Limit Exceeded**
   ```
   Error: "Too many OTP requests. Please try again later."
   Status: 429
   retryAfter: 3600 (seconds)
   ```

3. **Widget Not Found**
   ```
   Error: "Widget not found"
   Status: 404
   ```

4. **OTP Expired**
   ```
   Error: "Invalid or expired OTP. Please request a new one."
   Code: "OTP_NOT_FOUND"
   Status: 400
   ```

5. **Invalid OTP Code**
   ```
   Error: "Invalid OTP code."
   Code: "INVALID_OTP"
   remainingAttempts: 2
   Status: 400
   ```

6. **Max Attempts Exceeded**
   ```
   Error: "Maximum verification attempts exceeded. Please request a new OTP."
   Code: "MAX_ATTEMPTS_EXCEEDED"
   Status: 400
   ```

## Testing

### Manual Testing

1. **Test OTP Generation**
   ```bash
   curl -X POST http://localhost:3000/api/privacy-centre/send-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "visitorId": "test-visitor-123",
       "widgetId": "your-widget-id"
     }'
   ```

2. **Test OTP Verification**
   ```bash
   curl -X POST http://localhost:3000/api/privacy-centre/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "otpCode": "123456",
       "visitorId": "test-visitor-123",
       "widgetId": "your-widget-id"
     }'
   ```

3. **Test Rate Limiting**
   - Send 4 OTP requests within 1 hour
   - 4th request should fail with 429 status

4. **Test Attempt Limiting**
   - Request OTP
   - Enter wrong code 3 times
   - 3rd attempt should indicate max attempts exceeded

5. **Test Expiry**
   - Request OTP
   - Wait 11 minutes
   - Try to verify (should fail with OTP_NOT_FOUND)

## Database Maintenance

### Cleanup Expired OTPs

The migration includes a cleanup function. Run periodically:

```sql
SELECT cleanup_expired_otps();
-- Returns: number of deleted records
```

Recommended: Set up a cron job or scheduled task:
```sql
-- Run every hour via pg_cron or external scheduler
SELECT cleanup_expired_otps();
```

## Monitoring

### Key Metrics to Track

1. **OTP Delivery Rate**
   - Successful sends vs failures
   - Monitor Resend dashboard

2. **Verification Success Rate**
   - Verified OTPs vs total sent
   - Target: >80%

3. **Failed Attempts**
   - Track OTPs with attempts >= 3
   - Indicator of usability issues

4. **Rate Limit Hits**
   - Track 429 responses
   - Adjust limits if needed

5. **Linked Devices**
   - Average devices per email
   - Indicates feature adoption

### Sample Queries

```sql
-- OTP verification success rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE verified = true) as verified,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE verified = true)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as success_rate_percent
FROM email_verification_otps
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Most popular linking times
SELECT 
  DATE_TRUNC('hour', verified_at) as hour,
  COUNT(*) as verifications
FROM email_verification_otps
WHERE verified = true
  AND verified_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY verifications DESC
LIMIT 10;

-- Failed verification attempts
SELECT 
  email_hash,
  attempts,
  created_at,
  expires_at,
  verified
FROM email_verification_otps
WHERE attempts >= 3
  AND verified = false
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Verify Domain**
   - Ensure domain is verified in Resend dashboard
   - Or use `onboarding@resend.dev` for testing

3. **Check Logs**
   ```bash
   # Look for Resend errors in terminal
   # Search for: "Resend email error"
   ```

4. **Test Resend Connection**
   ```typescript
   // lib/resend-email.ts
   // Check console for "✅ Email sent successfully"
   ```

### OTP Not Working

1. **Check Database**
   ```sql
   SELECT * FROM email_verification_otps
   WHERE email = 'user@example.com'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Verify Expiry**
   ```sql
   SELECT 
     id,
     expires_at,
     NOW(),
     expires_at > NOW() as is_valid
   FROM email_verification_otps
   WHERE visitor_id = 'your-visitor-id';
   ```

3. **Check Attempts**
   - Max 3 attempts per OTP
   - Request new OTP if exceeded

### Cross-Device Sync Not Working

1. **Check Email Hash**
   ```sql
   SELECT visitor_id, visitor_email_hash
   FROM visitor_consent_preferences
   WHERE visitor_email_hash IS NOT NULL
   ORDER BY updated_at DESC;
   ```

2. **Verify Linking**
   ```sql
   -- Should show multiple visitor IDs with same email hash
   SELECT visitor_email_hash, COUNT(DISTINCT visitor_id) as device_count
   FROM visitor_consent_preferences
   GROUP BY visitor_email_hash
   HAVING COUNT(DISTINCT visitor_id) > 1;
   ```

## Future Enhancements

### Planned Features

- [ ] **Email Templates**: Customizable email templates per widget
- [ ] **Magic Links**: Alternative to OTP (passwordless link)
- [ ] **SMS Verification**: Support for phone number verification
- [ ] **Device Management**: UI to view and unlink devices
- [ ] **Email Preferences**: Manage linked email from dashboard
- [ ] **Analytics**: Track verification rates and device counts
- [ ] **Localization**: Multi-language email templates
- [ ] **Custom Expiry**: Configurable OTP expiry time

## Best Practices

### For Developers

1. **Always validate input** on both client and server
2. **Use environment variables** for API keys
3. **Log errors** but not sensitive data (emails, OTPs)
4. **Test rate limiting** in staging
5. **Monitor email delivery** via Resend dashboard
6. **Clean up expired OTPs** regularly
7. **Use HTTPS** in production

### For Users

1. **Check spam folder** if email doesn't arrive
2. **Request new OTP** if expired
3. **Don't share OTP codes** with anyone
4. **Use valid email** for linking
5. **Complete verification** within 10 minutes

## Support

### Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/dashboard
- **Migration File**: `supabase/migrations/20250119000001_create_email_verification_otp.sql`
- **Email Service**: `lib/resend-email.ts`
- **API Endpoints**: `app/api/privacy-centre/send-otp/` and `verify-otp/`

### Common Questions

**Q: How long is the OTP valid?**  
A: 10 minutes from generation.

**Q: How many devices can I link?**  
A: Unlimited. All devices with the same verified email will sync.

**Q: Can I unlink my email?**  
A: Currently not supported via UI. Contact support if needed.

**Q: Is my email stored?**  
A: Yes, but it's hashed (SHA-256) for privacy. Plain email is only used temporarily for sending OTP.

**Q: What happens if I don't verify?**  
A: Your preferences still work on the current device. Verification is only needed for cross-device sync.

**Q: Can I change my linked email?**  
A: Yes, verify a different email and it will update the link.

## License

This feature is part of the Consently platform and follows the same license.

---

**Last Updated**: November 19, 2025  
**Version**: 1.0.0  
**Author**: Consently Development Team

