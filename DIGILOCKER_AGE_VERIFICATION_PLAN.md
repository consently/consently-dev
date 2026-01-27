# DigiLocker Age Verification Integration Plan
## Complete Implementation Strategy for Replacing Mocked Age Verification

**Document Version:** 1.1
**Date:** 2026-01-27
**Platform:** Consently (consently.in)
**Author:** System Architecture Review
**Status:** APPROVED - READY FOR IMPLEMENTATION

**Revision Notes (v1.1):**
- Fixed API Setu vocabulary (consent artifacts vs /user-info)
- Updated scope references to be provider-agnostic
- Clarified guardian consent as separate DigiLocker verification
- Added token deletion policy (security hardening)
- Added international users policy
- Renamed verificationAssertion → verificationAssertion

---

## Executive Summary

This document outlines the complete implementation plan for replacing the current client-side birth year selector with a production-ready, government-backed age verification system using DigiLocker (via API Setu). The current implementation is legally insufficient and must be replaced with real identity verification before any legal audit.

**Critical Risk:** The existing age gate is purely client-side and can be circumvented by:
- Changing birth year selection
- Clearing cookies/localStorage
- Using incognito mode
- Manipulating JavaScript

**Solution:** Integrate DigiLocker (API Setu) for government-issued document verification with mandatory guardian consent workflows for minors.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Backend Implementation Plan](#3-backend-implementation-plan)
4. [Frontend Implementation Plan](#4-frontend-implementation-plan)
5. [Data Model Changes](#5-data-model-changes)
6. [Security & Compliance](#6-security--compliance)
7. [Migration & Rollout Strategy](#7-migration--rollout-strategy)
8. [Risk Analysis & Edge Cases](#8-risk-analysis--edge-cases)
9. [Testing Strategy](#9-testing-strategy)
10. [Timeline & Dependencies](#10-timeline--dependencies)

---

## 1. Current State Analysis

### 1.1 What Exists Today

#### Database Layer
- **Table:** `dpdpa_widget_configs`
- **Columns:**
  - `enable_age_gate` (BOOLEAN) - Toggle for age verification
  - `age_gate_threshold` (INTEGER, 13-21) - Minimum age requirement
  - `age_gate_minor_message` (TEXT) - Message shown to blocked users

#### Frontend UI Components

**Dashboard Configuration** (`app/dashboard/dpdpa/widget/page.tsx:2545-2661`):
- Toggle switch to enable/disable age gate
- Dropdown for age threshold (13, 16, 18, 21 years)
- Textarea for custom minor message
- Live preview of age gate in widget

**Embeddable Widget** (`public/dpdpa-widget.js`):
- **Lines 289-402:** Age gate logic with birth year dropdown
- **Lines 1729-4124:** UI rendering with checkbox + birth year selector
- Cookie-based lock: `consently_minor_flag_{widgetId}` (365-day expiry)
- Device fingerprinting for tracking (hashed browser/device characteristics)

#### How It Works Today
1. User visits page with widget
2. If `enableAgeGate` is true, widget displays birth year dropdown
3. User selects birth year → calculates age
4. **If age < threshold:**
   - Sets cookie: `consently_minor_flag_{widgetId}` for 365 days
   - Shows custom message (e.g., "Ask a parent for help")
   - Blocks consent widget
5. **If age >= threshold:**
   - Allows user to proceed
   - No verification of truthfulness

#### Critical Weaknesses
- **No identity verification** - user can lie about birth year
- **Client-side only** - entire logic runs in browser
- **Cookie circumvention** - easily cleared or bypassed
- **No guardian consent** - minors are simply blocked, not properly handled
- **Not auditable** - no proof of verification for legal compliance
- **Device fingerprint** - not reliable for identity (can be spoofed)

### 1.2 Code Locations Map

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| Database Schema | `supabase/migrations/15_add_age_gate_to_dpdpa_config.sql` | All | Age gate config columns |
| Dashboard UI | `app/dashboard/dpdpa/widget/page.tsx` | 2545-2661, 3600-3624 | Age gate settings + preview |
| Widget Script | `public/dpdpa-widget.js` | 289-402, 1729-4124 | Birth year selector logic + UI |
| Type Definitions | `types/dpdpa-widget.types.ts` | 130-185 | DPDPAWidgetConfig interface |
| Consent Recording | `app/api/dpdpa/consent-record/route.ts` | All | Consent storage (no age verification) |
| Widget Config API | `app/api/dpdpa/widget-config/route.ts` | All | CRUD for widget settings |
| Public Widget API | `app/api/dpdpa/widget-public/[widgetId]/route.ts` | All | Returns config to widget |

### 1.3 Dependency Analysis

**What Relies on Current Age Gate:**
- Widget rendering logic (checks `enableAgeGate` flag)
- Cookie lock mechanism (prevents re-display)
- Minor message customization
- Preview in dashboard
- No backend validation (all client-side)

**Impact of Removal:**
- Widget will need new UI for "Verify via DigiLocker" button
- Cookie lock mechanism can be removed (server will be source of truth)
- Dashboard needs new settings for DigiLocker integration
- No breaking changes to consent recording (age verification is separate)

---

## 2. Target Architecture

### 2.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Widget detects age verification required                           │
│  (based on widget config: require_age_verification = true)          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Display "Verify Your Age via DigiLocker" button                    │
│  (replaces birth year dropdown)                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  User clicks → Backend creates verification session                 │
│  POST /api/dpdpa/age-verification/initiate                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend calls API Setu DigiLocker API                              │
│  - Authenticates with client_credentials (OAuth 2.0)                │
│  - Requests age verification + optional guardian consent scope      │
│  - Generates redirect URL                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  User redirected to DigiLocker (Meri Pehchaan Auth)                 │
│  - Government login (Aadhaar / OAuth providers)                     │
│  - Consent to share age verification                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DigiLocker verifies user & returns data                            │
│  - Date of Birth (verified from government document)                │
│  - Age (calculated)                                                 │
│  - Optional: Guardian details (if minor)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Callback to Backend: GET /api/dpdpa/age-verification/callback      │
│  - Validate state/code                                              │
│  - Exchange code for access token (server-side)                     │
│  - Fetch user age from DigiLocker API                               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend Decision Logic                                             │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ IF age >= threshold (e.g., 18):                      │           │
│  │   ✓ Mark as verified_adult                           │           │
│  │   ✓ Store verification_token (secure)                │           │
│  │   ✓ Redirect to widget with success token            │           │
│  └──────────────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ IF age < threshold (minor):                          │           │
│  │   ⚠ Check if guardian consent exists                 │           │
│  │   ⚠ If NO: Trigger guardian consent flow             │           │
│  │   ⚠ If YES: Mark as verified_minor_with_consent      │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Widget checks verification status                                  │
│  POST /api/dpdpa/age-verification/status?token=xxx                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Display appropriate UI:                                            │
│  - ✓ Verified Adult → Show consent widget                          │
│  - ⚠ Minor without guardian → Show "Guardian approval needed"      │
│  - ✓ Minor with guardian → Show consent widget (limited)           │
│  - ✗ Verification failed → Show error message                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### Backend Services

```
/api/dpdpa/age-verification/
├── initiate (POST)         # Start verification session
├── callback (GET)          # DigiLocker callback handler
├── status (GET)            # Check verification status
└── guardian-consent/       # Guardian consent sub-flow
    ├── request (POST)      # Send guardian consent request
    ├── verify (GET)        # Guardian verification callback
    └── status (GET)        # Check guardian approval status
```

#### Frontend Components

```
/components/dpdpa/age-verification/
├── AgeVerificationGate.tsx           # Main gate UI
├── DigiLockerButton.tsx              # "Verify via DigiLocker" button
├── VerificationStatusBanner.tsx      # Status messages
├── GuardianConsentPrompt.tsx         # Minor guardian flow
└── types.ts                          # TypeScript types
```

### 2.3 Data Flow Sequence

1. **Initiation:**
   - Widget calls: `POST /api/dpdpa/age-verification/initiate`
   - Body: `{ widgetId, visitorId, returnUrl }`
   - Response: `{ redirectUrl, sessionId }`

2. **DigiLocker OAuth Flow:**
   - User redirected to DigiLocker
   - User authenticates via Meri Pehchaan (Aadhaar / UIDAI)
   - User consents to age verification

3. **Callback Processing:**
   - DigiLocker redirects to: `GET /api/dpdpa/age-verification/callback?code=xxx&state=yyy`
   - Backend exchanges code for token (server-side)
   - Backend fetches user DOB/age from DigiLocker API
   - Backend stores verification in database

4. **Status Check:**
   - Widget calls: `GET /api/dpdpa/age-verification/status?sessionId=xxx`
   - Response: `{ verified, age, requiresGuardian, verificationAssertion }`

5. **Guardian Consent (if minor):**
   - User triggers: `POST /api/dpdpa/age-verification/guardian-consent/request`
   - Backend sends guardian consent request (email/SMS)
   - Guardian clicks link → `GET /api/dpdpa/age-verification/guardian-consent/verify`
   - Guardian authenticates via DigiLocker
   - Backend links guardian approval to minor's verification

---

## 3. Backend Implementation Plan

### 3.1 Environment Variables

Add to `.env.local` and `.env.production`:

```bash
# API Setu DigiLocker Configuration
APISETU_BASE_URL=https://apisetu.gov.in/certificate/v3
APISETU_CLIENT_ID=your_client_id_from_apisetu
APISETU_CLIENT_SECRET=your_client_secret_from_apisetu
APISETU_REDIRECT_URI=https://consently.in/api/dpdpa/age-verification/callback

# Sandbox environment (for testing)
APISETU_SANDBOX_URL=https://apisetu.gov.in/certificate/v3/sandbox
APISETU_USE_SANDBOX=true  # Set to false in production

# Scope configuration (as approved by API Setu - do not hardcode)
DIGILOCKER_AGE_VERIFICATION_SCOPE=DL:AgeProof  # Actual scope as per API Setu approval
DIGILOCKER_GUARDIAN_CONSENT_SCOPE=DL:AgeProof  # Same scope for guardian verification

# Security
AGE_VERIFICATION_JWT_SECRET=your_random_secret_for_jwt_signing
AGE_VERIFICATION_SESSION_EXPIRY=3600  # 1 hour in seconds
```

### 3.2 New Database Tables

#### 3.2.1 Age Verification Sessions

```sql
-- /supabase/migrations/50_create_age_verification_tables.sql

CREATE TABLE IF NOT EXISTS age_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Widget & Visitor
  widget_id VARCHAR(100) NOT NULL REFERENCES dpdpa_widget_configs(widget_id),
  visitor_id VARCHAR(255) NOT NULL,

  -- Session tracking
  session_id VARCHAR(255) NOT NULL UNIQUE,
  state_token VARCHAR(255) NOT NULL UNIQUE, -- OAuth state parameter (CSRF protection)

  -- Verification status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'verified', 'failed', 'expired')),

  -- DigiLocker integration
  digilocker_request_id VARCHAR(255),      -- API Setu request ID
  digilocker_authorization_code VARCHAR(500), -- OAuth code (temporary)
  digilocker_access_token TEXT,            -- Encrypted access token

  -- Verification results (PRIVACY: DOB is NOT stored, only derived age)
  verified_age INTEGER,                     -- Calculated age (DOB discarded after calculation)
  document_type VARCHAR(100),               -- E.g., "AADHAAR", "PAN", "DRIVING_LICENSE"
  consent_artifact_ref VARCHAR(255),        -- Reference to DigiLocker consent artifact (for audit)

  -- Guardian consent (for minors)
  requires_guardian_consent BOOLEAN DEFAULT false,
  guardian_consent_status VARCHAR(50)
    CHECK (guardian_consent_status IN ('not_required', 'pending', 'approved', 'rejected')),
  guardian_verification_id UUID REFERENCES age_verification_sessions(id),

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  return_url TEXT,                          -- Where to redirect after verification

  -- Audit trail
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_age_verification_sessions_session_id
  ON age_verification_sessions(session_id);
CREATE INDEX idx_age_verification_sessions_visitor_widget
  ON age_verification_sessions(visitor_id, widget_id);
CREATE INDEX idx_age_verification_sessions_status
  ON age_verification_sessions(status);
CREATE INDEX idx_age_verification_sessions_expires_at
  ON age_verification_sessions(expires_at);

-- Comments
COMMENT ON TABLE age_verification_sessions IS 'Tracks age verification sessions via DigiLocker';
COMMENT ON COLUMN age_verification_sessions.state_token IS 'OAuth state parameter for CSRF protection';
COMMENT ON COLUMN age_verification_sessions.digilocker_access_token IS 'Encrypted access token (server-side only)';
```

#### 3.2.2 Guardian Consent Records

```sql
CREATE TABLE IF NOT EXISTS guardian_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to minor's verification
  minor_verification_id UUID NOT NULL REFERENCES age_verification_sessions(id),
  minor_visitor_id VARCHAR(255) NOT NULL,

  -- Guardian identification
  guardian_visitor_id VARCHAR(255),         -- Guardian's visitor ID after verification
  guardian_email VARCHAR(255),              -- Email for consent request
  guardian_phone VARCHAR(20),               -- Phone for SMS consent request

  -- Guardian verification (PRIVACY: DOB is NOT stored, only derived age)
  guardian_verification_session_id UUID REFERENCES age_verification_sessions(id),
  guardian_verified_age INTEGER,            -- Guardian's age (DOB discarded after calculation)

  -- Consent status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'viewed', 'approved', 'rejected', 'expired')),

  -- Consent details
  consent_given_at TIMESTAMP WITH TIME ZONE,
  consent_method VARCHAR(50),               -- 'email', 'sms', 'digilocker'
  relationship VARCHAR(100),                -- 'parent', 'guardian', 'other'

  -- Request tracking
  request_sent_at TIMESTAMP WITH TIME ZONE,
  request_token VARCHAR(255) UNIQUE,        -- Token for consent link
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Audit
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_guardian_consent_minor_verification
  ON guardian_consent_records(minor_verification_id);
CREATE INDEX idx_guardian_consent_status
  ON guardian_consent_records(status);
CREATE INDEX idx_guardian_consent_token
  ON guardian_consent_records(request_token);

-- Comments
COMMENT ON TABLE guardian_consent_records IS 'Stores guardian consent requests and approvals for minors';
```

#### 3.2.3 Update Widget Config Table

```sql
-- Add new columns to existing dpdpa_widget_configs
ALTER TABLE dpdpa_widget_configs
  -- Replace old age gate with verification requirement
  ADD COLUMN IF NOT EXISTS require_age_verification BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_verification_threshold INTEGER DEFAULT 18
    CHECK (age_verification_threshold >= 13 AND age_verification_threshold <= 21),
  ADD COLUMN IF NOT EXISTS age_verification_provider VARCHAR(50) DEFAULT 'digilocker'
    CHECK (age_verification_provider IN ('digilocker', 'apisetu', 'custom')),

  -- Minor handling
  ADD COLUMN IF NOT EXISTS minor_handling VARCHAR(50) DEFAULT 'block'
    CHECK (minor_handling IN ('block', 'guardian_consent', 'limited_access')),
  ADD COLUMN IF NOT EXISTS minor_guardian_message TEXT
    DEFAULT 'You must have parental consent to proceed. We will send a verification request to your guardian.',

  -- Verification expiry
  ADD COLUMN IF NOT EXISTS verification_validity_days INTEGER DEFAULT 365
    CHECK (verification_validity_days >= 1 AND verification_validity_days <= 365);

-- Comments
COMMENT ON COLUMN dpdpa_widget_configs.require_age_verification IS 'Enable government-backed age verification via DigiLocker';
COMMENT ON COLUMN dpdpa_widget_configs.minor_handling IS 'How to handle verified minors: block, guardian_consent, or limited_access';
```

### 3.3 API Routes Implementation

#### 3.3.1 Initiate Verification (`/api/dpdpa/age-verification/initiate/route.ts`)

**Purpose:** Start age verification session, generate DigiLocker redirect URL

**Request:**
```typescript
POST /api/dpdpa/age-verification/initiate
Body: {
  widgetId: string;
  visitorId: string;
  returnUrl: string;  // Where to redirect after verification
}
```

**Response:**
```typescript
{
  success: true,
  sessionId: string,
  redirectUrl: string,  // DigiLocker OAuth URL
  expiresAt: string     // ISO timestamp
}
```

**Implementation Steps:**
1. Validate widget exists and has `require_age_verification` enabled
2. Generate unique `session_id` and `state_token` (CSRF protection)
3. Store session in `age_verification_sessions` table
4. Call API Setu to get OAuth authorization URL:
   ```typescript
   const authUrl = `${APISETU_BASE_URL}/authorize?` +
     `response_type=code` +
     `&client_id=${APISETU_CLIENT_ID}` +
     `&redirect_uri=${encodeURIComponent(APISETU_REDIRECT_URI)}` +
     `&state=${state_token}` +
     `&scope=${DIGILOCKER_AGE_VERIFICATION_SCOPE}`;  // Scope as configured in API Setu approval (e.g., DL:AgeProof)
   ```
5. Return redirect URL to widget

**Rate Limiting:** 10 requests per minute per IP

#### 3.3.2 Callback Handler (`/api/dpdpa/age-verification/callback/route.ts`)

**Purpose:** Handle DigiLocker callback, exchange code for token, fetch age

**Request:**
```typescript
GET /api/dpdpa/age-verification/callback?code=xxx&state=yyy
```

**Implementation Steps:**
1. Validate `state` parameter matches stored `state_token` (CSRF check)
2. Exchange authorization `code` for access token:
   ```typescript
   POST ${APISETU_BASE_URL}/token
   Body: {
     grant_type: 'authorization_code',
     code: code,
     client_id: APISETU_CLIENT_ID,
     client_secret: APISETU_CLIENT_SECRET,
     redirect_uri: APISETU_REDIRECT_URI
   }
   ```
3. Fetch consented document attributes (DOB / age proof) from DigiLocker via consent artifact:
   ```typescript
   // Use consent artifact reference to fetch age verification attributes
   // The specific endpoint depends on API Setu approval and document type
   GET ${APISETU_BASE_URL}/pull/{consent_artifact_id}
   Headers: {
     Authorization: `Bearer ${access_token}`,
     'X-Consent-Artifact': consent_artifact_id
   }
   ```
4. Extract DOB from consent artifact response, calculate age
5. Update session record:
   - Set `status = 'verified'`
   - Store `verified_age` only (DOB is discarded after age calculation for privacy)
   - Store `document_type` for audit trail
   - **IMPORTANT:** Delete access token immediately after attribute retrieval (do not persist)
6. Decision logic:
   - **If age >= threshold:** Set status = 'verified', redirect to success
   - **If age < threshold:**
     - Check widget's `minor_handling` setting
     - If `block`: Set status = 'verified' but mark as minor (blocked)
     - If `guardian_consent`: Set `requires_guardian_consent = true`
7. Redirect user back to `return_url` with session token

**Security:**
- Validate state token (prevent CSRF)
- Encrypt access token before storing (AES-256)
- Never expose access token to client
- Set short session expiry (1 hour)

#### 3.3.3 Status Check (`/api/dpdpa/age-verification/status/route.ts`)

**Purpose:** Check verification status from widget

**Request:**
```typescript
GET /api/dpdpa/age-verification/status?sessionId=xxx
```

**Response:**
```typescript
{
  status: 'verified' | 'pending' | 'failed' | 'expired',
  verified: boolean,
  age: number | null,
  isMinor: boolean,
  requiresGuardianConsent: boolean,
  guardianConsentStatus: string | null,
  verificationAssertion: string | null,  // JWT for subsequent requests
  message: string
}
```

**Implementation:**
1. Look up session by `sessionId`
2. Check if session expired
3. Return appropriate status
4. Generate signed JWT `verificationAssertion` if verified

**Rate Limiting:** 60 requests per minute per session

#### 3.3.4 Guardian Consent Request (`/api/dpdpa/age-verification/guardian-consent/request/route.ts`)

**Purpose:** Send guardian consent request

**Request:**
```typescript
POST /api/dpdpa/age-verification/guardian-consent/request
Body: {
  sessionId: string,
  guardianEmail: string,
  guardianPhone?: string,
  relationship: 'parent' | 'guardian' | 'other'
}
```

**Implementation:**
1. Validate session exists and requires guardian consent
2. Generate unique `request_token`
3. Insert record into `guardian_consent_records`
4. Send email/SMS to guardian with verification link:
   ```
   https://consently.in/verify-guardian?token=xxx
   ```
5. Update session status to `guardian_consent_pending`

**Email Content:**
```
Subject: Parental Consent Required for [Site Name]

Dear Guardian,

A minor (age [X]) is attempting to provide consent on [domain].
Under DPDPA 2023, we require verifiable parental consent.

Please verify your identity and approve/reject:
[Verify via DigiLocker Button]

Link: https://consently.in/verify-guardian?token=xxx

This link expires in 24 hours.
```

#### 3.3.5 Guardian Verification (`/api/dpdpa/age-verification/guardian-consent/verify/route.ts`)

**Purpose:** Handle guardian's age verification

**IMPORTANT CLARIFICATION:** Guardian consent is NOT a separate DigiLocker product. It is simply another DigiLocker verification session for the guardian, which is then logically linked to the minor's verification session in our database. The guardian goes through the exact same DigiLocker OAuth flow as the minor did.

**Flow:**
1. Guardian clicks link with token
2. Validate token, load consent request
3. Redirect guardian to DigiLocker for their own age verification (same OAuth flow as minor)
4. After guardian verifies (via their own DigiLocker session):
   - Check guardian age >= 18
   - Check guardian age > minor age (sanity check)
5. Display consent approval UI
6. Guardian approves/rejects
7. Update `guardian_consent_records` status
8. Notify minor (if possible) via widget polling

### 3.4 API Setu Integration Library

Create reusable service: `/lib/apisetu-digilocker.ts`

```typescript
import crypto from 'crypto';

export class ApiSetuDigiLockerService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.baseUrl = process.env.APISETU_USE_SANDBOX === 'true'
      ? process.env.APISETU_SANDBOX_URL!
      : process.env.APISETU_BASE_URL!;
    this.clientId = process.env.APISETU_CLIENT_ID!;
    this.clientSecret = process.env.APISETU_CLIENT_SECRET!;
    this.redirectUri = process.env.APISETU_REDIRECT_URI!;
  }

  // Generate OAuth authorization URL
  generateAuthorizationUrl(state: string, scope: string[] = ['age_verification']): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: scope.join(' ')
    });
    return `${this.baseUrl}/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fetch consented document attributes (DOB/age) via consent artifact
  async getAgeVerificationAttributes(accessToken: string, consentArtifactId: string): Promise<AgeVerificationResponse> {
    const response = await fetch(`${this.baseUrl}/pull/${consentArtifactId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Consent-Artifact': consentArtifactId,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch age verification attributes: ${response.statusText}`);
    }

    const data = await response.json();

    // IMPORTANT: After fetching, the calling code should:
    // 1. Extract DOB and calculate age
    // 2. Discard DOB (store only derived age)
    // 3. Delete access token immediately

    return data;
  }

  // Encrypt access token for storage
  encryptToken(token: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.AGE_VERIFICATION_JWT_SECRET!, 'utf-8').slice(0, 32),
      crypto.randomBytes(16)
    );
    // Implementation details...
  }

  // Decrypt access token from storage
  decryptToken(encryptedToken: string): string {
    // Implementation details...
  }
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
}

interface AgeVerificationResponse {
  // Raw response from DigiLocker consent artifact
  // Note: We extract DOB, calculate age, then DISCARD DOB
  dob: string;  // Format: YYYY-MM-DD - DISCARDED after age calculation
  document_type: string;  // E.g., 'AADHAAR' - Kept for audit trail
  consent_artifact_id: string;  // Reference for audit

  // Note: We do NOT store name, gender, address, or any other PII
  // Only the derived age (integer) is persisted
}
```

### 3.5 Error Handling Strategy

**Error Categories:**

1. **User Errors (400s):**
   - Invalid session ID
   - Expired session
   - Missing required fields
   - Response: User-friendly error message

2. **API Setu Errors (502/503):**
   - DigiLocker service down
   - Token exchange failed
   - Response: "Government verification service temporarily unavailable"

3. **Rate Limiting (429):**
   - Too many requests
   - Response: "Please try again in [X] seconds"

4. **Server Errors (500s):**
   - Database connection failed
   - Encryption error
   - Response: Generic error, log detailed stack trace

**Retry Strategy:**
- Token exchange: Retry 3 times with exponential backoff
- User info fetch: Retry 2 times
- Database operations: No retry (fail fast)

---

## 4. Frontend Implementation Plan

### 4.1 Remove Existing Age Gate UI

**Files to Modify:**

1. **Dashboard UI** (`app/dashboard/dpdpa/widget/page.tsx`):
   - **REMOVE:** Lines 2545-2661 (Age Verification Gate section)
   - **REPLACE WITH:** New DigiLocker settings section:
     ```tsx
     {/* Age Verification via DigiLocker */}
     <div className="space-y-4">
       <h3>Age Verification (DigiLocker)</h3>
       <Toggle
         checked={config.requireAgeVerification}
         onChange={(val) => updateConfig('requireAgeVerification', val)}
       />
       <Select
         value={config.ageVerificationThreshold}
         options={[13, 16, 18, 21]}
         label="Minimum Age"
       />
       <Select
         value={config.minorHandling}
         options={['block', 'guardian_consent', 'limited_access']}
         label="Minor Handling"
       />
       {config.minorHandling === 'guardian_consent' && (
         <Textarea
           value={config.minorGuardianMessage}
           label="Guardian Consent Message"
         />
       )}
     </div>
     ```

2. **Widget Script** (`public/dpdpa-widget.js`):
   - **REMOVE:** Lines 289-402 (age gate functions)
   - **REMOVE:** Birth year dropdown UI (lines 1729-4124, search for "birth year")
   - **REMOVE:** Cookie lock logic (`checkMinorCookie`, `setMinorCookie`)
   - **REMOVE:** Device fingerprinting (not needed for government verification)

### 4.2 New Widget UI Components

#### Component 1: Age Verification Gate

**File:** `public/dpdpa-widget.js` (or refactor to React component)

```javascript
// Age Verification Gate
function renderAgeVerificationGate() {
  if (!widgetConfig.requireAgeVerification) {
    return renderConsentWidget();  // Skip verification if not required
  }

  // Check if already verified
  const verificationAssertion = localStorage.getItem(`consently_age_verified_${widgetId}`);
  if (verificationAssertion) {
    // Validate token with backend
    validateAgeVerification(verificationAssertion).then(valid => {
      if (valid) {
        return renderConsentWidget();
      } else {
        // Token expired or invalid, show verification again
        showAgeVerificationUI();
      }
    });
  } else {
    showAgeVerificationUI();
  }
}

function showAgeVerificationUI() {
  return `
    <div class="age-verification-gate">
      <div class="age-verification-header">
        <h2>Age Verification Required</h2>
        <p>This site requires government-verified age verification to proceed.</p>
      </div>

      <div class="age-verification-body">
        <div class="digilocker-info">
          <img src="/digilocker-logo.svg" alt="DigiLocker" />
          <p>We use DigiLocker to verify your age securely.</p>
          <ul>
            <li>✓ Your data stays private</li>
            <li>✓ We only receive your age, not full DOB</li>
            <li>✓ Approved by Government of India</li>
          </ul>
        </div>

        <button
          onclick="initiateAgeVerification()"
          class="digilocker-verify-btn"
        >
          <img src="/digilocker-icon.svg" />
          Verify via DigiLocker
        </button>

        <div class="verification-notice">
          <small>By verifying, you consent to share your age with ${widgetConfig.domain}</small>
        </div>
      </div>

      <div id="verification-status" class="hidden">
        <!-- Status messages displayed here -->
      </div>
    </div>
  `;
}
```

#### Component 2: Verification Flow Handler

```javascript
async function initiateAgeVerification() {
  showLoadingState('Connecting to DigiLocker...');

  try {
    // Call backend to initiate verification
    const response = await fetch(`${apiBaseUrl}/api/dpdpa/age-verification/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgetId: widgetConfig.widgetId,
        visitorId: getVisitorId(),
        returnUrl: window.location.href
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store session ID for later status checks
      sessionStorage.setItem('consently_verification_session', data.sessionId);

      // Redirect to DigiLocker
      window.location.href = data.redirectUrl;
    } else {
      showErrorState(data.message || 'Failed to initiate verification');
    }
  } catch (error) {
    showErrorState('Network error. Please check your connection and try again.');
  }
}

// Handle return from DigiLocker
function handleVerificationReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = sessionStorage.getItem('consently_verification_session');

  if (sessionId) {
    // Check verification status
    pollVerificationStatus(sessionId);
  }
}

async function pollVerificationStatus(sessionId, attempts = 0) {
  if (attempts > 20) {  // Max 20 attempts = 40 seconds
    showErrorState('Verification timed out. Please try again.');
    return;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/dpdpa/age-verification/status?sessionId=${sessionId}`
    );
    const data = await response.json();

    switch (data.status) {
      case 'verified':
        if (data.verified && !data.requiresGuardianConsent) {
          // Success - store verification token
          localStorage.setItem(`consently_age_verified_${widgetId}`, data.verificationAssertion);
          // Show consent widget
          renderConsentWidget();
        } else if (data.requiresGuardianConsent) {
          // Minor - show guardian consent flow
          showGuardianConsentFlow(sessionId, data);
        } else if (data.isMinor) {
          // Minor blocked
          showMinorBlockedMessage();
        }
        break;

      case 'pending':
      case 'in_progress':
        // Still processing, poll again
        setTimeout(() => pollVerificationStatus(sessionId, attempts + 1), 2000);
        break;

      case 'failed':
        showErrorState(data.message || 'Verification failed');
        break;

      case 'expired':
        showErrorState('Verification session expired. Please try again.');
        break;
    }
  } catch (error) {
    showErrorState('Failed to check verification status');
  }
}
```

#### Component 3: Guardian Consent Flow

```javascript
function showGuardianConsentFlow(sessionId, verificationData) {
  return `
    <div class="guardian-consent-flow">
      <div class="guardian-consent-header">
        <h3>Guardian Consent Required</h3>
        <p>You are under ${widgetConfig.ageVerificationThreshold} years old.</p>
        <p>${widgetConfig.minorGuardianMessage}</p>
      </div>

      <form id="guardian-consent-form" onsubmit="submitGuardianConsentRequest(event, '${sessionId}')">
        <div class="form-group">
          <label>Guardian's Email</label>
          <input
            type="email"
            name="guardianEmail"
            required
            placeholder="parent@example.com"
          />
        </div>

        <div class="form-group">
          <label>Guardian's Phone (Optional)</label>
          <input
            type="tel"
            name="guardianPhone"
            placeholder="+91 98765 43210"
          />
        </div>

        <div class="form-group">
          <label>Relationship</label>
          <select name="relationship" required>
            <option value="parent">Parent</option>
            <option value="guardian">Legal Guardian</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button type="submit" class="btn-primary">
          Send Consent Request
        </button>
      </form>

      <div id="guardian-consent-status" class="hidden">
        <!-- Status updates displayed here -->
      </div>
    </div>
  `;
}

async function submitGuardianConsentRequest(event, sessionId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  showLoadingState('Sending consent request to guardian...');

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/dpdpa/age-verification/guardian-consent/request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          guardianEmail: formData.get('guardianEmail'),
          guardianPhone: formData.get('guardianPhone'),
          relationship: formData.get('relationship')
        })
      }
    );

    const data = await response.json();

    if (data.success) {
      showSuccessState(`
        <h4>Consent request sent!</h4>
        <p>We've sent a verification link to ${formData.get('guardianEmail')}.</p>
        <p>Your guardian must verify their identity via DigiLocker and approve your request.</p>
        <p>You can close this page and return later.</p>
      `);

      // Start polling for guardian approval
      pollGuardianConsentStatus(sessionId);
    } else {
      showErrorState(data.message || 'Failed to send consent request');
    }
  } catch (error) {
    showErrorState('Network error. Please try again.');
  }
}
```

### 4.3 UX States & Messaging

#### State 1: Initial Load
- Display: "Loading age verification..."
- Action: Check if already verified via token

#### State 2: Verification Required
- Display: DigiLocker info + "Verify via DigiLocker" button
- Action: Initiate verification flow

#### State 3: Verification in Progress
- Display: "Verifying your age..."
- Action: Poll status endpoint

#### State 4: Verified Adult
- Display: Consent widget (normal flow)
- Store: Verification token in localStorage

#### State 5: Minor - Guardian Consent Required
- Display: Guardian consent form
- Action: Send consent request

#### State 6: Guardian Consent Pending
- Display: "Waiting for guardian approval..."
- Action: Poll guardian consent status

#### State 7: Guardian Consent Approved
- Display: Consent widget (with minor restrictions if configured)

#### State 8: Minor Blocked
- Display: Custom message from `minorGuardianMessage`
- Action: None (blocked)

#### State 9: Verification Failed
- Display: Error message + "Try Again" button
- Action: Restart verification

### 4.4 Accessibility Requirements

- **ARIA Labels:** All buttons and form fields must have descriptive labels
- **Keyboard Navigation:** All interactive elements must be keyboard accessible
- **Screen Reader Support:** Status messages must be announced via ARIA live regions
- **Color Contrast:** All text must meet WCAG AA standards (4.5:1 ratio)
- **Focus Indicators:** Clear focus states for all interactive elements
- **Error Messages:** Clear, actionable error messages

### 4.5 Mobile Responsiveness

- DigiLocker verification works on mobile (Meri Pehchaan supports mobile auth)
- Widget UI must adapt to small screens
- Guardian consent form must be mobile-friendly
- Deep linking support for guardian verification on mobile

---

## 5. Data Model Changes

### 5.1 New Tables Summary

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `age_verification_sessions` | Track verification attempts | session_id, visitor_id, status, verified_age |
| `guardian_consent_records` | Guardian approval tracking | minor_verification_id, guardian_email, status |

### 5.2 Schema Updates

#### Update Widget Config
- **Remove:** `enable_age_gate`, `age_gate_threshold`, `age_gate_minor_message`
- **Add:** `require_age_verification`, `age_verification_threshold`, `minor_handling`, `minor_guardian_message`, `verification_validity_days`

#### Update Consent Records
- **Add column:** `age_verification_id` (UUID, nullable, references `age_verification_sessions.id`)
- **Purpose:** Link consent records to age verification (audit trail)

```sql
ALTER TABLE dpdpa_consent_records
  ADD COLUMN IF NOT EXISTS age_verification_id UUID
    REFERENCES age_verification_sessions(id) ON DELETE SET NULL;

