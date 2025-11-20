# Welcome Banner Email + OTP and Bulk Preferences API Implementation

## Overview
This document describes the implementation of two major features:
1. **Email verification modal in widget** - Optional first-time user flow for email verification with OTP
2. **Bulk preferences API** - Atomic upsert endpoint for efficient Accept All / Reject All operations

## 1. Email Verification Modal in Widget

### Features Implemented

#### Modal UI (`showEmailVerificationModal()` in `public/dpdpa-widget.js`)
- **Two-step flow**:
  - Step 1: Email input with "Send Verification Code" and "Skip for Now" buttons
  - Step 2: OTP verification with 6-digit code input, resend, and change email options
- **Visual design**: Purple gradient for step 1, green gradient for step 2
- **Responsive**: Works on mobile and desktop
- **Countdown timer**: 60-second cooldown for resend button
- **Error handling**: Displays validation errors, rate limit errors, and server errors

#### Integration Points
- **Triggered**: For new users (no stored consent ID) before showing verification screen
- **Optional**: User can skip with "Skip for Now" button
- **Persistent decline**: Stores skip preference for 1 day to avoid re-prompting
- **Config flag**: Can be disabled by setting `config.enableEmailVerification = false`

#### API Integration
- **Send OTP**: `POST /api/privacy-centre/send-otp`
  - Validates email format
  - Checks rate limiting (max 3 requests per hour per email)
  - Generates 6-digit OTP with 10-minute expiration
  - Sends email via Resend service
- **Verify OTP**: `POST /api/privacy-centre/verify-otp`
  - Validates 6-digit code
  - Max 3 attempts per OTP
  - Links email hash to visitor preferences
  - Returns linked device count

#### User Flow
```
New User
  ↓
Email Verification Modal (Optional)
  ├─→ Enter Email → Send OTP → Verify Code → Continue
  └─→ Skip for Now → Continue
  ↓
Consent ID Verification Screen
  ↓
Consent Widget
```

### Security Features
- **Email hashing**: Only SHA-256 hash stored on server
- **Rate limiting**: 3 OTP requests per email per hour
- **OTP expiration**: 10 minutes
- **Attempt limiting**: 3 verification attempts per OTP
- **Cryptographically secure**: OTP generation uses crypto.randomBytes
- **No spam**: Clear privacy notice, encrypted storage

### Code Location
- Widget function: `public/dpdpa-widget.js` lines ~1522-1916
- Integration: `public/dpdpa-widget.js` lines ~2624-2645
- API endpoints: Already existing
  - `app/api/privacy-centre/send-otp/route.ts`
  - `app/api/privacy-centre/verify-otp/route.ts`

## 2. Bulk Preferences API

### Endpoint
`POST /api/privacy-centre/preferences/bulk`

### Purpose
Atomically upsert all activity preferences in a single database operation. More efficient than individual updates for Accept All / Reject All scenarios.

### Request Format
```json
{
  "visitorId": "string",
  "widgetId": "string",
  "action": "accept_all" | "reject_all" | "custom",
  "preferences": [
    {
      "activityId": "uuid",
      "consentStatus": "accepted" | "rejected" | "withdrawn"
    }
  ],
  "visitorEmail": "optional-email@example.com",
  "metadata": {
    "ipAddress": "optional",
    "userAgent": "optional",
    "deviceType": "optional",
    "language": "optional"
  }
}
```

### Features
- **Atomic upsert**: Uses Supabase `.upsert()` with `ON CONFLICT` clause
- **Bulk operation**: Single database round-trip for all activities
- **Withdrawal detection**: Automatically marks previously accepted activities as "withdrawn" on reject
- **Validation**: Checks all activity IDs exist before upserting
- **Sync to consent records**: Creates matching entry in `dpdpa_consent_records`
- **Authoritative response**: Returns updated preferences from database

### Actions
- `accept_all`: Sets all widget activities to "accepted"
- `reject_all`: Sets all to "rejected" or "withdrawn" (if previously accepted)
- `custom`: Accepts custom preferences array for partial updates

### Response Format
```json
{
  "success": true,
  "message": "Successfully accepted/rejected all preferences",
  "data": {
    "updatedCount": 5,
    "expiresAt": "2024-12-31T23:59:59Z",
    "preferences": [
      {
        "id": "uuid",
        "visitor_id": "string",
        "widget_id": "string",
        "activity_id": "uuid",
        "consent_status": "accepted",
        "consent_given_at": "2024-01-01T00:00:00Z",
        "last_updated": "2024-01-01T00:00:00Z",
        "expires_at": "2024-12-31T23:59:59Z"
      }
    ]
  }
}
```

### Performance Benefits
- **Single DB transaction**: vs N individual updates/inserts
- **Reduced latency**: One network round-trip instead of N
- **Atomic consistency**: All-or-nothing guarantee
- **Optimistic concurrency**: Uses upsert to handle race conditions

