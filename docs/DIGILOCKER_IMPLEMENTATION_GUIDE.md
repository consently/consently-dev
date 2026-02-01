# DigiLocker Age Verification - Implementation Guide

## Document Version: 2.0
**Date:** 2026-02-01  
**Platform:** Consently (consently.in)  
**Status:** ✅ IMPLEMENTED - CORRECTED FLOW  

**Revision Notes (v2.0):**
- ✅ **CRITICAL FIX:** Corrected documentation to use Direct DigiLocker MeriPehchaan API (not API Setu)
- ✅ Added canonical NSSO OAuth parameters (acr, purpose)
- ✅ Updated scope from 'openid' to 'openid profile' for DOB retrieval
- ✅ Clarified distinction between API Setu (document access) vs Direct DigiLocker (age verification)
- ✅ Updated environment variables to match actual implementation

---

## Executive Summary

This document provides the **corrected** implementation guide for DigiLocker-based age verification using the **Direct DigiLocker MeriPehchaan API** (NSSO). 

> ⚠️ **IMPORTANT CLARIFICATION:**  
> This implementation uses **Direct DigiLocker MeriPehchaan API** for age verification via OAuth 2.0 + PKCE.  
> **API Setu** is a separate service for fetching issued documents and is NOT used for basic age verification.

### Why Direct DigiLocker (Not API Setu)?

| Use Case | Correct API | Reason |
|----------|-------------|--------|
| **Age Verification** | ✅ Direct DigiLocker MeriPehchaan | OAuth flow, returns profile with DOB |
| **Fetch Issued Documents** | API Setu | Document retrieval via consent artifacts |
| **Basic KYC (Name, DOB)** | ✅ Direct DigiLocker | Simpler flow, no document fetching needed |

### Current Implementation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGE VERIFICATION FLOW                              │
│              (Direct DigiLocker MeriPehchaan API)                     │
└─────────────────────────────────────────────────────────────────────┘

1. INITIATE
   POST /api/digilocker/init
   → Generates PKCE pair (code_verifier, code_challenge)
   → Stores state in Redis (CSRF protection)
   → Redirects to DigiLocker OAuth

2. DIGILOCKER OAUTH
   GET https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
   Parameters:
   - response_type=code
   - client_id={CLIENT_ID}
   - redirect_uri={REDIRECT_URI}
   - code_challenge={PKCE_CHALLENGE}
   - code_challenge_method=S256
   - state={STATE}
   - scope=openid profile          ← For DOB access
   - purpose=kyc|verification      ← Use case
   - acr=digilocker                ← NSSO canonical value

3. USER AUTHENTICATION
   → User logs in via MeriPehchaan (Aadhaar/OTP)
   → User consents to share profile (Name, DOB, Gender)
   → DigiLocker redirects to callback with ?code=xxx&state=yyy

4. TOKEN EXCHANGE
   POST /api/digilocker/callback
   → Validates state (CSRF check)
   → Exchanges code for tokens
   POST https://digilocker.meripehchaan.gov.in/public/oauth2/2/token
   
5. GET USER INFO
   → Try id_token (JWT) first for DOB
   → Fallback to /userinfo endpoint
   GET https://digilocker.meripehchaan.gov.in/public/oauth2/2/userinfo
   Headers: Authorization: Bearer {access_token}
   
6. VERIFY AGE
   → Parse DOB (DDMMYYYY format)
   → Calculate age
   → Store encrypted tokens + verification result

7. CALLBACK RESPONSE
   → Redirect to frontend with verification result
   → Store verificationAssertion in localStorage
```

---

## Environment Configuration

### Required Environment Variables

```bash
# =============================================================================
# DIGILOCKER MERIPEHCHAAN (NSSO) CONFIGURATION
# For Age Verification via Direct DigiLocker OAuth
# =============================================================================

# Base URL for DigiLocker MeriPehchaan
DIGILOCKER_BASE_URL=https://digilocker.meripehchaan.gov.in

# OAuth Client Credentials (from DigiLocker Partner Portal)
DIGILOCKER_CLIENT_ID=your_client_id_here
DIGILOCKER_CLIENT_SECRET=your_client_secret_here

# Redirect URI (must match exactly what's registered in DigiLocker portal)
DIGILOCKER_REDIRECT_URI=https://www.consently.in/api/auth/digilocker/callback