COMMENT ON COLUMN dpdpa_consent_records.age_verification_id IS
  'Links consent to age verification session for audit trail';
```

### 5.3 Data Migration Strategy

**Step 1: Add new columns (non-breaking)**
```sql
-- Runs in production without downtime
ALTER TABLE dpdpa_widget_configs
  ADD COLUMN require_age_verification BOOLEAN DEFAULT false;
-- ... other new columns
```

**Step 2: Migrate existing data**
```sql
-- Convert old age gate to new verification system
UPDATE dpdpa_widget_configs
SET
  require_age_verification = enable_age_gate,
  age_verification_threshold = age_gate_threshold,
  minor_guardian_message = age_gate_minor_message,
  minor_handling = 'block'  -- Conservative default
WHERE enable_age_gate = true;
```

**Step 3: Deprecate old columns (after deployment)**
```sql
-- Mark as deprecated (don't drop yet for rollback safety)
COMMENT ON COLUMN dpdpa_widget_configs.enable_age_gate IS
  'DEPRECATED: Use require_age_verification instead';
```

**Step 4: Remove old columns (after 30 days)**
```sql
ALTER TABLE dpdpa_widget_configs
  DROP COLUMN IF EXISTS enable_age_gate,
  DROP COLUMN IF EXISTS age_gate_threshold,
  DROP COLUMN IF EXISTS age_gate_minor_message;
```

### 5.4 Data Retention Policy

**Age Verification Sessions:**
- **Keep:** 90 days after verification
- **Reason:** Legal compliance, audit trail
- **PII Handling:**
  - DOB is NEVER stored (only `verified_age` integer is persisted)
  - `digilocker_access_token` → Deleted immediately after attribute retrieval (not persisted)
  - `consent_artifact_ref` → Keep (reference only, no PII)

**Guardian Consent Records:**
- **Keep:** Indefinitely (legal requirement for minor consent)
- **PII Handling:**
  - `guardian_email` → Hash after guardian approval
  - `guardian_phone` → Delete after approval

**Cleanup Job:**
```sql
-- Run daily via cron
DELETE FROM age_verification_sessions
WHERE expires_at < NOW() - INTERVAL '90 days';

-- Note: DOB is never stored, so no cleanup needed for DOB
-- Access tokens are deleted immediately after use, so no cleanup needed
-- This cleanup is for expired sessions only
```

---

## 6. Security & Compliance

### 6.1 Security Measures

#### OAuth Security
- **CSRF Protection:** Use unique `state` token for each session
- **Token Storage:** Encrypt access tokens with AES-256-GCM
- **Token Rotation:** Refresh tokens after 7 days
- **Secrets Management:** Store credentials in environment variables only

#### Session Security
- **Short Expiry:** Verification sessions expire after 1 hour
- **Rate Limiting:** 10 initiation requests per IP per minute
- **Replay Prevention:** Use nonce for callback validation
- **HTTPS Only:** All API calls must use HTTPS

#### Data Privacy
- **PII Minimization:** Only store derived age or age band; DOB is discarded immediately after age calculation
- **Access Token Deletion:** DigiLocker access tokens are deleted immediately after attribute retrieval (never persisted)
- **Encryption at Rest:** Encrypt all sensitive fields
- **Encryption in Transit:** TLS 1.3 for all API communication
- **No Client-Side Secrets:** Never expose API credentials to browser
- **Data Minimization Guarantee:** After verification, only the following is retained:
  - `verified_age` (integer)
  - `document_type` (e.g., "AADHAAR" - for audit trail only)
  - `verification_timestamp`
  - NO: DOB, name, address, or other PII from government documents

### 6.2 DPDPA 2023 Compliance

#### Verifiable Parental Consent (Section 9)
- ✓ Government-issued document verification (DigiLocker)
- ✓ Guardian identity verification (DigiLocker)
- ✓ Clear consent mechanism (approval UI)
- ✓ Audit trail (guardian_consent_records table)
- ✓ Revocation mechanism (can withdraw consent)

#### Data Subject Rights
- **Right to Access:** Users can view their verification status
- **Right to Deletion:** Can delete verification records (after consent withdrawal)
- **Right to Portability:** Export verification audit trail

### 6.3 Audit Trail Requirements

**What to Log:**
1. Every verification initiation (who, when, from where)
2. Every verification success/failure (outcome, reason)
3. Every guardian consent request (minor, guardian, timestamp)
4. Every guardian approval/rejection (decision, timestamp)
5. Every age verification token validation (usage tracking)

**Log Format:**
```json
{
  "event": "age_verification_initiated",
  "timestamp": "2026-01-27T12:34:56Z",
  "session_id": "abc123",
  "visitor_id": "xyz789",
  "widget_id": "dpdpa_example",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "threshold": 18,
    "minor_handling": "guardian_consent"
  }
}
```

**Log Storage:**
- Store in Supabase audit_logs table (if exists)
- Alternatively: Use `audit_trail` JSONB column in verification sessions
- Retention: 7 years (legal requirement)

### 6.4 Failure & Abuse Prevention

#### Abuse Scenarios

**Scenario 1: Multiple Verification Attempts**
- **Risk:** User tries different DOBs to bypass age check
- **Prevention:** DigiLocker returns verified DOB (cannot be changed)
- **Detection:** Rate limit by visitor_id (5 attempts per day)

**Scenario 2: Fake Guardian Consent**
- **Risk:** Minor uses fake email, approves own consent
- **Prevention:** Guardian must verify via DigiLocker (government ID required)
- **Detection:** Check guardian age > minor age + 18 years

**Scenario 3: Token Theft**
- **Risk:** Attacker steals verification token, uses for other visitors
- **Prevention:** Bind token to visitor_id + widget_id (JWT claims)
- **Detection:** Validate token visitor_id matches request

**Scenario 4: Replay Attacks**
- **Risk:** Attacker reuses old OAuth codes
- **Prevention:** API Setu invalidates codes after first use
- **Detection:** Track used codes in database (deduplicate)

**Scenario 5: DigiLocker API Downtime**
- **Risk:** Users cannot verify when service is down
- **Mitigation:**
  - Display clear error message: "Government verification service temporarily unavailable"
  - Allow retry after 5 minutes
  - Log incident for monitoring
- **Fallback:** No fallback to client-side (maintain security)

---

## 7. Migration & Rollout Strategy

### 7.1 Phased Rollout Plan

#### Phase 1: Backend Infrastructure (Week 1)
- Deploy new database tables (non-breaking)
- Deploy API routes (feature flagged, disabled by default)
- Set up API Setu sandbox integration
- Test end-to-end flow in sandbox

**Validation:**
- ✓ Tables created successfully
- ✓ API routes respond correctly
- ✓ Sandbox verification works

#### Phase 2: Dashboard UI Update (Week 2)
- Add new DigiLocker settings section
- Keep old age gate settings (parallel operation)
- Deploy to production (both systems coexist)

**Validation:**
- ✓ Old widgets continue working
- ✓ New settings saveable
- ✓ No breaking changes

#### Phase 3: Widget Update (Week 3)
- Deploy new widget JavaScript with DigiLocker integration
- Use feature flag: `require_age_verification` (defaults to false)
- Old widgets use old flow, new widgets use DigiLocker

**Validation:**
- ✓ Old widgets unaffected
- ✓ New widgets show DigiLocker option
- ✓ Verification flow works end-to-end

#### Phase 4: Migration Prompt (Week 4)
- Add banner in dashboard: "Upgrade to DigiLocker age verification for legal compliance"
- Provide migration guide
- Allow users to self-migrate (toggle setting)

**Validation:**
- ✓ Users can migrate without disruption
- ✓ Migration guide clear and accurate

#### Phase 5: Deprecation (Week 6)
- Announce deprecation of old age gate (30-day notice)
- Mark old settings as deprecated
- Provide automated migration tool

**Validation:**
- ✓ All active users notified
- ✓ Migration path clear

#### Phase 6: Removal (Week 10)
- Remove old age gate code from widget
- Remove old database columns
- Force migrate remaining users

**Validation:**
- ✓ No users on old system
- ✓ All widgets using DigiLocker or no verification

### 7.2 Feature Flags

Use environment variables for gradual rollout:

```bash
# Enable DigiLocker integration globally
ENABLE_DIGILOCKER_VERIFICATION=true

