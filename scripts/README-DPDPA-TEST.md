# DPDPA Module Test Script

## Overview

This test script (`test-dpdpa-module.ts`) comprehensively tests the DPDPA module to verify that:

1. ✅ **Email Linking Works** - Preferences can be linked to visitor emails
2. ✅ **Email Storage** - Visitor emails are saved correctly in both `dpdpa_consent_records` and `visitor_consent_preferences` tables
3. ✅ **Cross-Device Sync** - Multiple devices can be linked via the same email hash
4. ✅ **Preference Updates** - Preferences can be updated while maintaining email link
5. ✅ **Email Retrieval** - Preferences and consent records can be retrieved using email hash

## Prerequisites

1. **Environment Variables**: Ensure `.env.local` contains:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Active Widget**: You must have at least one active widget in your database
3. **Processing Activities**: You need at least 2 active processing activities

## Running the Test

```bash
# From the project root
npx ts-node scripts/test-dpdpa-module.ts
```

Or make it executable:
```bash
chmod +x scripts/test-dpdpa-module.ts
./scripts/test-dpdpa-module.ts
```

## What the Script Tests

### Test 1: Create Consent Record with Email
- Creates a consent record with visitor email
- Verifies `visitor_email` is saved
- Verifies `visitor_email_hash` is saved

### Test 2: Save Preferences with Email
- Creates multiple visitor preferences with email
- Verifies email linking for each preference
- Checks that `visitor_email` and `visitor_email_hash` are stored correctly

### Test 3: Cross-Device Preference Sync
- Simulates 2 different devices (different visitor IDs)
- Links both devices to the same email
- Verifies that preferences can be retrieved across both devices using email hash

### Test 4: Update Preferences via API
- Updates an existing preference
- Verifies email is preserved after update
- Tests the upsert functionality

### Test 5: Retrieve Preferences by Email
- Queries all preferences using email hash
- Displays all linked preferences across devices
- Verifies email-based lookup works correctly

### Test 6: Retrieve Consent Records by Email
- Queries all consent records using email hash
- Verifies consent records can be retrieved by email

## Expected Output

```
🚀 DPDPA Module Comprehensive Test Suite
Testing email linking and preference management

============================================================
  Setting Up Test Environment
============================================================

✅ Widget ID: widget_abc123...
✅ User ID: user_xyz789...
✅ Visitor ID 1 (Device 1): ...
✅ Visitor ID 2 (Device 2): ...
✅ Test Email: test_1234567890@example.com
✅ Email Hash: a1b2c3d4e5f6...
✅ Activity IDs: 3 activities loaded

============================================================
  Test 1: Create Consent Record with Email
============================================================

ℹ️  Creating consent record with visitor email...
✅ Consent record created with ID: ...
✅ ✓ Visitor email saved correctly
✅ ✓ Visitor email hash saved correctly
✅ Consent Record with Email: PASSED

[... additional test output ...]

============================================================
  Test Results Summary
============================================================

Total Tests: 6
✅ Passed: 6

Success Rate: 100.0%

🎉 All tests passed! DPDPA module is working amazingly!
✓ Email linking is functional
✓ Preferences are saved with email correctly
✓ Cross-device sync is working
```

## Test Data Cleanup

The script automatically cleans up all test data at the end:
- Deletes test preferences from `visitor_consent_preferences`
- Deletes test consent records from `dpdpa_consent_records`

## Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Error: "No active widgets found"
- Create at least one active widget in your dashboard first

### Error: "Not enough processing activities"
- Create at least 2 active processing activities in your dashboard

### Test Failures
- Check the error messages for specific details
- Verify database schema matches expected structure
- Ensure RLS policies allow service role access

## Database Schema Requirements

The script expects these columns to exist:

### `dpdpa_consent_records`
- `visitor_email` (TEXT, nullable)
- `visitor_email_hash` (VARCHAR(64), nullable)

### `visitor_consent_preferences`
- `visitor_email` (TEXT, nullable)
- `visitor_email_hash` (VARCHAR(64), nullable)

If these columns are missing, the tests will fail. Check migration `32_add_visitor_email.sql`.

## Understanding Results

- **100% Pass Rate**: DPDPA module is fully functional ✅
- **50-99% Pass Rate**: Some features work, check failed tests ⚠️
- **0% Pass Rate**: Major issues, review database and configuration ❌

## Next Steps

After running this test and confirming all tests pass:

1. ✅ Your DPDPA module is working correctly
2. ✅ Email linking with preferences is functional
3. ✅ Preferences are being saved on email properly
4. ✅ Cross-device sync via email is operational

You can now confidently use the Privacy Centre and email verification features!
