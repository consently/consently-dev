# Consent Revocation - Verification & Testing Guide

This guide helps you verify that consent revocation is working properly after the fix.

---

## Quick Health Check

### 1. Database Query - Check Current State

```sql
-- Check all revoked consents and their audit data
SELECT 
  COUNT(*) as total_revoked,
  COUNT(revoked_at) as with_timestamp,
  COUNT(revocation_reason) as with_reason,
  COUNT(*) FILTER (WHERE revoked_at IS NULL) as missing_timestamp,
  COUNT(*) FILTER (WHERE revocation_reason IS NULL) as missing_reason
FROM dpdpa_consent_records
WHERE consent_status = 'revoked';
```

**Expected Result:**
- `with_timestamp` should equal `total_revoked`
- `with_reason` should equal `total_revoked`
- `missing_timestamp` should be 0
- `missing_reason` should be 0

---

## Detailed Verification

### Test 1: Widget Direct Revocation

**Scenario:** User revokes consent via the widget

#### Setup Test Data
```javascript
const testData = {
  widgetId: "dpdpa_test_widget",
  visitorId: "CNST-TEST-1234-5678",
  consentStatus: "revoked",
  acceptedActivities: [],
  rejectedActivities: [],
  activityConsents: {},
  metadata: {
    userAgent: "Mozilla/5.0 (Test)",
    deviceType: "Desktop",
    currentUrl: "https://example.com/test"
  }
};
```

#### Make API Call
```bash
curl -X POST http://localhost:3000/api/dpdpa/consent-record \
  -H "Content-Type: application/json" \
  -d '{
    "widgetId": "dpdpa_test_widget",
    "visitorId": "CNST-TEST-1234-5678",
    "consentStatus": "revoked",
    "acceptedActivities": [],
    "rejectedActivities": [],
    "activityConsents": {}
  }'
```

#### Verify in Database
```sql
-- Check the consent record
SELECT 
  consent_id,
  consent_status,
  revoked_at,
  revocation_reason,
  created_at,
  updated_at
FROM dpdpa_consent_records
WHERE visitor_id = 'CNST-TEST-1234-5678'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
consent_status: 'revoked'
revoked_at: <timestamp> (should be set to NOW)
revocation_reason: 'User revoked consent via widget'
```

#### Verify Preferences Sync
```sql
-- Check visitor preferences were updated
SELECT 
  activity_id,
  consent_status,
  last_updated
FROM visitor_consent_preferences
WHERE visitor_id = 'CNST-TEST-1234-5678'
  AND widget_id = 'dpdpa_test_widget';
```

**Expected Result:**
- All preferences should have `consent_status = 'withdrawn'`
- `last_updated` should be recent

---

### Test 2: Widget with Custom Revocation Reason

**Scenario:** Widget provides a custom reason for revocation

#### Make API Call
```bash
curl -X POST http://localhost:3000/api/dpdpa/consent-record \
  -H "Content-Type: application/json" \
  -d '{
    "widgetId": "dpdpa_test_widget",
    "visitorId": "CNST-TEST-2345-6789",
    "consentStatus": "revoked",
    "acceptedActivities": [],
    "rejectedActivities": [],
    "activityConsents": {},
    "revocationReason": "User clicked Do Not Sell My Information button"
  }'
```

#### Verify in Database
```sql
SELECT 
  consent_status,
  revoked_at,
  revocation_reason
FROM dpdpa_consent_records
WHERE visitor_id = 'CNST-TEST-2345-6789'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
revocation_reason: 'User clicked Do Not Sell My Information button'
```

---

### Test 3: Preference Centre PATCH (Partial Withdrawal)

**Scenario:** User withdraws some but not all consents

#### Make API Call
```bash
curl -X PATCH http://localhost:3000/api/privacy-centre/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "CNST-TEST-3456-7890",
    "widgetId": "dpdpa_test_widget",
    "preferences": [
      {"activityId": "uuid-activity-1", "consentStatus": "withdrawn"},
      {"activityId": "uuid-activity-2", "consentStatus": "accepted"}
    ]
  }'
```