# Allow legacy age gate (during migration)
ALLOW_LEGACY_AGE_GATE=true  # Set to false after Week 6

# Sandbox mode (testing)
APISETU_USE_SANDBOX=true  # Set to false in production
```

Widget checks feature flag before rendering:

```javascript
if (widgetConfig.requireAgeVerification && ENABLE_DIGILOCKER_VERIFICATION) {
  renderDigiLockerVerification();
} else if (widgetConfig.enableAgeGate && ALLOW_LEGACY_AGE_GATE) {
  renderLegacyAgeGate();  // Old flow
} else {
  renderConsentWidget();  // No verification
}
```

### 7.3 Rollback Plan

**If critical issues arise:**

**Immediate Rollback (< 5 minutes):**
1. Set `ENABLE_DIGILOCKER_VERIFICATION=false`
2. Set `ALLOW_LEGACY_AGE_GATE=true`
3. Redeploy widget JavaScript (fallback to old code)

**Partial Rollback (specific widgets):**
```sql
-- Disable DigiLocker for specific widget
UPDATE dpdpa_widget_configs
SET require_age_verification = false, enable_age_gate = true
WHERE widget_id = 'problematic_widget_id';
```

**Data Preservation:**
- All verification sessions preserved (no data loss)
- Old age gate logic still functional
- Users experience seamless fallback

### 7.4 User Communication Plan

#### Email to Existing Users (Week 4)

**Subject:** Important: Upgrade to Government-Verified Age Verification

**Body:**
```
Dear [Company Name],

