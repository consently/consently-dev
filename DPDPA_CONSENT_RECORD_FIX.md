# DPDPA Consent Record 500 Error Fix

## Problem Statement

The DPDPA widget was failing to record consent with a 500 error:
```
api/dpdpa/consent-record:1 Failed to load resource: the server responded with a status of 500
[Consently DPDPA] Failed to record consent: Error: Failed to record consent
```

## Root Cause

**Row Level Security (RLS) policies were blocking anonymous users from updating consent records.**

The public widget API endpoint (`/api/dpdpa/consent-record`) uses an **anonymous Supabase client** to:
1. Check for existing consent records (SELECT)
2. Create new consent records (INSERT) - ✅ This worked (policy exists)
3. Update existing consent records (UPDATE) - ❌ This failed (no policy for anonymous users)

The RLS policy for UPDATE only allowed authenticated users, but the widget needs to update consent records as anonymous users when visitors modify their consent preferences.

## Solution

Created a migration (`11_fix_consent_records_public_update.sql`) that adds RLS policies allowing anonymous users to:
1. **Read consent records** for active widgets (to check for existing consent)
2. **Update consent records** for active widgets (to modify/withdraw consent)

### Security Model

The policies ensure:
- ✅ Only consent records for active widgets can be updated
- ✅ API-level validation ensures visitors can only update their own records (by visitor_id)
- ✅ Widget must be active for any operations
- ✅ INSERT policy already existed and allows anonymous users to create records

### Policies Created

1. **SELECT Policy**: Anonymous users can read consent records for active widgets
   - Allows the widget to check for existing consent before creating/updating
   - Scoped to active widgets only

2. **UPDATE Policy**: Anonymous users can update consent records for active widgets
   - Allows visitors to modify or withdraw their consent
   - Scoped to active widgets only
   - API validates visitor_id to ensure users can only update their own records

## Implementation Steps

1. **Run the migration**:
   ```bash
   # Apply the migration to your database
   psql $DATABASE_URL < supabase/migrations/11_fix_consent_records_public_update.sql
   ```

2. **Verify the policies**:
   ```sql
   SELECT policyname, tablename, roles, cmd 
   FROM pg_policies 
   WHERE tablename = 'dpdpa_consent_records' 
     AND roles = '{anon}'
   ORDER BY cmd, policyname;
   ```
   
   Expected: 3 rows (INSERT, SELECT, UPDATE policies)

3. **Test the widget**:
   - Load the widget on a test page
   - Accept/reject consent
   - Check browser console - should see consent recorded successfully
   - Verify consent is saved in database

## Additional Improvements Made

1. **Enhanced error logging** in `/app/api/dpdpa/consent-record/route.ts`:
   - Logs detailed error information when creating/updating fails
   - Logs payload information for debugging
   - Returns error details in API response

2. **Improved error handling**:
   - Changed `.single()` to `.maybeSingle()` when checking for existing consent
   - Handles cases where no existing consent is found gracefully
   - Continues with creating new record if check fails

## Security Considerations

### API-Level Validation
The API validates that:
- `visitor_id` matches the existing record before updating
- `widget_id` is valid and active
- Required fields are present

### RLS Policy Limitations
RLS policies cannot access request parameters directly, so:
- The SELECT policy allows reading any consent record for active widgets
- The UPDATE policy allows updating any consent record for active widgets
- **API-level validation ensures visitors can only update their own records** by checking `visitor_id` before updating

### Visitor ID Security
- `visitor_id` is generated client-side and stored in localStorage
- It's unique per visitor and device
- The API validates `visitor_id` before allowing updates

## Testing Checklist

- [ ] Migration runs successfully
- [ ] RLS policies are created (verify with SQL query above)
- [ ] Widget can create new consent records
- [ ] Widget can update existing consent records
- [ ] Widget can check for existing consent
- [ ] No console errors in browser
- [ ] Server logs show consent being recorded
- [ ] Consent records appear in database

## Related Files

- `supabase/migrations/11_fix_consent_records_public_update.sql` - Migration file
- `app/api/dpdpa/consent-record/route.ts` - Consent recording API endpoint
- `public/dpdpa-widget.js` - Widget JavaScript

## Notes

- The policies are scoped to active widgets only for security
- API-level validation provides additional security layer
- Visitor ID validation ensures users can only update their own records
- The SELECT policy is permissive but API filters by visitor_id