### Code Location
- API endpoint: `app/api/privacy-centre/preferences/bulk/route.ts`
- Frontend integration: `components/privacy-centre/preference-centre.tsx` lines ~202-287

### Frontend Integration
The Preference Centre now uses the bulk API for Accept All / Reject All:
- `handleAcceptAll()`: Calls bulk API with `action: 'accept_all'`
- `handleRejectAll()`: Calls bulk API with `action: 'reject_all'`
- Individual toggles: Still use PATCH `/api/privacy-centre/preferences`

## Testing Checklist

### Email Verification Modal
- [ ] Modal appears for first-time users (no consent ID)
- [ ] Email validation rejects invalid formats
- [ ] "Send Verification Code" button sends OTP
- [ ] Rate limiting triggers after 3 requests per hour
- [ ] OTP code is received via email
- [ ] 6-digit OTP verification works
- [ ] Invalid OTP shows error and decrements remaining attempts
- [ ] Max attempts (3) blocks further verification
- [ ] Resend button has 60-second cooldown
- [ ] "Change Email" button returns to email input
- [ ] "Skip for Now" button skips and doesn't re-prompt for 1 day
- [ ] Successful verification shows success toast
- [ ] Email hash is stored with visitor preferences
- [ ] Linked devices count is accurate

### Bulk Preferences API
- [ ] `POST /api/privacy-centre/preferences/bulk` endpoint exists
- [ ] Accept All action sets all activities to "accepted"
- [ ] Reject All action sets all to "rejected" or "withdrawn"
- [ ] Withdrawal detection works (previously accepted → withdrawn)
- [ ] Invalid activity IDs return 400 error
- [ ] Widget not found returns 404 error
- [ ] Missing required fields return 400 error
- [ ] Successful response includes updated preferences
- [ ] Consent record is synced to `dpdpa_consent_records`
- [ ] Device type normalization works correctly
- [ ] Email hash is stored if provided
- [ ] CORS headers allow public access

### Integration Testing
- [ ] Preference Centre "Accept All" uses bulk API
- [ ] Preference Centre "Reject All" uses bulk API
- [ ] Individual toggle changes use PATCH endpoint
- [ ] UI shows immediate feedback after bulk operation
- [ ] Preferences persist after page refresh
- [ ] Cross-device sync works with email verification
- [ ] Rate limiting doesn't break normal flows

## Configuration

### Widget Configuration
To disable email verification modal:
```javascript
config.enableEmailVerification = false;
```

### Environment Variables
Required for email OTP (already configured):
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Consently <noreply@consently.in>"
```

## Database Schema
No schema changes required. Uses existing tables:
- `email_verification_otps` - Stores OTP codes
- `visitor_consent_preferences` - Stores preferences
- `dpdpa_consent_records` - Sync consent records
- `processing_activities` - Activity validation

## Rollout Strategy

### Phase 1: Testing (Current)
- Test email OTP flow in development
- Test bulk API with Postman/curl
- Verify database operations

### Phase 2: Soft Launch
- Enable for 10% of new users
- Monitor error rates and email delivery
- Collect feedback

### Phase 3: Full Launch
- Enable for all users
- Monitor performance metrics
- Optimize based on data

## Monitoring Metrics
- **Email verification**:
  - OTP send success rate
  - OTP verification success rate
  - Skip rate (users clicking "Skip for Now")
  - Average time to verify
  - Rate limit hit rate
- **Bulk API**:
  - Request latency (p50, p95, p99)
  - Error rate
  - Usage ratio (bulk vs individual)
  - Database query performance

## Known Limitations
1. **Email verification is optional** - Users can skip, so not all visitors will have email linked
2. **Bulk API requires all activities upfront** - Can't be used for incremental updates
3. **Rate limiting is IP-based** - Could affect users behind shared NAT
4. **OTP expiration is fixed** - 10 minutes, not configurable per-widget
5. **Email verification modal blocks widget** - Must complete or skip before seeing consent options

## Future Improvements
1. **Reminder to verify email later** - Add CTA in consent widget for unverified users
2. **Email verification in Preference Centre** - Allow verification after initial consent
3. **Batch OTP generation** - Pre-generate OTP codes for faster response
4. **Configurable OTP expiration** - Per-widget OTP timeout settings
5. **SMS verification option** - Alternative to email for mobile users
6. **Progressive enhancement** - Show simplified flow for users without JavaScript

## Related Documentation
- [Email Verification Setup](../setup/EMAIL_VERIFICATION_SETUP.md)
- [Email Linking Guide](../features/EMAIL_LINKING_GUIDE.md)
- [Privacy Centre Implementation](../guides/PRIVACY_CENTRE_IMPLEMENTATION.md)
- [Preference Centre Revocation Fix](../fixes/PREFERENCE_CENTRE_REVOCATION_FIX.md)