We're upgrading Consently's age verification to use DigiLocker,
India's official government document verification service.

Why upgrade?
✓ DPDPA 2023 compliant (legal requirement)
✓ Cannot be bypassed by users
✓ Government-backed identity verification
✓ Enhanced trust and credibility

Action Required:
1. Log in to your dashboard
2. Go to DPDPA Widget → Age Verification
3. Enable "DigiLocker Age Verification"
4. Configure minor handling (block or guardian consent)

Timeline:
- Now - Week 4: Optional upgrade
- Week 5: Recommended upgrade
- Week 8: Old age gate deprecated
- Week 10: Automatic migration for all users

Questions? Visit our guide: https://consently.in/docs/digilocker-migration

Best regards,
Consently Team
```

#### In-Dashboard Banner

```
⚠️ Action Required: Upgrade to DigiLocker Age Verification

Your current age gate is not legally compliant with DPDPA 2023.
[Upgrade Now] [Learn More] [Dismiss]
```

---

## 8. Risk Analysis & Edge Cases

### 8.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API Setu downtime | Users cannot verify | Medium | Display clear error, retry mechanism, monitoring |
| DigiLocker auth failure | Verification fails | Low | Retry with exponential backoff, fallback error message |
| Token expiry during flow | User must restart | Medium | Extend session expiry to 1 hour, clear messaging |
| Database connection failure | Cannot store verification | Low | Use connection pooling, retry logic, error logging |
| Rate limiting by API Setu | Users blocked | Low | Implement client-side throttling, queue requests |
| CSRF attack | Session hijacking | Low | Use unique state tokens, validate on callback |
| Token theft | Unauthorized access | Low | Bind tokens to visitor_id, short expiry, HTTPS only |

### 8.2 User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| User abandons during DigiLocker flow | Lost conversion | High | Clear messaging, save progress, allow return later |
| Guardian never responds | Minor stuck indefinitely | High | Send reminder emails, expire after 7 days, allow re-request |
| User doesn't have DigiLocker account | Cannot verify | Medium | Provide instructions for DigiLocker registration |
| Mobile redirect fails | User stranded on DigiLocker | Low | Test deep linking, fallback to manual return |
| Confusing UI states | User doesn't know what to do | Medium | Clear step-by-step instructions, progress indicators |

### 8.3 Edge Cases

#### Edge Case 1: User Turns 18 During Verification
**Scenario:** User is 17 when they start, turns 18 before completing.
**Solution:** Use verification timestamp, not current date. If verified as minor, stays minor until re-verification.

#### Edge Case 2: Guardian is Also a Minor
**Scenario:** User enters another minor's email as guardian.
**Solution:** Backend checks guardian age >= 18 after guardian verifies. If guardian is minor, reject consent request.

#### Edge Case 3: Multiple Guardian Consent Requests
**Scenario:** User sends requests to multiple guardians.
**Solution:** Allow multiple requests, first approval wins, invalidate others.

#### Edge Case 4: User Clears Browser Data Mid-Flow
**Scenario:** User clears localStorage during verification.
**Solution:** Session stored on server, widget polls backend with session_id from URL param.

#### Edge Case 5: Guardian Clicks Link After Expiry
**Scenario:** Guardian verifies after 7-day expiry.
**Solution:** Show clear message: "This request has expired. Please ask the minor to send a new request."

#### Edge Case 6: Different Browser/Device
**Scenario:** User starts on mobile, returns on desktop.
**Solution:**
- Use visitor_id (device fingerprint) OR email-based verification
- Store session_id in URL param for cross-device tracking
- Allow manual session lookup via Consent ID

#### Edge Case 7: API Setu Returns Ambiguous DOB
**Scenario:** API returns birth year only (no month/day).
**Solution:** Calculate age conservatively (assume birthday hasn't occurred this year).

#### Edge Case 8: User Has Multiple DigiLocker Accounts
**Scenario:** User tries different accounts to change age.
**Solution:** Store document_reference (masked Aadhaar), deduplicate by document.

---

## 9. Testing Strategy

### 9.1 API Setu Sandbox Testing

**Setup:**
1. Register for API Setu sandbox access: https://apisetu.gov.in/signup
2. Obtain sandbox credentials (client_id, client_secret)
3. Use sandbox base URL: `https://apisetu.gov.in/certificate/v3/sandbox`

