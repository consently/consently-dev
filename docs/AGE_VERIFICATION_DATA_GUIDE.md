# Age Verification Data Storage Guide

## Overview

This document explains the age verification flow and provides recommendations for data storage based on privacy best practices and compliance requirements.

## Current Implementation Flow

### 1. Initiation (`/api/digilocker/init`)

```
User clicks "Verify with DigiLocker"
    ↓
Backend generates PKCE (code_verifier, code_challenge)
    ↓
Stores code_verifier in Redis (10 min TTL)
    ↓
Redirects to DigiLocker authorization URL
```

**Security features:**
- PKCE prevents authorization code interception
- State parameter prevents CSRF attacks
- Short-lived Redis storage (10 min)

### 2. DigiLocker Authorization

```
User authenticates with DigiLocker
    ↓
User consents to share profile info (DOB, name)
    ↓
DigiLocker redirects to /api/digilocker/callback?code=xxx&state=yyy
```

### 3. Callback Processing (`/api/digilocker/callback`)

```
Validate state parameter
    ↓
Exchange code + code_verifier for tokens
    ↓
Decode id_token JWT → extract DOB, name, digilocker_id
    ↓
Normalize DOB format (DD/MM/YYYY → DDMMYYYY)
    ↓
Calculate age from DOB
    ↓
Encrypt tokens (AES-256-GCM)
    ↓
Store in digilocker_verifications table
    ↓
Redirect to frontend with isAdult, age, name
```

### 4. Status Check (`/api/digilocker/status`)

```
Frontend checks verification status
    ↓
Query digilocker_verifications table
    ↓
Return isAdult, age, name, consent validity
```

## Data Stored Currently

### `digilocker_verifications` Table

| Field | Type | Purpose | Retention |
|-------|------|---------|-----------|
| `user_id` | UUID | Link to your user | Until user deletes account |
| `digilocker_id` | VARCHAR | DigiLocker unique identifier | Same as above |
| `name` | VARCHAR | User's name | Same as above |
| `dob_raw` | VARCHAR(8) | Raw DOB (DDMMYYYY) | Same as above |
| `date_of_birth` | DATE | ISO format date | Same as above |
| `age_at_verification` | INTEGER | Age when verified | Same as above |
| `is_adult` | BOOLEAN | 18+ status | Same as above |
| `gender` | CHAR(1) | M/F/T/O | Same as above |
| `access_token_encrypted` | TEXT | OAuth access token | Same as above |
| `refresh_token_encrypted` | TEXT | OAuth refresh token | Same as above |
| `consent_valid_till` | TIMESTAMP | DigiLocker consent expiry | Same as above |
| `eaadhaar_linked` | BOOLEAN | eAadhaar status | Same as above |

## Privacy Recommendations

### Option 1: Minimal Data (Recommended for Privacy)

**Store ONLY:**
- `user_id`
- `is_adult` (boolean)
- `verified_at` (timestamp)
- `expires_at` (timestamp for re-verification)
- `method` ('digilocker')

**Don't store:**
- Actual DOB
- Name
- DigiLocker ID
- Tokens (use once and discard)

**Migration:**

```sql
-- Create minimal verification table
CREATE TABLE age_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_verified BOOLEAN NOT NULL DEFAULT true,
    is_adult BOOLEAN NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Re-verify after N days
    method VARCHAR(20) NOT NULL DEFAULT 'digilocker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-cleanup job (run daily)
DELETE FROM age_verifications WHERE expires_at < NOW();
```

### Option 2: Current Approach with Cleanup

Keep current schema but add:

1. **Auto-delete tokens** after consent expires
2. **Periodic cleanup** of old verifications
3. **Hash digilocker_id** instead of storing raw

```sql
-- Add cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_digilocker_tokens()
RETURNS void AS $$
BEGIN
    -- Clear tokens but keep verification status
    UPDATE digilocker_verifications
    SET 
        access_token_encrypted = NULL,
        refresh_token_encrypted = NULL
    WHERE consent_valid_till < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Option 3: Real-time Only (No Storage)

Don't store any DigiLocker data:

```typescript
// In callback handler
const ageVerification = verifyAge(tokenData.dob!);

// Update user profile only
await supabase
  .from('users')
  .update({ 
    is_age_verified: true,
    is_adult: ageVerification.isAdult,
    age_verified_at: new Date().toISOString()
  })
  .eq('id', userId);

// Discard all tokens and PII immediately
```

## Compliance Considerations

### DPDP Act 2023 (India)

- **Purpose Limitation**: Only collect what you need
- **Data Minimization**: Store minimal data
- **Storage Limitation**: Don't store longer than necessary
- **Consent**: DigiLocker consent ≠ your app's consent

### GDPR (if applicable)

- **Lawful Basis**: Legitimate interest or consent
- **Right to Erasure**: User can request deletion
- **Data Portability**: User can request their data

## Recommended Implementation

For most use cases (age-gating, compliance), **Option 1 (Minimal Data)** is recommended:

1. **User verifies** via DigiLocker
2. **Calculate** `is_adult` boolean
3. **Store only**: `is_adult`, `verified_at`, `expires_at`
4. **Discard**: DOB, name, tokens, digilocker_id
5. **Re-verify** after expiry (e.g., 1 year or when user turns 18)

### Code Changes Required

```typescript
// In callback route - after age verification
const ageVerification = verifyAge(tokenData.dob!);

// Store minimal data only
await serviceClient
  .from('age_verifications')
  .upsert({
    user_id: effectiveUserId,
    is_adult: ageVerification.isAdult,
    verified_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  });

// DO NOT store tokens, DOB, name, digilocker_id
```

## Security Checklist

- [ ] Encryption key rotation policy
- [ ] Access logs for verification data
- [ ] Auto-cleanup of expired data
- [ ] User data export/deletion capability
- [ ] Regular security audits
- [ ] DigiLocker partner compliance review

## Questions to Consider

1. **Do you need to know the user's exact age?** Or just 18+ yes/no?
2. **How long should verification be valid?** 1 year? Until 18th birthday?
3. **Do you need re-verification?** When user approaches 18?
4. **Can user delete their verification data?** Right to be forgotten?
5. **Do you need audit logs?** For compliance purposes?

## Conclusion

The current implementation is functional but stores more data than necessary. For better privacy and compliance, consider adopting the minimal data approach (Option 1) or adding automatic cleanup (Option 2).
