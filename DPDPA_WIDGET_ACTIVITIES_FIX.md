# DPDPA Widget Activities Display Fix

## Problem Statement

The DPDPA widget was showing the error: `[Consently DPDPA] No activities found in configuration!` even though:
- Activities exist in the database
- Activities are properly configured in the widget configuration
- Activities are marked as active (`is_active = true`)
- Widget configuration is active (`is_active = true`)

## Root Cause

**Row Level Security (RLS) policies were blocking anonymous access to processing activities.**

The public widget API endpoint (`/api/dpdpa/widget-public/[widgetId]`) uses an **anonymous Supabase client** (no authentication) to fetch widget configuration and activities. However, the following tables had RLS enabled but **no policies allowing anonymous users to read data**:

1. `processing_activities` - Main activities table
2. `activity_purposes` - Links activities to purposes
3. `purposes` - Purpose definitions
4. `purpose_data_categories` - Data categories for each purpose

When the widget tried to query these tables, RLS policies blocked the queries, resulting in empty results even though the data existed.

## Solution

Created a migration (`10_fix_processing_activities_public_access.sql`) that adds RLS policies allowing anonymous users to read data **only for activities that are explicitly selected in active widget configurations**.

### Security Model

The policies are scoped to ensure:
- ✅ Only activities in active widget configs are accessible
- ✅ Only active activities are accessible
- ✅ Related data (purposes, data categories) is only accessible for these activities
- ✅ No other user's activities are exposed
- ✅ No inactive activities are exposed

### Policies Created

1. **`processing_activities`**: Anonymous users can read activities that are:
   - Active (`is_active = true`)
   - Referenced in at least one active widget's `selected_activities` array

2. **`activity_purposes`**: Anonymous users can read activity purposes for activities that are in active widgets

3. **`purposes`**: Anonymous users can read purposes that are used in activities displayed in active widgets

4. **`purpose_data_categories`**: Anonymous users can read data categories for purposes used in activities displayed in active widgets

## Implementation Steps

1. **Run the migration**:
   ```bash
   # Apply the migration to your database
   psql $DATABASE_URL < supabase/migrations/10_fix_processing_activities_public_access.sql
   ```

2. **Verify the policies**:
   ```sql
   SELECT policyname, tablename, roles, cmd 
   FROM pg_policies 
   WHERE tablename IN ('processing_activities', 'activity_purposes', 'purposes', 'purpose_data_categories')
     AND roles = '{anon}'
   ORDER BY tablename, policyname;
   ```
   
   Expected: 4 rows (one policy per table)

3. **Test the widget**:
   - Load the widget on a test page
   - Check browser console - should see activities loaded
   - Verify activities are displayed in the widget UI

## Additional Improvements Made

1. **Enhanced logging** in `/app/api/dpdpa/widget-public/[widgetId]/route.ts`:
   - Logs selected activities count
   - Logs activities fetched from database
   - Logs processed activity structure
   - Logs final response structure

2. **Improved validation** in `/app/api/dpdpa/widget-config/route.ts`:
   - Validates activity UUIDs when updating widget config
   - Logs what activities are being saved

## Testing Checklist

- [ ] Migration runs successfully
- [ ] RLS policies are created (verify with SQL query above)
- [ ] Widget loads activities correctly
- [ ] Activities display in widget UI
- [ ] Purposes and data categories display correctly
- [ ] No console errors in browser
- [ ] Server logs show activities being fetched

## Related Files

- `supabase/migrations/10_fix_processing_activities_public_access.sql` - Migration file
- `app/api/dpdpa/widget-public/[widgetId]/route.ts` - Public widget API endpoint
- `app/api/dpdpa/widget-config/route.ts` - Widget configuration API
- `public/dpdpa-widget.js` - Widget JavaScript

## Notes

- The policies use nested subqueries which may have performance implications for large datasets
- Consider adding indexes on `selected_activities` arrays if performance becomes an issue
- The policies are scoped to only allow SELECT operations (read-only) for anonymous users
- All other operations (INSERT, UPDATE, DELETE) remain restricted to authenticated users