**Test Scenarios:**

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Adult verification | DOB: 1990-01-01 | Age: 36, Status: verified |
| Minor verification (17) | DOB: 2009-01-01 | Age: 17, Status: verified, requiresGuardian: true |
| Minor verification (13) | DOB: 2013-01-01 | Age: 13, Status: verified, requiresGuardian: true |
| Edge age (18 today) | DOB: 2008-01-27 | Age: 18, Status: verified |
| Edge age (17 tomorrow) | DOB: 2008-01-28 | Age: 17, Status: verified, requiresGuardian: true |
| Invalid state token | Invalid state | Error: CSRF validation failed |
| Expired session | Old session_id | Error: Session expired |
| Token exchange failure | Invalid code | Error: Token exchange failed |

### 9.2 Unit Tests

**Backend Tests** (Jest + Supertest):

```typescript
// /tests/api/age-verification-initiate.test.ts
describe('POST /api/dpdpa/age-verification/initiate', () => {
  it('should create verification session', async () => {
    const response = await request(app)
      .post('/api/dpdpa/age-verification/initiate')
      .send({
        widgetId: 'test_widget',
        visitorId: 'test_visitor',
        returnUrl: 'https://example.com'
      });

    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBeDefined();
    expect(response.body.redirectUrl).toContain('apisetu.gov.in');
  });

  it('should reject invalid widget ID', async () => {
    const response = await request(app)
      .post('/api/dpdpa/age-verification/initiate')
      .send({
        widgetId: 'nonexistent',
        visitorId: 'test_visitor',
        returnUrl: 'https://example.com'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Invalid widget');
  });

  it('should enforce rate limiting', async () => {
    // Make 11 requests (limit is 10 per minute)
    for (let i = 0; i < 11; i++) {
      await request(app).post('/api/dpdpa/age-verification/initiate').send({
        widgetId: 'test_widget',
        visitorId: 'test_visitor',
        returnUrl: 'https://example.com'
      });
    }

    const response = await request(app)
      .post('/api/dpdpa/age-verification/initiate')
      .send({
        widgetId: 'test_widget',
        visitorId: 'test_visitor',
        returnUrl: 'https://example.com'
      });

    expect(response.status).toBe(429);
  });
});
```