# Issuer ID (your organization's identifier)
DIGILOCKER_ISSUER_ID=in.consently

# OAuth Scope - MUST include 'profile' for DOB access
# Options: 'openid' (basic) | 'openid profile' (with DOB) | 'openid profile email'
DIGILOCKER_SCOPE=openid profile

# Environment
DIGILOCKER_ENV=production  # or 'sandbox' for testing

# =============================================================================
# OPTIONAL: API Setu Configuration (for future document fetching features)
# NOT required for basic age verification
# =============================================================================

# Only needed if you plan to fetch specific issued documents later
APISETU_BASE_URL=https://apisetu.gov.in/certificate/v3
APISETU_CLIENT_ID=your_apisetu_client_id
APISETU_CLIENT_SECRET=your_apisetu_client_secret

# =============================================================================
# SECURITY & SESSION
# =============================================================================

# Encryption key for token storage (use strong random value)
# Can use SUPABASE_SERVICE_ROLE_KEY as fallback
DIGILOCKER_ENCRYPTION_KEY=your_encryption_key_here

# Session expiry (seconds)
DIGILOCKER_SESSION_EXPIRY=600  # 10 minutes

# Redis/Upstash for PKCE state storage
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Environment Variable Validation

```typescript
// lib/env.ts or similar
export const env = {
  DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID,
  DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET,
  DIGILOCKER_REDIRECT_URI: process.env.DIGILOCKER_REDIRECT_URI,
  DIGILOCKER_SCOPE: process.env.DIGILOCKER_SCOPE || 'openid profile',
  DIGILOCKER_ENV: process.env.DIGILOCKER_ENV || 'sandbox',
  DIGILOCKER_ISSUER_ID: process.env.DIGILOCKER_ISSUER_ID || 'in.consently',
};

// Validation
if (!env.DIGILOCKER_CLIENT_ID || !env.DIGILOCKER_CLIENT_SECRET) {
  throw new Error('DigiLocker credentials not configured');
}
```

---

## API Endpoints

### Current Implementation (Correct)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/digilocker/init` | GET | Initiates OAuth flow, redirects to DigiLocker |
| `/api/digilocker/callback` | GET | Handles OAuth callback, exchanges code, stores tokens |
| `/api/digilocker/status` | GET | Returns current user's verification status |
| `/api/digilocker/config` | GET | Returns DigiLocker configuration status |

### NSSO OAuth Endpoints (DigiLocker)

| Endpoint | URL |
|----------|-----|
| **Authorization** | `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize` |
| **Token** | `https://digilocker.meripehchaan.gov.in/public/oauth2/2/token` |
| **UserInfo** | `https://digilocker.meripehchaan.gov.in/public/oauth2/2/userinfo` |

---

## Code Implementation

### 1. Build Authorization URL (with NSSO Parameters)

```typescript
// lib/digilocker.ts

export function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  purpose: 'kyc' | 'verification' | 'compliance' | 'availing_services' | 'educational' = 'kyc'
): string {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  // NSSO Canonical Parameters
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    scope: config.scope || 'openid profile',  // MUST include 'profile' for DOB
    purpose: purpose,
    acr: 'digilocker',  // NSSO canonical value - REQUIRED
  });

  return `${baseUrl}/public/oauth2/1/authorize?${params.toString()}`;
}
```

### 2. Exchange Code for Token

```typescript
// lib/digilocker.ts

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<DigiLockerTokenResponse> {
  const config = getDigiLockerConfig();
  const baseUrl = getBaseUrl();

  const tokenUrl = `${baseUrl}/public/oauth2/2/token`;

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new DigiLockerError(error.error, error.error_description);
  }

  const data = await response.json();

  // Extract DOB from id_token if not directly available
  if (!data.dob && data.id_token) {
    const payload = parseJwtPayload(data.id_token);
    if (payload.dob) {
      data.dob = payload.dob;
    }
  }

  return data;
}
```

### 3. Fetch User Info (Fallback for DOB)

```typescript
// lib/digilocker.ts

export async function fetchUserInfo(accessToken: string): Promise<DigiLockerUserInfo> {
  const baseUrl = getBaseUrl();
  const userInfoUrl = `${baseUrl}/public/oauth2/2/userinfo`;

  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new DigiLockerError('userinfo_failed', 'Failed to fetch user info');
  }

  const data = await response.json();

  // Validate DOB format
  if (data.dob && !/^\d{8}$/.test(data.dob)) {
    throw new DigiLockerError('invalid_dob_format', `Invalid DOB: ${data.dob}`);
  }

  return data;
}
```

