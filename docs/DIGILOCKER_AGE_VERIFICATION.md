# DigiLocker Age Verification Integration

## Overview

This module provides secure age verification (18+) through DigiLocker OAuth 2.0 + PKCE flow. It integrates with the Government of India's DigiLocker MeriPehchaan API to fetch verified user DOB and calculate age classification.

## Features

- ✅ **Secure OAuth 2.0 + PKCE Flow** - Industry-standard security
- ✅ **Real-time Age Calculation** - Accurate age computation from DOB (DDMMYYYY format)
- ✅ **Encrypted Token Storage** - AES-256-GCM encryption for all tokens
- ✅ **31-Day Consent Validity** - Automatic consent expiry tracking
- ✅ **Comprehensive Audit Logging** - Full activity tracking
- ✅ **Production Ready** - Complete error handling and security measures

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│  /api/digilocker │────▶│  DigiLocker     │
│                 │     │  /init           │     │  OAuth Server   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Age Verification│◀────│ /api/digilocker  │◀────│  Callback with  │
│  Page            │     │ /callback        │     │  Authorization  │
└─────────────────┘     └──────────────────┘     │  Code           │
                                                  └─────────────────┘
```

## File Structure

```
app/
├── age-verification/
│   └── page.tsx                    # Standalone verification page
├── api/
│   └── digilocker/
│       ├── init/
│       │   └── route.ts            # Initiate OAuth flow
│       ├── callback/
│       │   └── route.ts            # Handle OAuth callback
│       └── status/
│           └── route.ts            # Get verification status
lib/
├── digilocker.ts                   # Core DigiLocker service
└── audit.ts                        # Audit logging (updated)
components/ui/
├── alert.tsx                       # Alert component
├── progress.tsx                    # Progress bar component
supabase/
└── migrations/
    └── 43_add_digilocker_age_verification.sql
```

## Environment Variables

Add these to your `.env.local`:

```env
# DigiLocker OAuth Configuration
# Register at: https://partners.digilocker.gov.in
DIGILOCKER_ENV=production
DIGILOCKER_CLIENT_ID=your_digilocker_client_id
DIGILOCKER_CLIENT_SECRET=your_digilocker_client_secret
DIGILOCKER_REDIRECT_URI=https://www.consently.in/api/auth/digilocker/callback
DIGILOCKER_ISSUER_ID=in.consently
```

### DigiLocker Portal Setup

1. Visit: https://partners.digilocker.gov.in
2. Navigate to: Consume APIs → MeriPehchaan Auth
3. Configure:
   - **Website URL:** `https://www.consently.in`
   - **App Name:** `Age Verification`
   - **Callback URL:** `https://www.consently.in/api/auth/digilocker/callback`
   - **Token Auth Method:** `client_credentials`
   - **Tag:** `Production`
   - **Scopes:**
     - ☑️ Openid (Mandatory)
     - ☑️ Profile information (Name, Date of Birth, Gender)
     - ☑️ Age verification

## API Endpoints

### 1. Initiate Verification

```http
GET /api/digilocker/init?redirect_to=/age-verification&purpose=kyc
```

Redirects user to DigiLocker OAuth consent screen.

**Query Parameters:**
- `redirect_to` (optional): URL to redirect after completion (default: `/age-verification`)
- `purpose` (optional): Purpose of verification - `kyc`, `verification`, `compliance`, `availing_services`, `educational` (default: `kyc`)

### 2. OAuth Callback

```http
GET /api/auth/digilocker/callback?code=xxx&state=xxx
```

**Note:** This is the callback URL configured in DigiLocker portal.

### 3. Check Status

```http
GET /api/digilocker/status
```

Returns current user's verification status.

**Response:**
```json
{
  "verified": true,
  "isAdult": true,
  "age": 25,
  "name": "John Doe",
  "consentValid": true,
  "consentValidTill": "2026-03-04T10:30:00Z",
  "verifiedAt": "2026-02-01T10:30:00Z"
}
```

## Database Schema

### digilocker_verifications Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| digilocker_id | VARCHAR(36) | Unique DigiLocker ID |
| name | VARCHAR(100) | User's name from DigiLocker |
| dob_raw | VARCHAR(8) | Raw DOB in DDMMYYYY format |
| date_of_birth | DATE | Parsed date of birth |
| age_at_verification | INTEGER | Age when verified |
| is_adult | BOOLEAN | True if age >= 18 |
| gender | CHAR(1) | M/F/T/O |
| access_token_encrypted | TEXT | Encrypted access token |
| refresh_token_encrypted | TEXT | Encrypted refresh token |
| expires_at | TIMESTAMP | Token expiry |
| consent_valid_till | TIMESTAMP | Consent validity (31 days) |
| reference_key | VARCHAR(64) | Reference from API |
| eaadhaar_linked | BOOLEAN | eAadhaar status |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

## Age Calculation Logic