### 9.3 Integration Tests

**End-to-End Flow Test:**

```typescript
describe('Complete Age Verification Flow', () => {
  it('should verify adult successfully', async () => {
    // Step 1: Initiate
    const initResponse = await initiateVerification();
    const { sessionId } = initResponse.body;

    // Step 2: Simulate DigiLocker callback
    const callbackResponse = await request(app)
      .get('/api/dpdpa/age-verification/callback')
      .query({
        code: 'sandbox_code_adult',
        state: getStateToken(sessionId)
      });

    expect(callbackResponse.status).toBe(302);  // Redirect

    // Step 3: Check status
    const statusResponse = await request(app)
      .get('/api/dpdpa/age-verification/status')
      .query({ sessionId });

    expect(statusResponse.body.status).toBe('verified');
    expect(statusResponse.body.verified).toBe(true);
    expect(statusResponse.body.age).toBeGreaterThanOrEqual(18);
    expect(statusResponse.body.verificationAssertion).toBeDefined();
  });

  it('should handle minor with guardian consent', async () => {
    // Step 1: Initiate
    const initResponse = await initiateVerification();
    const { sessionId } = initResponse.body;

    // Step 2: Simulate minor verification
    await simulateDigiLockerCallback(sessionId, { dob: '2010-01-01' });

    // Step 3: Check status (should require guardian)
    const statusResponse = await getVerificationStatus(sessionId);
    expect(statusResponse.body.requiresGuardianConsent).toBe(true);

    // Step 4: Request guardian consent
    const consentResponse = await request(app)
      .post('/api/dpdpa/age-verification/guardian-consent/request')
      .send({
        sessionId,
        guardianEmail: 'parent@example.com',
        relationship: 'parent'
      });

    expect(consentResponse.status).toBe(200);

    // Step 5: Simulate guardian verification
    const guardianToken = consentResponse.body.guardianToken;
    await simulateGuardianVerification(guardianToken, { dob: '1980-01-01' });

    // Step 6: Check final status
    const finalStatus = await getVerificationStatus(sessionId);
    expect(finalStatus.body.guardianConsentStatus).toBe('approved');
  });
});
```

