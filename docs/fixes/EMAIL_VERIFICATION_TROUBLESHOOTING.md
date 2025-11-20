# Email Verification Troubleshooting Guide

This guide helps you diagnose and fix issues with the email verification feature for cross-device preference linking.

## Quick Diagnostic Test

Run this command to test the entire email verification flow:

```bash
npx tsx scripts/test-email-verification.ts your@email.com
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Table existence
- ✅ OTP generation and storage
- ✅ Email sending
- ✅ OTP verification

---

## Common Issues and Solutions

### Issue 1: "Email service not configured"

**Symptoms:**
- Error in API response: "Email service not configured"
- Console warning: "⚠️ RESEND_API_KEY not configured"

**Root Cause:**
Missing or incorrectly configured `RESEND_API_KEY` environment variable.

**Solution:**

1. **Get a Resend API key:**
   - Sign up at https://resend.com
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

2. **Add to your environment:**

   Create or update `.env.local`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"
   ```

3. **Restart your development server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

4. **Verify:**
   ```bash
   npx tsx scripts/test-resend-config.ts
   ```

---

### Issue 2: Email not received

**Symptoms:**
- User doesn't receive OTP email
- "OTP sent successfully" message appears but no email arrives

**Possible Causes & Solutions:**

#### A. Check spam folder
First, check your spam/junk folder. Resend emails sometimes get filtered.

#### B. Verify Resend API key
```bash
npx tsx scripts/test-resend-direct.ts your@email.com
```

If this fails, your API key is invalid or revoked.

#### C. Check Resend dashboard
1. Log in to https://resend.com/emails
2. Check email logs
3. Look for delivery status, bounce, or errors

#### D. Domain verification (Production only)
If using a custom domain, verify it in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add DNS records:
   ```
   TXT  @  v=spf1 include:_spf.resend.com ~all
   CNAME resend._domainkey  resend._domainkey.resend.com
   ```
4. Wait for verification (5-10 minutes)
5. Update `.env.local`:
   ```bash
   RESEND_FROM_EMAIL="Consently <noreply@yourdomain.com>"
   ```

#### E. Rate limiting
Check if you've exceeded Resend's free tier limits:
- 100 emails/day
- 3,000 emails/month

View usage in Resend Dashboard.

---

### Issue 3: "Widget not found" error

**Symptoms:**
- 404 error when sending OTP
- Error message: "Widget not found"

**Solution:**

1. **Check widget exists:**
   ```sql
   SELECT widget_id, name, domain FROM dpdpa_widget_configs LIMIT 10;
   ```

2. **Verify widget ID in URL:**
   URL should be: `/privacy-centre/{VALID_WIDGET_ID}?visitorId={ANY_ID}`

3. **Check widget is active:**
   ```sql
   SELECT widget_id, is_active FROM dpdpa_widget_configs 
   WHERE widget_id = 'your-widget-id';
   ```

---

### Issue 4: Database table not found

**Symptoms:**
- Error: "relation 'email_verification_otps' does not exist"
- 500 error when sending OTP

**Solution:**

