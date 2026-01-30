# DigiLocker / NSSO Age Verification Integration Guide

## Overview

This document describes the **canonical integration** with **NSSO (Meri Pehchaan)** and **DigiLocker** for government-backed age verification and guardian consent under **DPDPA 2023**.

## Table of Contents

1. [Understanding NSSO vs DigiLocker](#understanding-nsso-vs-digilocker)
2. [Canonical Authorize URL Parameters](#canonical-authorize-url-parameters)
3. [Why PAN/KYC Screens Appear](#why-pankyc-screens-appear)
4. [Complete Flow Diagrams](#complete-flow-diagrams)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Validation](#testing--validation)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Understanding NSSO vs DigiLocker

### What is NSSO (Meri Pehchaan)?

**NSSO (National Single Sign-On)**, branded as **Meri Pehchaan**, is India's unified authentication gateway operated by MeitY.

- **Purpose**: Single sign-on for government and private services
- **URL**: `https://digilocker.meripehchaan.gov.in`
- **Function**: Dynamically determines authentication journeys based on app requirements

### What is DigiLocker?

**DigiLocker** is India's official digital documents service.

- **Purpose**: Store and verify government documents (Aadhaar, PAN, DL, etc.)
- **Integration**: Used by NSSO for identity assurance
- **Privacy**: Provides privacy-preserving age verification (yes/no, not DOB)

### The Relationship

```
Your App → NSSO (Meri Pehchaan) → DigiLocker → Identity Verification
                                 ↓
                            Profile Upgrade (PAN/KYC if needed)
                                 ↓
                            Age Verification Service (AVS)
                                 ↓
                          Callback to Your App
```

**Key Point**: NSSO decides which screens to show based on:
- Your authorize URL parameters
- User's account state
- Government policy requirements

---

## Canonical Authorize URL Parameters

### ✅ REQUIRED Parameters (DO NOT CHANGE)

```
BASE URL: https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize

PARAMETERS:
?response_type=code                 # OAuth 2.0 authorization code flow
&client_id=YOUR_CLIENT_ID           # Your API Setu client ID
&redirect_uri=YOUR_CALLBACK_URL     # Your registered callback URL
&scope=openid                       # MUST be 'openid' (NOT 'avs')
&state=RANDOM_SECURE_STRING         # CSRF protection token
&code_challenge=PKCE_CHALLENGE      # SHA-256 hash of code_verifier
&code_challenge_method=S256         # PKCE method
&dl_flow=signin                     # Forces login flow (NOT 'aadhaar' or 'signup')
&acr=digilocker                     # Authentication context: DigiLocker-backed
&amr=all                            # Allow all auth methods (mobile, DigiLocker, etc.)
&pla=Y                              # Profile Level Assurance = YES (REQUIRED for age + guardian)
```

### ❌ INCORRECT Values (Common Mistakes)

| Parameter | ❌ Wrong | ✅ Correct |
|-----------|---------|-----------|
| `scope` | `avs`, `avs_parent` | `openid` |
| `acr` | `opus_er_alias+mobile+user_alias+email+aadhaar+pan+...` | `digilocker` |
| `amr` | `mobile`, `aadhaar` | `all` |
| `pla` | `N`, (missing) | `Y` |
| `dl_flow` | `aadhaar`, `signup` | `signin` |

### 📝 Parameter Explanations

#### `scope=openid`

- **Purpose**: Standard OAuth/OIDC scope for authentication
- **Why NOT 'avs'**: `avs` is used for the **AVS endpoint** (`/avs`), NOT the authorize URL
- **Effect**: Tells NSSO this is an authentication flow

#### `acr=digilocker`

- **Purpose**: Signals NSSO that app requires DigiLocker-backed identity assurance
- **Effect**: Enables AVS + guardian flows, triggers profile upgrades if needed
- **Why simple value**: Complex ACR values cause unpredictable NSSO behavior

#### `amr=all`

- **Purpose**: Allow NSSO to choose authentication methods
- **Methods**: Mobile OTP, Username, DigiLocker auth, Guardian auth
- **Effect**: Restricting this breaks guardian flows

#### `pla=Y`

- **Purpose**: Profile Level Assurance = YES
- **Effect**: NSSO is **allowed** to:
  - Request PAN verification
  - Request Aadhaar linking
  - Require profile upgrades
- **CRITICAL**: This is **MANDATORY** for age + guardian apps
- **Cannot be disabled**: Government policy requirement

#### `dl_flow=signin`

- **Purpose**: Forces login flow for DigiLocker-based apps
- **Effect**: Ensures proper authentication journey
- **Alternatives**: `aadhaar` (Aadhaar-only), `signup` (registration) - NOT for age verification

---

## Why PAN/KYC Screens Appear

### Expected Screen

When users see:

```
"Age Verification and Guardian Consent application needs more
details to verify your identity. Please provide your PAN/Aadhaar details."
```

**This is NOT an error. This is EXPECTED behavior.**

### Why This Happens

1. **Profile Assurance Upgrade**: DigiLocker requires higher identity assurance for age + guardian apps
2. **PAN-Aadhaar Linking**: Government requires linking for identity verification
3. **DPDPA 2023 Compliance**: Verifiable parental consent requires strong identity assurance
4. **One-Time Process**: Required only once per DigiLocker account

### What NSSO Does

NSSO dynamically decides to show PAN/KYC screens when **ANY** of these are true:

- ✅ DigiLocker account is not fully verified
- ✅ Aadhaar / PAN linkage is incomplete
- ✅ Guardian identity assurance level < required ACR
- ✅ `pla=Y` is set (which it MUST be for age + guardian)

### Privacy Guarantee

Even though PAN is requested:

- ✅ PAN is **only shared with DigiLocker** (government service)
- ✅ PAN is **NOT shared** with your website
- ✅ Date of birth (DOB) is **never stored**
- ✅ Only verified age (e.g., "18") is shared with your app

---

## Complete Flow Diagrams

### Adult User (≥ threshold)

```
1. User clicks "Verify Age"
2. App → NSSO authorize URL (with canonical params)
3. NSSO → User login (Mobile OTP / Username)
4. NSSO → DigiLocker identity check
   ├─ If profile incomplete → PAN/KYC screen (one-time)
   └─ If profile complete → Skip to AVS
5. NSSO → AVS endpoint check (threshold_age=18)
6. AVS → Returns "yes" (age ≥ 18)
7. NSSO → Callback to app with authorization code
8. App → Exchange code for token (PKCE)
9. App → Call AVS endpoint (privacy-preserving)
10. App → Store verified_age (NOT DOB)
11. App → Return verification assertion JWT
12. User → Proceeds to age-gated content
```

### Minor User (< threshold) + Guardian Consent

```
1. Minor clicks "Verify Age"
2. App → NSSO authorize URL (canonical params)
3. NSSO → Minor login + DigiLocker verification
   └─ May show PAN/KYC screen if needed
4. AVS → Returns "no" (age < 18)
5. App → Detects minor, requests guardian email
6. App → Sends guardian consent email
7. Guardian → Clicks verification link
8. App → NSSO authorize URL (for guardian)
9. NSSO → Guardian login + DigiLocker verification
   └─ May show PAN/KYC screen if needed
10. AVS → Returns guardian age (must be ≥ 18)
11. Guardian → Sees approve/reject options
12. Guardian → Approves consent
13. App → Validates: guardian age ≥ 18, guardian age > minor age
14. App → Updates consent record + minor's session
15. Minor → Can now proceed
```

---

## Environment Configuration

### Production Configuration (.env.local)

```bash
# API Setu Credentials (from https://partners.apisetu.gov.in)
APISETU_CLIENT_ID=XK19761845
APISETU_CLIENT_SECRET=bb2d251ec2d17311da13
APISETU_REDIRECT_URI=https://www.consently.in/api/auth/meripehchaan/callback

# NSSO/MeriPehchaan Base URLs (CRITICAL: Use meripehchaan.gov.in)
DIGILOCKER_OAUTH_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1
APISETU_BASE_URL=https://digilocker.meripehchaan.gov.in/public/oauth2/1

# NSSO Parameters (DO NOT CHANGE - Canonical Values)
DIGILOCKER_AGE_VERIFICATION_SCOPE=openid
DIGILOCKER_ACR=digilocker
DIGILOCKER_AMR=all
DIGILOCKER_PLA=Y
DIGILOCKER_DL_FLOW=signin

# Security
AGE_VERIFICATION_JWT_SECRET=your-secure-32-byte-secret

# Mode Control
APISETU_USE_MOCK=false
APISETU_USE_SANDBOX=false
```

### Sandbox/Testing Configuration

```bash
# Sandbox URLs (for testing)
DIGILOCKER_SANDBOX_OAUTH_URL=https://api.sandbox.digitallocker.gov.in/public/oauth2/1
APISETU_SANDBOX_URL=https://api.sandbox.digitallocker.gov.in/public/oauth2/1

# Enable sandbox mode
APISETU_USE_SANDBOX=true
```

### Mock Mode (Development)

```bash
# Enable mock mode (bypasses real DigiLocker)
APISETU_USE_MOCK=true

# Mock authorization codes available:
# - mock_adult_code (age 30)
# - mock_minor_code (age 15)
# - mock_edge_18_code (exactly 18)
# - mock_edge_17_code (17 years 364 days)
```

---

## Testing & Validation

### Pre-Launch Checklist

- [ ] Verify `scope=openid` (NOT `avs`)
- [ ] Verify `acr=digilocker` (NOT complex string)
- [ ] Verify `amr=all`
- [ ] Verify `pla=Y`
- [ ] Test PAN/KYC screen appearance (expected)
- [ ] Test guardian flow end-to-end
- [ ] Verify DOB is NEVER stored (only age)
- [ ] Test session expiry (1 hour)
- [ ] Test guardian consent expiry (7 days)

### Sandbox Testing Steps

1. **Set up sandbox credentials** at API Setu dashboard
2. **Enable sandbox mode** in `.env.local`
3. **Test adult flow**:
   - Complete PAN/KYC upgrade (one-time)
   - Verify age verification succeeds
   - Verify only age is stored
4. **Test minor flow**:
   - Verify minor detected correctly
   - Test guardian email sending
   - Test guardian verification (with PAN/KYC)
   - Test guardian approval/rejection
5. **Test error cases**:
   - Session expiry
   - Invalid state token
   - Missing authorization code
   - Guardian age < 18

### Monitoring in Production

Monitor these metrics:

- **Verification success rate**: Should be >90% after PAN/KYC one-time setup
- **PAN/KYC screen appearance**: ~30-50% of first-time users (expected)
- **Session expiry rate**: Should be <5%
- **Guardian consent approval rate**: Varies by use case

---

## Common Issues & Solutions

### Issue: "PAN/Aadhaar details don't match"

**Cause**: User's PAN and Aadhaar are not linked in government database

**Solution**:
1. Link PAN-Aadhaar on Income Tax e-filing portal
2. Wait 24-48 hours for database sync
3. Retry age verification

**App Action**: Display clear error message with link to help page

---

### Issue: Users confused by PAN screen

**Cause**: Users think PAN request is an error

**Solution**:
1. ✅ Show `DigiLockerVerificationNotice` component BEFORE redirect
2. ✅ Add "What to expect" messaging
3. ✅ Link to help page (`/help/digilocker-age-verification`)
4. ✅ Add FAQ explaining PAN requirement

**Example**:
```tsx
import DigiLockerVerificationNotice from '@/components/DigiLockerVerificationNotice';

<DigiLockerVerificationNotice variant="warning" />
<button onClick={handleVerification}>Verify Age</button>
```

---

### Issue: Random NSSO behavior (different screens each time)

**Cause**: Using incorrect ACR or other non-canonical parameters

**Solution**:
1. ✅ Verify `acr=digilocker` (NOT complex string)
2. ✅ Verify all canonical parameters
3. ✅ Check environment variables match `.env.example`

---

### Issue: Guardian flow not working

**Cause**: Missing `pla=Y` or `amr` restrictions

**Solution**:
1. ✅ Ensure `pla=Y` is set
2. ✅ Ensure `amr=all` is set
3. ✅ Test guardian verification separately

---

### Issue: Verification fails silently

**Cause**: Session expired or state token mismatch

**Solution**:
1. ✅ Sessions expire after 1 hour - prompt user to retry
2. ✅ Ensure state token is stored and validated correctly
3. ✅ Check PKCE code verifier is not lost

---

### Issue: DOB being stored (compliance violation)

**Cause**: Using legacy `/user` endpoint instead of AVS

**Solution**:
1. ✅ Use `/avs` endpoint with `threshold_age` parameter
2. ✅ Never store `dob` field - only `verified_age`
3. ✅ Audit database schema - no DOB columns

---

## Implementation Checklist

### Code Changes

- [x] Update `lib/apisetu-digilocker.ts`:
  - [x] Set `scope` default to `openid`
  - [x] Set `acr` default to `digilocker`
  - [x] Add comments about canonical parameters

### Environment Variables

- [x] Update `.env.example`:
  - [x] Document canonical NSSO parameters
  - [x] Add warnings about not changing values
  - [x] Fix base URLs to use `meripehchaan.gov.in`

### UX Components

- [x] Create `DigiLockerVerificationNotice` component
- [x] Create help page (`/help/digilocker-age-verification`)
- [x] Update error page with PAN/KYC-specific errors
- [x] Add help links to error pages

### Documentation

- [x] Create this integration guide
- [x] Document PAN/KYC expectations
- [x] Add troubleshooting section

### Testing

- [ ] Test with canonical parameters in sandbox
- [ ] Verify PAN/KYC screens appear
- [ ] Complete full guardian flow in sandbox
- [ ] Verify DOB is never stored
- [ ] Test all error scenarios

---

## Resources

- **API Setu Dashboard**: https://partners.apisetu.gov.in
- **DigiLocker Official**: https://www.digilocker.gov.in
- **DPDPA 2023 Act**: https://www.meity.gov.in/dpdpa2023
- **Consently Help**: /help/digilocker-age-verification
- **Consently Support**: /contact

---

## Support

For technical issues:
- **DigiLocker Support**: https://digilocker.gov.in/help
- **API Setu Support**: partners.apisetu.gov.in (dashboard)
- **Consently Support**: /contact

For compliance questions:
- Review DPDPA 2023 guidelines
- Consult legal counsel for industry-specific requirements

---

**Last Updated**: 2026-01-30
**Version**: 1.0
**Author**: Consently Engineering Team