### 4. Age Verification

```typescript
// lib/digilocker.ts

export function verifyAge(dobString: string): AgeVerificationResult {
  // Validate DDMMYYYY format
  if (!/^\d{8}$/.test(dobString)) {
    throw new DigiLockerError('invalid_dob_format', `Expected DDMMYYYY, got: ${dobString}`);
  }

  const day = parseInt(dobString.substring(0, 2), 10);
  const month = parseInt(dobString.substring(2, 4), 10) - 1;
  const year = parseInt(dobString.substring(4, 8), 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();

  // Validate date is real
  if (birthDate.getDate() !== day || birthDate.getMonth() !== month) {
    throw new DigiLockerError('invalid_date', `Invalid date: ${dobString}`);
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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

---

## Database Schema

### digilocker_verifications Table

```sql
CREATE TABLE IF NOT EXISTS digilocker_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    digilocker_id VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    dob_raw VARCHAR(8) NOT NULL,           -- DDMMYYYY from DigiLocker
    date_of_birth DATE NOT NULL,           -- ISO format
    age_at_verification INTEGER NOT NULL,
    is_adult BOOLEAN NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'T', 'O')),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consent_valid_till TIMESTAMP WITH TIME ZONE,
    reference_key VARCHAR(64),
    eaadhaar_linked BOOLEAN DEFAULT false,
    issuer_id VARCHAR(50) DEFAULT 'in.consently',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_digilocker_user ON digilocker_verifications(user_id);
CREATE INDEX idx_digilocker_consent_valid ON digilocker_verifications(consent_valid_till);

-- RLS Policies
ALTER TABLE digilocker_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY digilocker_verifications_select_own
    ON digilocker_verifications FOR SELECT
    USING (user_id = auth.uid());
```

---

## Testing Checklist

### Sandbox Testing

1. **Test Adult Verification (18+)**
   ```
   Expected: DOB returns age >= 18, isAdult=true
   ```

2. **Test Minor Verification (<18)**
   ```
   Expected: DOB returns age < 18, isAdult=false
   ```

3. **Test DOB Retrieval**
   - Verify DOB appears in id_token OR /userinfo response
   - Check format is DDMMYYYY

4. **Test OAuth Flow**
   - PKCE code_challenge sent
   - State parameter validated
   - acr=digilocker included
   - scope includes 'profile'

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| DOB not returned | Scope missing 'profile' | Update DIGILOCKER_SCOPE=openid profile |
| Invalid client | Auth Partner misconfigured | Set Token Auth Method to 'authorization_code' |
| Invalid scope | Wrong scope value | Use 'openid profile' not custom scopes |
| PAN/KYC screens appear | Expected NSSO behavior | Document this in UI, not an error |

---

## Differences: Direct DigiLocker vs API Setu

### When to Use What

| Feature | Direct DigiLocker | API Setu |
|---------|-------------------|----------|
| **Primary Use** | Authentication, Basic Profile (Name, DOB) | Fetch issued documents (Aadhaar, PAN, etc.) |
| **OAuth Flow** | Authorization Code + PKCE | Client Credentials |
| **DOB Access** | ✅ Via /userinfo or id_token | Via document content |
| **Document Fetch** | ❌ Not supported | ✅ Supported |
| **Complexity** | Lower | Higher (consent artifacts) |
| **Cost** | Free | May have usage fees |

### Recommendation

- ✅ **Use Direct DigiLocker** for: Age verification, basic KYC, identity verification
- 📄 **Use API Setu** for: Fetching specific government documents (Aadhaar PDF, PAN card, etc.)

---

## References

1. **DigiLocker Authorized Partner API Spec**: https://img1.digitallocker.gov.in/assets/img/Digital%20Locker%20Authorized%20Partner%20API%20Specification%20v1.11.pdf

2. **DigiLocker Portal**: https://partners.digilocker.gov.in

3. **API Setu Documentation**: https://docs.apisetu.gov.in (for document fetching only)

4. **MeriPehchaan Portal**: https://meripehchaan.gov.in

---

**END OF IMPLEMENTATION GUIDE**