1. **Check if migration was run:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'email_verification_otps';
   ```

2. **Run the migration:**

   **Option A: Using Supabase CLI**
   ```bash
   supabase db push
   ```

   **Option B: Manual SQL**
   1. Open Supabase Dashboard → SQL Editor
   2. Copy contents from `supabase/migrations/20250119000001_create_email_verification_otp.sql`
   3. Execute the query

3. **Verify:**
   ```bash
   npx tsx scripts/check-db-table.ts
   ```

---

### Issue 5: "Invalid or expired OTP"

**Symptoms:**
- User enters correct OTP but gets "Invalid or expired OTP"
- OTP expires too quickly

**Possible Causes & Solutions:**

#### A. Clock skew
Server time and client time are out of sync.

**Check:**
```bash
date
```

**Fix:** Ensure server time is synced with NTP.

#### B. OTP already used
Each OTP can only be used once.

**Solution:** Request a new OTP.

#### C. OTP actually expired
OTPs expire in 10 minutes by default.

**Check expiration:**
```sql
SELECT id, email, otp_code, expires_at, verified, created_at
FROM email_verification_otps
WHERE email_hash = 'your_email_hash'
ORDER BY created_at DESC
LIMIT 5;
```

#### D. Wrong email case
Email hashing is case-sensitive in some implementations.

**Verify:** The library normalizes emails (lowercase + trim), but check logs.

---

### Issue 6: "Maximum attempts exceeded"

**Symptoms:**
- Error after 3 failed verification attempts
- Can't retry even with new OTP

**Solution:**

1. **Request a new OTP** - This resets the attempt counter

2. **Manual reset (if needed):**
   ```sql
   -- Delete old failed OTPs for this email
   DELETE FROM email_verification_otps
   WHERE email_hash = 'email_hash_here'
   AND verified = false;
   ```

3. **Cleanup all expired OTPs:**
   ```bash
   npx tsx scripts/cleanup-all-otps.ts
   ```

---

### Issue 7: "Too many OTP requests"

**Symptoms:**
- Error: "Too many OTP requests. Please try again later."
- Status code: 429 (Rate Limited)

**Root Cause:**
More than 3 OTP requests for the same email within 1 hour.

**Solution:**

**Wait 1 hour**, or manually reset (for testing only):

```sql
-- See recent OTP requests for an email
SELECT email, created_at, verified 
FROM email_verification_otps
WHERE email_hash = 'email_hash_here'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- For testing only: Delete recent OTPs
DELETE FROM email_verification_otps
WHERE email_hash = 'email_hash_here'
AND created_at > NOW() - INTERVAL '1 hour';
```

**For production:** This is a security feature. Don't disable it.

---

### Issue 8: Preferences not linking after verification

**Symptoms:**
- OTP verification succeeds
- But preferences don't sync across devices

**Possible Causes & Solutions:**

#### A. No preferences to link
The visitor has no existing preferences.

**Check:**
```sql
SELECT * FROM visitor_consent_preferences
WHERE visitor_id = 'visitor_id_here'
AND widget_id = 'widget_id_here';
```

**Solution:** This is expected for new visitors. They need to set preferences first.

#### B. Email hash mismatch
Preferences weren't properly linked to email hash.

**Check:**
```sql
SELECT visitor_id, activity_id, visitor_email_hash
FROM visitor_consent_preferences
WHERE visitor_id = 'visitor_id_here'
AND widget_id = 'widget_id_here';
```

**Expected:** `visitor_email_hash` should be a SHA-256 hash.

**Fix manually (if needed):**
```sql
UPDATE visitor_consent_preferences
SET visitor_email_hash = 'correct_hash_here'
WHERE visitor_id = 'visitor_id_here'
AND widget_id = 'widget_id_here';
```

#### C. Multiple devices not syncing
Each device needs to verify with the same email.

**Process:**
1. Device 1: Verify email → preferences linked
2. Device 2: Verify same email → preferences linked
3. Now both devices share preferences via email hash

---

## Missing Import: Clock Icon

**Symptom:**
- Build error: "Clock is not defined"
- Import error in `email-link-card.tsx`

**Solution:**
Already fixed! The Clock icon is now imported from lucide-react.

If you still see this error, ensure you have the latest version:
```bash
git pull origin main
```

---

## Environment Variable Checklist

Ensure these are set in `.env.local`:

```bash
# Required
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ RESEND_API_KEY

# Optional (but recommended)
✅ RESEND_FROM_EMAIL
```

**Verify:**
```bash
# Check if variables are loaded
node -e "console.log(process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing')"
```

---

## Database Checklist

Required tables and columns:

### Table: `email_verification_otps`
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_verification_otps';
```

Should have:
- id (uuid)
- email (varchar)
- email_hash (varchar)
- otp_code (varchar)
- visitor_id (varchar)
- widget_id (varchar)
- expires_at (timestamp)
- verified (boolean)
- verified_at (timestamp)
- attempts (integer)
- created_at (timestamp)
- updated_at (timestamp)

