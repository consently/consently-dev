# Fix: Preference Centre Update Error

## Issue Description
Users were experiencing errors when saving preferences in the Preference Centre:
`[Preference Centre] Save response: {error: 'Failed to update some preferences', ...}`

Investigation revealed two issues:
1. **Database Trigger Error**: The `visitor_consent_preferences` table had a trigger referencing a non-existent `updated_at` column (the correct column is `last_updated`). This caused updates to fail with `record "new" has no field "updated_at"`.
2. **Race Condition**: The API used a check-then-update/insert pattern which could fail under high concurrency or if the check failed for other reasons.

## Solution

### 1. API Update (Applied)
The API route `app/api/privacy-centre/preferences/route.ts` has been updated to use `upsert` instead of separate `update` and `insert` operations. This is more robust and handles unique constraints correctly.

### 2. Database Fix (Action Required)
A migration file has been created to fix the database triggers.

**You must run the following SQL in your Supabase Dashboard SQL Editor:**

File: `supabase/migrations/31_fix_visitor_preferences_trigger.sql`

```sql
-- Drop potential incorrect triggers
DROP TRIGGER IF EXISTS update_visitor_consent_preferences_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS set_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS handle_updated_at ON visitor_consent_preferences;
DROP TRIGGER IF EXISTS update_updated_at_column ON visitor_consent_preferences;

-- Ensure correct function exists
CREATE OR REPLACE FUNCTION update_visitor_consent_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure correct trigger exists
DROP TRIGGER IF EXISTS trigger_update_visitor_consent_preferences_timestamp 
ON visitor_consent_preferences;

CREATE TRIGGER trigger_update_visitor_consent_preferences_timestamp
BEFORE UPDATE ON visitor_consent_preferences
FOR EACH ROW
EXECUTE FUNCTION update_visitor_consent_preferences_timestamp();
```

## Verification
After running the SQL, you can verify the fix by:
1. Opening the Preference Centre.
2. Toggling some preferences.
3. Clicking "Save Preferences".
4. Verifying that the success message appears and no errors are logged in the console.