### 9.4 Frontend Tests

**Widget UI Tests** (Playwright):

```typescript
test('should display DigiLocker verification button', async ({ page }) => {
  await page.goto('https://example.com?consentlyWidget=test');

  await expect(page.locator('.age-verification-gate')).toBeVisible();
  await expect(page.locator('.digilocker-verify-btn')).toBeVisible();
  await expect(page.locator('.digilocker-verify-btn')).toHaveText(/Verify via DigiLocker/);
});

test('should redirect to DigiLocker on button click', async ({ page }) => {
  await page.goto('https://example.com?consentlyWidget=test');
  await page.locator('.digilocker-verify-btn').click();

  // Wait for redirect
  await page.waitForURL(/apisetu.gov.in/);

  // Verify URL contains required OAuth params
  const url = new URL(page.url());
  expect(url.searchParams.get('response_type')).toBe('code');
  expect(url.searchParams.get('client_id')).toBeDefined();
  expect(url.searchParams.get('state')).toBeDefined();
});

test('should show guardian consent form for minors', async ({ page }) => {
  // Mock API responses
  await page.route('**/api/dpdpa/age-verification/status*', route => {
    route.fulfill({
      json: {
        status: 'verified',
        verified: true,
        age: 15,
        isMinor: true,
        requiresGuardianConsent: true
      }
    });
  });

  await page.goto('https://example.com?consentlyWidget=test');

  // Should show guardian consent form
  await expect(page.locator('.guardian-consent-flow')).toBeVisible();
  await expect(page.locator('input[name="guardianEmail"]')).toBeVisible();
});
```