### Table: `visitor_consent_preferences`
Must have `visitor_email_hash` column:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visitor_consent_preferences'
AND column_name = 'visitor_email_hash';
```

---

## API Endpoint Testing

### Test send-otp endpoint:
```bash
curl -X POST http://localhost:3000/api/privacy-centre/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "visitorId": "test-123",
    "widgetId": "your-widget-id"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2025-01-19T10:30:00.000Z",
  "expiresInSeconds": 600
}
```

### Test verify-otp endpoint:
```bash
curl -X POST http://localhost:3000/api/privacy-centre/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456",
    "visitorId": "test-123",
    "widgetId": "your-widget-id"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "linkedDevices": 1,
  "verified_at": "2025-01-19T10:25:00.000Z"
}
```

---

## Browser Console Debugging

Open browser DevTools (F12) → Console tab:

### Check for errors:
```javascript
// Filter console for OTP-related messages
console.log('Checking OTP flow...');
```

### Monitor network requests:
1. Go to Network tab
2. Filter by "send-otp" and "verify-otp"
3. Check request/response bodies
4. Look for status codes (200 = success, 400 = bad request, 500 = server error)

### Check component state:
```javascript
// In React DevTools, look for EmailLinkCard component
// Check state values: step, email, otpCode, loading, etc.
```

---

## Logs to Check

### Application logs:
```bash
# In terminal where npm run dev is running
# Look for:
✅ OTP sent to user@example.com for visitor visitor-123
✅ Email verified and linked for visitor visitor-123
❌ Error: Failed to send OTP email
```

### Database logs (Supabase Dashboard):
1. Go to Logs → Postgres Logs
2. Look for INSERT/UPDATE queries on `email_verification_otps`
3. Check for constraint violations or errors

### Resend logs:
1. https://resend.com/emails
2. Check delivery status
3. Look for bounces or spam classification

---

## Manual Testing Flow

1. **Open Privacy Centre:**
   ```
   http://localhost:3000/privacy-centre/{widget_id}?visitorId={test_visitor_id}
   ```

2. **Find "Link Your Preferences" card** (should be visible below Visitor ID card)

3. **Enter your email** and click "Send Verification Code"

4. **Expected:**
   - Success toast: "OTP sent! Check your email at {email}"
   - UI changes to OTP input screen
   - Email arrives within 1-2 seconds

5. **Check email inbox** (including spam)
   - Subject: "Verify Your Email - Consently Privacy Centre"
   - Body contains 6-digit code

6. **Enter OTP code** and click "Verify & Link"

7. **Expected:**
   - Success toast: "Email verified! Your preferences are now linked across X device(s)"
   - UI resets to email input
   - Preferences are now linked to email

8. **Verify in database:**
   ```sql
   SELECT visitor_email_hash FROM visitor_consent_preferences
   WHERE visitor_id = 'test_visitor_id';
   ```
   Should show a hash value (64-character hex string).

---

## Still Having Issues?

### Run the comprehensive test:
```bash
npx tsx scripts/test-email-verification.ts your@email.com
```

### Check all scripts:
```bash
# Test Resend configuration
npx tsx scripts/test-resend-config.ts

# Test sending OTP directly
npx tsx scripts/test-send-otp.ts

# View OTP records
npx tsx scripts/view-otp-records.ts

# Cleanup test data
npx tsx scripts/cleanup-test-otps.ts
```

### Enable detailed logging:

In `lib/resend-email.ts`, logging is already enabled. Check your console output.

### Report an issue:
If none of these solutions work, please report:
1. Error messages from console
2. API response (hide sensitive data)
3. Environment (OS, Node version, browser)
4. Steps to reproduce

---

## Security Notes

⚠️ **Never share:**
- `RESEND_API_KEY`
- OTP codes
- Email hashes (in production logs)

✅ **Best practices:**
- Use different API keys for dev/production
- Rotate keys every 90 days
- Monitor Resend usage
- Keep rate limiting enabled
- Don't disable CORS in production

---

**Last Updated:** November 20, 2025  
**Version:** 1.0

