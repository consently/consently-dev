# Email Linking for Cross-Device Consent Management

## Overview

This document explains how the email linking feature works in Consently, enabling privacy-preserving cross-device consent management that complies with global privacy regulations (GDPR, DPDPA, CCPA).

## Problem Statement

Consent management systems face a fundamental challenge:
- **Anonymous tracking**: Users can only manage consent from the same browser (using Consent ID stored in localStorage/cookies)
- **Cross-device needs**: Users want to manage consent from multiple devices
- **Privacy requirements**: Tracking users across devices without consent is illegal

## Solution: Optional Email Linking

Our solution implements the globally-accepted dual approach:

### (a) Anonymous Consent (Default)
- **Identifier**: Consent ID stored in browser (`CNST-XXXX-XXXX-XXXX`)
- **Scope**: Single device/browser
- **Privacy**: Fully anonymous, no personal data
- **Limitation**: Users must manually enter Consent ID on new devices

### (b) Email-Based Linking (Optional)
- **Identifier**: SHA-256 hash of email address
- **Scope**: Cross-device for same email
- **Privacy**: Only hash stored, never plain text email
- **Requirement**: User must explicitly provide email with informed consent

## Implementation Details

### Database Schema

#### Migration: `26_add_optional_email_linking.sql`

Adds optional `visitor_email_hash` column to:
- `dpdpa_consent_records`
- `visitor_consent_preferences`

```sql
ALTER TABLE dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64) NULL;

ALTER TABLE visitor_consent_preferences 
ADD COLUMN IF NOT EXISTS visitor_email_hash VARCHAR(64) NULL;
```

**Key Points:**
- Column is nullable (optional)
- 64 characters for SHA-256 hash
- Indexed for performance
- Only populated when user provides email

### API Endpoints

#### 1. Consent Recording (`/api/dpdpa/consent-record`)

**Request Body:**
```json
{
  "widgetId": "widget_123",
  "visitorId": "CNST-4F7A-2K9E-8P3L",
  "consentStatus": "accepted",
  "acceptedActivities": ["activity-uuid-1", "activity-uuid-2"],
  "rejectedActivities": [],
  "visitorEmail": "user@example.com",  // OPTIONAL
  "metadata": { ... }
}
```

**Behavior:**
- If `visitorEmail` provided: hashes and stores `visitor_email_hash`
- If not provided: `visitor_email_hash` remains null
- Email never stored in plain text

#### 2. Privacy Centre Preferences (`/api/privacy-centre/preferences`)

**PATCH Request:**
```json
{
  "visitorId": "CNST-4F7A-2K9E-8P3L",
  "widgetId": "widget_123",
  "visitorEmail": "user@example.com",  // OPTIONAL
  "preferences": [
    { "activityId": "uuid-1", "consentStatus": "accepted" }
  ]
}
```

**Behavior:**
- Links email to consent preferences
- Enables cross-device preference management
- Syncs to both tables

#### 3. Email-Based Lookup (`/api/dpdpa/consent-by-email`)

**GET Request:**
```
GET /api/dpdpa/consent-by-email?email=user@example.com&widgetId=widget_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "visitor_id": "CNST-4F7A-2K9E-8P3L",
        "consent_id": "widget_123_CNST_...",
        "consent_status": "accepted",
        "consent_given_at": "2025-01-01T00:00:00Z",
        ...
      }
    ],
    "totalRecords": 1,
    "emailHash": "a1b2c3..."
  }
}
```

**POST Request (Revoke All):**
```json
{
  "email": "user@example.com",
  "widgetId": "widget_123",
  "action": "revoke",
  "reason": "User requested deletion"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revokedCount": 3,
    "revokedRecords": [...],
    "message": "Successfully revoked 3 consent record(s)"
  }
}
```

**Security Features:**
- Rate limiting (10 lookups/hour, 5 revocations/hour)
- Email format validation
- Prevents enumeration attacks
- Service role key for revocations

### Email Hashing

**Function:**
```typescript
function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}
```

**Properties:**
- **Algorithm**: SHA-256
- **Length**: 64 hexadecimal characters
- **Normalization**: Lowercase and trimmed
- **Deterministic**: Same email always produces same hash
- **One-way**: Cannot reverse hash to get email

### Data Flow

#### Scenario 1: Anonymous User (No Email)

```
User Visit (Device 1)
  ↓
Generate Consent ID: CNST-4F7A-2K9E-8P3L
  ↓
Store in localStorage
  ↓
Record consent (visitor_email_hash = null)
  ↓
User switches to Device 2
  ↓
Must manually enter Consent ID
  ↓
Retrieve consent by Consent ID
```

#### Scenario 2: User Provides Email

```
User Visit (Device 1)
  ↓
Generate Consent ID: CNST-4F7A-2K9E-8P3L
  ↓
User provides email: user@example.com
  ↓
Hash email: a1b2c3d4e5f6...
  ↓
Store both: visitor_id + visitor_email_hash
  ↓
User switches to Device 2
  ↓
User enters email in Privacy Centre
  ↓
Lookup by email hash
  ↓
Find all consent records
  ↓
Can manage/revoke from any device
```

## Compliance & Privacy

### GDPR Compliance