#### Verify in Database
```sql
-- Check consent record (should be partial, NOT revoked)
SELECT 
  consent_status,
  revoked_at,
  revocation_reason,
  consented_activities,
  rejected_activities
FROM dpdpa_consent_records
WHERE visitor_id = 'CNST-TEST-3456-7890'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
consent_status: 'partial' (not revoked because one was accepted)
revoked_at: NULL (not a full revocation)
revocation_reason: NULL
```

---

### Test 4: Preference Centre PATCH (Full Withdrawal)

**Scenario:** User withdraws ALL consents via preference centre

#### Make API Call
```bash
curl -X PATCH http://localhost:3000/api/privacy-centre/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "CNST-TEST-4567-8901",
    "widgetId": "dpdpa_test_widget",
    "preferences": [
      {"activityId": "uuid-activity-1", "consentStatus": "withdrawn"},
      {"activityId": "uuid-activity-2", "consentStatus": "withdrawn"}
    ]
  }'
```

#### Verify in Database
```sql
-- Check consent record (should be revoked)
SELECT 
  consent_status,
  revoked_at,
  revocation_reason,
  consented_activities,
  rejected_activities
FROM dpdpa_consent_records
WHERE visitor_id = 'CNST-TEST-4567-8901'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
consent_status: 'revoked' (all withdrawn = revoked)
revoked_at: <timestamp> (should be set)
revocation_reason: 'User withdrew all consent via preference centre'
```

---

### Test 5: Preference Centre DELETE

**Scenario:** User uses DELETE endpoint to withdraw all

#### Make API Call
```bash
curl -X DELETE 'http://localhost:3000/api/privacy-centre/preferences?visitorId=CNST-TEST-5678-9012&widgetId=dpdpa_test_widget'
```

#### Verify in Database
```sql
-- Check preferences were updated
SELECT 
  activity_id,
  consent_status
FROM visitor_consent_preferences
WHERE visitor_id = 'CNST-TEST-5678-9012';

-- Check consent record was created
SELECT 
  consent_status,
  revoked_at,
  revocation_reason,
  consent_details
FROM dpdpa_consent_records
WHERE visitor_id = 'CNST-TEST-5678-9012'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
Preferences: All consent_status = 'withdrawn'
Consent Record:
  consent_status: 'revoked'
  revoked_at: <timestamp>
  revocation_reason: 'User withdrew all consent via preference centre (DELETE)'
  consent_details.metadata.source: 'preference_centre_delete'
```

---

## Automated Testing Script

```bash
#!/bin/bash
# Save as: test-revocation.sh

API_BASE="http://localhost:3000"
WIDGET_ID="dpdpa_test_widget"

echo "=== Testing Consent Revocation ==="
echo ""

# Test 1: Widget direct revocation
echo "Test 1: Widget Direct Revocation"
VISITOR_1="CNST-TEST-$(date +%s)-0001"
curl -s -X POST "$API_BASE/api/dpdpa/consent-record" \
  -H "Content-Type: application/json" \
  -d "{
    \"widgetId\": \"$WIDGET_ID\",
    \"visitorId\": \"$VISITOR_1\",
    \"consentStatus\": \"revoked\",
    \"acceptedActivities\": [],
    \"rejectedActivities\": [],
    \"activityConsents\": {}
  }" | jq '.'
echo "✓ Test 1 complete - Check visitor: $VISITOR_1"
echo ""

# Test 2: Widget with custom reason
echo "Test 2: Widget with Custom Revocation Reason"
VISITOR_2="CNST-TEST-$(date +%s)-0002"
curl -s -X POST "$API_BASE/api/dpdpa/consent-record" \
  -H "Content-Type: application/json" \
  -d "{
    \"widgetId\": \"$WIDGET_ID\",
    \"visitorId\": \"$VISITOR_2\",
    \"consentStatus\": \"revoked\",
    \"acceptedActivities\": [],
    \"rejectedActivities\": [],
    \"activityConsents\": {},
    \"revocationReason\": \"User opted out via CCPA link\"
  }" | jq '.'
echo "✓ Test 2 complete - Check visitor: $VISITOR_2"
echo ""

# Test 3: Preference Centre DELETE
echo "Test 3: Preference Centre DELETE"
VISITOR_3="CNST-TEST-$(date +%s)-0003"
curl -s -X DELETE "$API_BASE/api/privacy-centre/preferences?visitorId=$VISITOR_3&widgetId=$WIDGET_ID" | jq '.'
echo "✓ Test 3 complete - Check visitor: $VISITOR_3"
echo ""

echo "=== All Tests Complete ==="
echo "Run the following SQL to verify results:"
echo ""
echo "SELECT visitor_id, consent_status, revoked_at, revocation_reason"
echo "FROM dpdpa_consent_records"
echo "WHERE visitor_id LIKE 'CNST-TEST-%'"
echo "ORDER BY created_at DESC;"
```

