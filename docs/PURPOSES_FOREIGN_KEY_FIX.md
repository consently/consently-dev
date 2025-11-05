# Purposes Foreign Key Fix

## 🔍 Problem Identified

Your Processing Activities were showing **"0 Purposes"** even though purposes were configured correctly. 

### Root Cause

The database is missing foreign key constraints between the `activity_purposes` and `purposes` tables, causing PostgREST (Supabase's API layer) to fail with this error:

```
Could not find a relationship between 'activity_purposes' and 'purposes' in the schema cache
PGRST200
```

This prevents the API from joining these tables to fetch purpose data, which is why the UI displays "0 purposes" for all activities.

## ✅ Solution

The fix involves two steps:

### 1. Clean up orphaned data
Some records in `activity_purposes` reference `purpose_id` values that don't exist in the `purposes` table. These orphaned records must be removed before foreign key constraints can be added.

### 2. Add foreign key constraints
Once the data is clean, we add the proper foreign key relationships:
- `activity_purposes.purpose_id` → `purposes.id`
- `activity_purposes.activity_id` → `processing_activities.id`
- `purpose_data_categories.activity_purpose_id` → `activity_purposes.id`

## 🛠️ How to Apply the Fix

### Method 1: Using the Diagnostic Tool (Recommended)

1. Navigate to the diagnostic page: http://localhost:3000/dashboard/dpdpa/fix-purposes

2. Click **"Copy SQL"** button to copy the migration script

3. Click **"Open Supabase SQL Editor"** button

4. Paste the SQL and click "Run"

5. Return to the diagnostic page and click **"Refresh"** to verify the fix

### Method 2: Manual SQL Execution

1. Go to your Supabase Dashboard → SQL Editor

2. Copy and execute the contents of `/supabase/migrations/02_add_foreign_key_constraints.sql`

3. Verify the fix by running this query:
```sql
SELECT
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('activity_purposes', 'purpose_data_categories')
  AND tc.constraint_type = 'FOREIGN KEY';
```

Expected output:
- `activity_purposes` → `purposes`
- `activity_purposes` → `processing_activities`  
- `purpose_data_categories` → `activity_purposes`

## 📋 Migration Script

The migration script (`02_add_foreign_key_constraints.sql`) performs the following:

```sql
-- Step 1: Clean up orphaned activity_purposes (invalid purpose_id)
DELETE FROM activity_purposes ap
WHERE NOT EXISTS (
  SELECT 1 FROM purposes p WHERE p.id = ap.purpose_id
);

-- Step 2: Add Foreign Key from activity_purposes to purposes
ALTER TABLE activity_purposes
  ADD CONSTRAINT activity_purposes_purpose_id_fkey
  FOREIGN KEY (purpose_id)
  REFERENCES purposes(id)
  ON DELETE CASCADE;

-- Step 3-7: Similar cleanup and constraints for other tables...

-- Final step: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

## ✨ Expected Results After Fix

Once the migration is successfully applied:

1. **Foreign Keys Added**: Database relationships are properly established
2. **PostgREST Cache Refreshed**: API recognizes the new relationships
3. **UI Fixed**: Processing Activities will display the correct number of purposes
4. **Data Integrity**: Orphaned data is cleaned up
5. **Future Protection**: Foreign key constraints prevent invalid data

## 🧪 Verification Steps

After applying the fix:

1. Go to Processing Activities page: http://localhost:3000/dashboard/dpdpa/activities

2. Check that your "Account Opening" activity now shows purposes instead of "0 Purposes"

3. Click the edit icon on any activity to verify all purposes and data categories are displayed correctly

4. Run the diagnostic again: http://localhost:3000/dashboard/dpdpa/fix-purposes
   - Status should change from **CRITICAL** to **HEALTHY**
   - All checks should show ✅ green status

## 🔧 Technical Details

### Why Foreign Keys Are Important

Foreign key constraints:
- **Enforce referential integrity**: Prevent orphaned records
- **Enable PostgREST relationships**: Required for Supabase API joins
- **Cascade deletes**: Automatically clean up related records
- **Schema documentation**: Self-documenting database relationships

### Tables Affected

1. **purposes**: Contains predefined and custom purposes
2. **activity_purposes**: Links activities to purposes (many-to-many)
3. **purpose_data_categories**: Stores data categories for each purpose
4. **processing_activities**: Main activities table

### Architecture After Fix

```
processing_activities
  ↓ (1:N)
activity_purposes ←→ purposes
  ↓ (1:N)           (predefined + custom)
purpose_data_categories
```

## 📝 Notes

- **Safe Migration**: The script is idempotent - safe to run multiple times
- **Data Cleanup**: Only removes truly orphaned data (invalid references)
- **No Data Loss**: Valid data is preserved
- **Atomic Operation**: All changes in a single transaction
- **Auto-refresh**: PostgREST cache is automatically refreshed

## 🆘 Troubleshooting

### Issue: Migration fails with constraint violation
**Solution**: The cleanup queries should handle this. If it still fails, check for custom modifications to the schema.

### Issue: Schema cache not refreshing
**Solution**: Manually restart PostgREST service in Supabase Dashboard → Database → Connection Pooling

### Issue: Still showing 0 purposes after fix
**Solution**: 
1. Verify foreign keys were created (run verification query above)
2. Check browser console for API errors
3. Clear browser cache and refresh
4. Run diagnostic tool again

## 📚 Related Documentation

- [Purposes System Documentation](./PURPOSES_SYSTEM_DOCUMENTATION.md)
- [DPDPA Implementation Guide](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md)
- [Database Migrations README](../supabase/migrations/README.md)

## ✅ Completion Checklist

- [ ] Ran migration script in Supabase SQL Editor
- [ ] Verified foreign keys exist (verification query)
- [ ] Checked diagnostic shows HEALTHY status
- [ ] Confirmed purposes display correctly in UI
- [ ] Tested creating/editing activities
- [ ] Verified widget configuration works

---

**Last Updated**: November 5, 2025  
**Migration File**: `supabase/migrations/02_add_foreign_key_constraints.sql`  
**Diagnostic Tool**: http://localhost:3000/dashboard/dpdpa/fix-purposes