### 9.5 Security Tests

**Penetration Testing Checklist:**

- [ ] CSRF token validation (try callback without state)
- [ ] OAuth code reuse (use same code twice)
- [ ] Session hijacking (use another user's session_id)
- [ ] Token tampering (modify JWT claims)
- [ ] SQL injection (malicious visitor_id)
- [ ] XSS in guardian message (script tags)
- [ ] Rate limit bypass (distributed IPs)
- [ ] Guardian age spoofing (minor as guardian)

---

## 10. Timeline & Dependencies

### 10.1 Estimated Timeline

| Phase | Duration | Tasks | Dependencies |
|-------|----------|-------|--------------|
| **Phase 0: Setup** | 3 days | - API Setu sandbox signup<br>- Credentials setup<br>- Environment preparation | API Setu approval |
| **Phase 1: Backend** | 7 days | - Database migrations<br>- API routes<br>- DigiLocker integration<br>- Unit tests | Phase 0 |
| **Phase 2: Dashboard UI** | 5 days | - New settings section<br>- UI updates<br>- Testing | Phase 1 |
| **Phase 3: Widget Update** | 7 days | - New verification UI<br>- Remove old age gate<br>- Testing | Phase 1, 2 |
| **Phase 4: Integration Testing** | 5 days | - End-to-end tests<br>- Sandbox testing<br>- Bug fixes | Phase 3 |
| **Phase 5: Production Deployment** | 3 days | - Production API Setu setup<br>- Deployment<br>- Monitoring | Phase 4 |
| **Phase 6: Migration** | 14 days | - User communication<br>- Gradual rollout<br>- Support | Phase 5 |
| **Phase 7: Deprecation** | 30 days | - Deprecation notice<br>- Forced migration<br>- Cleanup | Phase 6 |

**Total Duration:** ~10 weeks (assuming no major blockers)

### 10.2 Critical Dependencies

#### External Dependencies
1. **API Setu Account Approval** (1-3 days)
   - Required before any development
   - May require KYC/business verification

2. **API Setu Sandbox Access** (1 day)
   - Required for testing
   - May have usage limits

3. **API Setu Production Approval** (3-7 days)
   - Required before production deployment
   - May require security audit

#### Internal Dependencies
1. **Database Migration Authorization** (1 day)
   - Requires DBA approval for production migrations
   - Backup strategy must be approved

2. **Security Review** (3 days)
   - Penetration testing
   - Code review by security team
   - Compliance verification

3. **Legal Review** (2 days)
   - Privacy policy updates
   - Terms of service updates
   - DPDPA compliance verification

### 10.3 Resource Requirements

**Development Team:**
- 1 Backend Engineer (full-time, 4 weeks)
- 1 Frontend Engineer (full-time, 3 weeks)
- 1 QA Engineer (full-time, 2 weeks)
- 1 DevOps Engineer (part-time, 1 week)

**Support Team:**
- 1 Product Manager (oversight, full duration)
- 1 Legal/Compliance Advisor (1 week review)
- 1 Customer Success Manager (migration support, 6 weeks)

**Infrastructure:**
- Supabase database (existing)
- API Setu sandbox (free)
- API Setu production (check pricing)
- Additional monitoring (optional: Sentry, LogRocket)

---

## 11. Success Metrics

### 11.1 Technical Metrics

- **Verification Success Rate:** >95% of initiated verifications complete successfully
- **API Response Time:** <2s for initiation, <5s for callback processing
- **Uptime:** 99.9% availability for age verification API
- **Error Rate:** <1% of verification attempts result in errors
- **Guardian Approval Rate:** >60% of guardian consent requests approved within 24 hours

### 11.2 Business Metrics

- **Adoption Rate:** 80% of existing age gate users migrate within 30 days
- **User Drop-off:** <20% abandon during DigiLocker flow
- **Support Tickets:** <5% of verifications result in support tickets
- **Compliance:** 100% of age verifications legally auditable

### 11.3 Monitoring & Alerts

**Key Alerts:**
- API Setu downtime (>5 min) → Slack notification
- Verification failure rate >5% → Email alert
- Database connection errors → PagerDuty
- Rate limit exceeded → Log warning

**Dashboards:**
- Real-time verification status (pending/verified/failed)
- Guardian consent funnel (sent/viewed/approved)
- API performance metrics (latency, error rates)
- User adoption tracking (old vs new system)

---

## 12. Conclusion & Next Steps

### 12.1 Summary

This plan outlines a complete replacement of Consently's client-side age verification with a production-ready, government-backed system using DigiLocker (API Setu). The new system provides:

✓ **Legal Compliance:** DPDPA 2023 verifiable parental consent
✓ **Security:** Server-side verification, no client-side bypass
✓ **Auditability:** Complete verification and consent audit trail
✓ **User Experience:** Clear, step-by-step flow with guardian support
✓ **Flexibility:** Configurable minor handling (block/guardian/limited)

### 12.2 Immediate Next Steps

**Before Implementation:**
1. **Get Approval:** Review this plan with stakeholders
2. **API Setu Signup:** Register and obtain sandbox credentials
3. **Legal Review:** Confirm DPDPA compliance with legal advisor
4. **Budget Approval:** Confirm API Setu production costs
5. **Timeline Approval:** Confirm 10-week timeline is acceptable

**After Approval:**
1. Create implementation tasks in project management tool
2. Set up API Setu sandbox environment
3. Begin Phase 1 (Backend Infrastructure)
4. Schedule regular progress reviews

### 12.3 Open Questions

**To be resolved before implementation:**

1. **API Setu Pricing:** What is the cost per verification in production?
2. **Guardian SMS:** Should we support SMS in addition to email?
3. **Verification Expiry:** Is 365 days appropriate, or should it be shorter?
4. **Minor Limited Access:** What features are available to minors with guardian consent?
5. **Aadhaar Fallback:** What if user doesn't have Aadhaar? (DigiLocker supports other documents)
6. **International Users:** ✅ RESOLVED - Non-Indian users without DigiLocker access are blocked from providing consent on widgets requiring age verification. There is NO fallback to client-side checkbox. Site owners may configure a custom flow for international users, but Consently will not compromise verification integrity.
7. **Offline Verification:** No fallback for areas with poor internet. Clear error messaging is displayed.

### 12.4 Risks to Implementation

**High-Risk Factors:**
- API Setu production approval delayed (mitigate: apply early)
- DigiLocker service reliability issues (mitigate: monitoring, retry logic)
- User resistance to government ID verification (mitigate: clear communication)
- Guardian consent low response rate (mitigate: reminder emails, extend expiry)

**Mitigation Strategy:**
- Start with sandbox testing ASAP
- Maintain old system during migration (safe fallback)
- Monitor user feedback closely during rollout
- Have support team ready for migration questions

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | System Architecture | Initial comprehensive plan |

**Next Review Date:** After stakeholder approval

**Approval Required From:**
- [ ] CTO/Technical Lead
- [ ] Product Manager
- [ ] Legal/Compliance Team
- [ ] Customer Success Lead

---

**END OF IMPLEMENTATION PLAN**

For questions or clarifications, contact: [Your Team Contact]