---

## Monitoring Queries

### Daily Revocation Report
```sql
SELECT 
  DATE(revoked_at) as date,
  COUNT(*) as revocations,
  COUNT(CASE WHEN revocation_reason LIKE '%widget%' THEN 1 END) as via_widget,
  COUNT(CASE WHEN revocation_reason LIKE '%preference centre%' THEN 1 END) as via_preference_centre,
  COUNT(CASE WHEN revocation_reason LIKE '%DELETE%' THEN 1 END) as via_delete
FROM dpdpa_consent_records
WHERE consent_status = 'revoked'
  AND revoked_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(revoked_at)
ORDER BY date DESC;
```

### Missing Data Alert
```sql
-- Run this daily - should always return 0
SELECT COUNT(*) as records_with_missing_revocation_data
FROM dpdpa_consent_records
WHERE consent_status = 'revoked'
  AND (revoked_at IS NULL OR revocation_reason IS NULL);
```

### Revocation Rate by Widget
```sql
SELECT 
  w.widget_id,
  w.name,
  COUNT(CASE WHEN c.consent_status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN c.consent_status = 'revoked' THEN 1 END) as revoked,
  ROUND(
    100.0 * COUNT(CASE WHEN c.consent_status = 'revoked' THEN 1 END) / 
    NULLIF(COUNT(*), 0), 
    2
  ) as revocation_rate_percent
FROM dpdpa_consent_records c
JOIN dpdpa_widget_configs w ON c.widget_id = w.widget_id
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY w.widget_id, w.name
ORDER BY revocation_rate_percent DESC;
```

---

## Troubleshooting

### Issue: Test fails with "Invalid widget ID"
**Solution:** Make sure you have a widget configured with the ID you're using in tests.

### Issue: revoked_at is NULL after test
**Possible Causes:**
1. Fix not deployed yet
2. Using old API endpoint
3. Database migration not applied

**Debug Steps:**
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dpdpa_consent_records' 
  AND column_name IN ('revoked_at', 'revocation_reason');
```

### Issue: Preferences not syncing
**Debug Query:**
```sql
-- Check if sync is happening
SELECT 
  c.visitor_id,
  c.consent_status as consent_record_status,
  p.consent_status as preference_status,
  c.revoked_at
FROM dpdpa_consent_records c
LEFT JOIN visitor_consent_preferences p 
  ON c.visitor_id = p.visitor_id 
  AND c.widget_id = p.widget_id
WHERE c.consent_status = 'revoked'
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## Success Criteria

✅ **All Tests Pass:**
- Widget revocation creates record with `revoked_at` and `revocation_reason`
- Custom reasons are accepted and stored
- Partial withdrawals do NOT trigger revocation
- Full withdrawals DO trigger revocation
- DELETE endpoint creates proper revoked record
- Preferences are synced correctly

✅ **No Missing Data:**
- Query for missing revocation data returns 0 records
- All revoked records have timestamps
- All revoked records have reasons

✅ **Monitoring in Place:**
- Daily queries show revocation trends
- Alerts configured for missing data
- Dashboard shows revocation rates

---

## Compliance Checklist

After verification, confirm:

- [ ] All revoked consents have `revoked_at` timestamp
- [ ] All revoked consents have `revocation_reason`
- [ ] Audit trail is complete and verifiable
- [ ] Can identify which user revoked consent and when
- [ ] Can generate compliance reports
- [ ] Backfill completed for historical records (if any)
- [ ] Monitoring alerts are active
- [ ] Documentation updated
- [ ] Team trained on new revocation tracking

---

**Status:** Ready for Production ✅