```typescript
// DOB format from DigiLocker: DDMMYYYY (e.g., "31122005")
function verifyAge(dobString: string): AgeVerificationResult {
  const day = parseInt(dobString.substring(0, 2));
  const month = parseInt(dobString.substring(2, 4)) - 1;
  const year = parseInt(dobString.substring(4, 8));
  
  const birthDate = new Date(year, month, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || 
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return {
    isAdult: age >= 18,
    isMinor: age < 18,
    age,
    birthDate: birthDate.toISOString(),
    dobRaw: dobString,
  };
}
```

## Security Features

### 1. PKCE (Proof Key for Code Exchange)
- Generates cryptographically random code verifier
- SHA-256 hash creates code challenge
- Prevents authorization code interception attacks

### 2. CSRF Protection
- State parameter validated on callback
- Tied to user session
- 10-minute TTL prevents replay attacks

### 3. Token Encryption
- AES-256-GCM encryption for all tokens
- Derived key from SUPABASE_SERVICE_ROLE_KEY
- IV + Auth Tag + Ciphertext format

### 4. Row Level Security
- Users can only access their own verification data
- Service role bypasses RLS for backend operations

### 5. Audit Logging
- All verification attempts logged
- Success/failure tracking
- IP address and user agent capture

## Error Handling

| Error Code | Cause | User Message |
|------------|-------|--------------|
| `access_denied` | User declined consent | "You chose not to share your information" |
| `session_expired` | State/ PKCE expired | "Your session has expired. Please try again." |
| `invalid_grant` | Code reused or expired | "Session expired. Please try again." |
| `invalid_client` | Credentials mismatch | "Configuration error. Contact support." |
| `configuration_error` | Missing env vars | "Integration not configured. Contact support." |
| `service_unavailable` | Redis unavailable | "Service temporarily unavailable." |

## Usage Examples

### Basic Verification Flow

```typescript
// 1. User clicks verify button
<button onClick={() => window.location.href = '/api/digilocker/init'}>
  Verify with DigiLocker
</button>

// 2. User is redirected to DigiLocker
// 3. User grants consent
// 4. Callback processes and redirects to:
// /age-verification?verified=true&isAdult=true&age=25

// 5. Check status programmatically
const response = await fetch('/api/digilocker/status');
const status = await response.json();

if (status.verified && status.isAdult) {
  enableAdultFeatures();
}
```

### With Custom Redirect

```typescript
// After verification, redirect to specific page
const redirectUrl = encodeURIComponent('/dashboard/premium-content');
window.location.href = `/api/digilocker/init?redirect_to=${redirectUrl}`;
```

## Testing

### Test DOB Scenarios

```typescript
const testCases = [
  { dob: '01012000', expectedAge: 26, expectedIsAdult: true },   // Adult
  { dob: '31122006', expectedAge: 19, expectedIsAdult: true },   // Just turned 18
  { dob: '01012010', expectedAge: 15, expectedIsAdult: false },  // Minor
  { dob: '29022004', expectedAge: 21, expectedIsAdult: true },   // Leap year
];
```

### Manual Testing Steps

1. Navigate to `/age-verification`
2. Click "Verify with DigiLocker"
3. Login with test credentials (use DigiLocker sandbox for testing)
4. Grant consent on the consent screen
5. Verify successful redirect with `verified=true` parameter

## Integration with DPDPA Widget

To integrate with the DPDPA consent widget:

```typescript
// In widget configuration
const ageVerification = await fetch('/api/digilocker/status').then(r => r.json());

if (!ageVerification.verified) {
  // Show age verification gate
  showDigiLockerButton();
} else if (!ageVerification.isAdult) {
  // Show parental consent flow
  showParentalConsentFlow(ageVerification.age);
} else {
  // User is verified adult, show normal consent
  showConsentWidget();
}
```

## Deployment Checklist

- [ ] Register app on DigiLocker Partner Portal
- [ ] Configure callback URL in portal (must match exactly)
- [ ] Add environment variables to production
- [ ] Run database migration
- [ ] Configure Redis/Upstash
- [ ] Test OAuth flow in sandbox environment
- [ ] Test OAuth flow in production environment
- [ ] Verify SSL certificate is valid
- [ ] Add monitoring for API errors
- [ ] Document troubleshooting steps

## Troubleshooting

### Callback Returns 404
- Verify callback route is deployed: `/api/auth/digilocker/callback`
- Check that the route file exists and is properly exported
- Verify `DIGILOCKER_REDIRECT_URI` matches exactly with portal

### Invalid Client Error
- Check `DIGILOCKER_CLIENT_ID` and `DIGILOCKER_CLIENT_SECRET`
- Ensure no extra spaces in environment variables
- Verify credentials are from correct environment (prod/sandbox)

### Session Expired Error
- Redis must be configured for PKCE storage
- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- User must complete flow within 10 minutes

### Age Calculation Wrong
- DigiLocker returns DOB in DDMMYYYY format
- Verify leap year handling is correct
- Check timezone issues (use UTC for calculations)

## References

- DigiLocker API Documentation: https://partners.digilocker.gov.in
- OAuth 2.0 PKCE: https://tools.ietf.org/html/rfc7636
- DigiLocker Developer Portal: https://developer.digilocker.gov.in

## License

This module is part of the Consently platform and follows the same licensing terms.