✅ **Lawful basis**: Consent (Article 6(1)(a))
- User explicitly provides email
- Purpose clearly stated ("for cross-device consent management")
- Can be withdrawn at any time

✅ **Data minimization** (Article 5(1)(c))
- Only stores hash, not actual email
- Hash only used for linking, not identification

✅ **Right to erasure** (Article 17)
- `/api/dpdpa/consent-by-email` POST with action='revoke'
- Revokes all consents linked to email

### DPDPA Compliance

✅ **Notice and Consent** (Section 6)
- User informed before email collection
- Explicit opt-in required

✅ **Purpose Limitation** (Section 4)
- Email hash only used for consent management
- Not shared or used for marketing

### CCPA Compliance

✅ **Right to Delete** (Section 1798.105)
- Email-based revocation API
- Deletes all linked records

## User Experience

### Widget Integration

Users can optionally provide email when:
1. Giving initial consent
2. Managing preferences in Privacy Centre
3. Submitting data subject rights requests

### Benefits to Users

**With Email Linking:**
- Manage consent from any device
- One-click revocation across all devices
- Consistent consent state

**Without Email Linking:**
- Full anonymity
- No email required
- Manual Consent ID entry for cross-device

## Security Considerations

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Email Lookup | 10 requests | 1 hour |
| Email Revocation | 5 requests | 1 hour |
| Consent Recording | 100 requests | 1 minute |

### Attack Prevention

1. **Email Enumeration**: Rate limiting prevents checking if emails exist
2. **Hash Rainbow Tables**: SHA-256 with normalization makes precomputation difficult
3. **Replay Attacks**: Service role key required for modifications
4. **CSRF**: CORS configured for widget domains only

### Data Storage

| Location | Data Type | Purpose |
|----------|-----------|---------|
| `dpdpa_consent_records.visitor_email_hash` | SHA-256 hash | Link consents |
| `visitor_consent_preferences.visitor_email_hash` | SHA-256 hash | Link preferences |
| **NEVER STORED** | Plain text email | Privacy |

## Testing

### Test Cases

1. **Anonymous Consent**
   - Create consent without email
   - Verify `visitor_email_hash` is null
   - Verify consent works normally

2. **Email Consent**
   - Create consent with email
   - Verify hash is stored
   - Verify hash format (64 hex chars)

3. **Cross-Device Lookup**
   - Create consent on Device 1 with email
   - Lookup by email from Device 2
   - Verify all records returned

4. **Revocation**
   - Create multiple consents with same email
   - Revoke by email
   - Verify all revoked
   - Verify preferences withdrawn

5. **Rate Limiting**
   - Exceed lookup limit
   - Verify 429 response
   - Verify retry-after header

### Sample Test Script

```bash
# 1. Create consent with email
curl -X POST https://your-domain.com/api/dpdpa/consent-record \
  -H "Content-Type: application/json" \
  -d '{
    "widgetId": "test_widget",
    "visitorId": "CNST-TEST-1234-ABCD",
    "consentStatus": "accepted",
    "acceptedActivities": ["uuid-1"],
    "rejectedActivities": [],
    "visitorEmail": "test@example.com"
  }'

# 2. Lookup by email
curl "https://your-domain.com/api/dpdpa/consent-by-email?email=test@example.com&widgetId=test_widget"

# 3. Revoke by email
curl -X POST https://your-domain.com/api/dpdpa/consent-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "widgetId": "test_widget",
    "action": "revoke",
    "reason": "Testing revocation"
  }'
```

## Migration Guide

### Existing Deployments

1. **Run migration**
   ```bash
   # Apply migration 26
   supabase db push
   ```

2. **No breaking changes**
   - Existing consents continue to work
   - Email linking is optional
   - Backwards compatible

3. **Update widgets** (optional)
   - Add email input field
   - Update consent recording calls

### Rollback Plan

If needed, remove email columns:
```sql
ALTER TABLE dpdpa_consent_records DROP COLUMN IF EXISTS visitor_email_hash;
ALTER TABLE visitor_consent_preferences DROP COLUMN IF EXISTS visitor_email_hash;
```

## FAQ

**Q: Is email linking required?**
A: No, it's completely optional. Users can remain anonymous.

**Q: Can users revoke email linking?**
A: Yes, via the revocation API or by contacting support.

**Q: Does this change existing consents?**
A: No, existing consents remain unchanged (`visitor_email_hash` is null).

**Q: What if user changes email?**
A: Old email hash remains. New email creates new hash. User manages both separately or can request consolidation.

**Q: Can we reverse the hash to get the email?**
A: No, SHA-256 is one-way. We cannot retrieve the original email.

**Q: How do we handle data subject rights requests?**
A: Use the rights request API which stores actual email (with explicit consent) for communication purposes.

## Related Documentation

- [Consent ID System](./CONSENT_ID_SYSTEM.md)
- [Privacy Centre](./PRIVACY_CENTRE.md)
- [DPDPA Compliance](../architecture/DPDPA_COMPLIANCE.md)
- [Security Architecture](../architecture/SECURITY.md)

## Changelog

### v3.1.0 (2025-11-19)
- ✨ Added optional email linking
- ✨ Created email lookup/revocation API
- 🔒 Implemented SHA-256 hashing
- 📝 Full privacy compliance documentation

