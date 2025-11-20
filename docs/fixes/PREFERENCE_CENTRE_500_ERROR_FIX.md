# Preference Centre 500 Error Fix

## Issue Description

The Preference Centre was returning a 500 Internal Server Error when users tried to save their preferences. The error occurred during a PATCH request to `/api/privacy-centre/preferences`.

### Error Details

```
PATCH https://www.consently.in/api/privacy-centre/preferences 500 (Internal Server Error)
Error: Failed to update preferences
```

### Root Cause

The issue was caused by the `upsert` operation failing when updating visitor consent preferences. Several potential causes were identified:

1. **Unique Constraint Issues**: The `unique_visitor_widget_activity` constraint on `(visitor_id, widget_id, activity_id)` might not exist or work as expected with the upsert operation
2. **Foreign Key Violations**: Activity IDs in the request might not exist in the `processing_activities` table
3. **Inadequate Error Handling**: The original code didn't provide detailed error information, making diagnosis difficult

## Solution

### 1. Enhanced Error Handling

Added comprehensive error logging to capture:
- Error message
- Error code
- Error details and hints
- Specific data being updated

### 2. Replaced Bulk Upsert with Individual Operations

Changed from a single bulk upsert:
```typescript
// OLD: Single upsert operation
await supabase
  .from('visitor_consent_preferences')
  .upsert(updates, {
    onConflict: 'visitor_id,widget_id,activity_id',
    ignoreDuplicates: false,
  });
```

To individual update/insert operations:
```typescript
// NEW: Individual operations with validation
for (const pref of preferences) {
  // Check if record exists
  const existing = await supabase
    .from('visitor_consent_preferences')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('widget_id', widgetId)
    .eq('activity_id', pref.activityId)
    .maybeSingle();

  if (existing) {
    // Update
    await supabase
      .from('visitor_consent_preferences')
      .update(update)
      .eq('id', existing.id);
  } else {
    // Insert
    await supabase
      .from('visitor_consent_preferences')
      .insert(update);
  }
}
```

### 3. Activity Validation

Added upfront validation to ensure all activity IDs exist before attempting updates:
```typescript
const { data: existingActivities } = await supabase
  .from('processing_activities')
  .select('id')
  .in('id', activityIds);

// Check for invalid IDs and return 400 error
```

### 4. Partial Success Handling

The API now returns detailed information about partial successes:
- Which activities were updated successfully
- Which activities failed and why
- Success and error counts

## Benefits

1. **Better Reliability**: Avoids bulk operation failures affecting all preferences
2. **Improved Debugging**: Detailed error messages for each activity
3. **Graceful Degradation**: Partial success when some activities fail
4. **Validation**: Upfront checks prevent foreign key violations

## Testing

To test the fix:

1. **Test successful preference update**:
   ```bash
   curl -X PATCH https://www.consently.in/api/privacy-centre/preferences \
     -H "Content-Type: application/json" \
     -d '{
       "visitorId": "test_visitor",
       "widgetId": "test_widget",
       "preferences": [
         {
           "activityId": "valid-uuid",
           "consentStatus": "accepted"
         }
       ],
       "metadata": {
         "userAgent": "Test",
         "deviceType": "Desktop",
         "language": "en"
       }
     }'
   ```

2. **Test with invalid activity ID** (should return 400):
   ```bash
   # Same as above but with non-existent activity ID
   ```

3. **Test withdrawal of consent**:
   - Accept a consent
   - Then withdraw it (consentStatus: "withdrawn")
   - Verify it updates correctly

## Database Migration

Ensure migration `25_fix_visitor_preferences_constraint.sql` has been applied to production. This migration:
- Removes duplicate records
- Adds the `unique_visitor_widget_activity` constraint
- Adds automatic `last_updated` timestamp trigger

To verify the constraint exists:
```bash
npm run ts-node scripts/check-visitor-preferences-constraint.ts
```

## Performance Considerations

The new approach makes multiple database queries instead of a single bulk operation. For typical use cases (2-10 activities per save), this is acceptable. Performance impact:

- **Before**: 1 query (bulk upsert)
- **After**: 1 + (2 × N) queries where N = number of activities
  - 1 query for activity validation
  - 2 queries per activity (select + update/insert)

For 5 activities: 1 + 10 = 11 queries vs 1 query previously.

This trade-off is worthwhile for:
- Better error handling
- Avoiding bulk operation failures
- Easier debugging

## Future Improvements

1. **Optimize with Batch Operations**: Group queries using Supabase batch operations or stored procedures
2. **Add Caching**: Cache valid activity IDs to reduce validation queries
3. **Database Function**: Create a PostgreSQL function to handle the upsert logic server-side
4. **Monitoring**: Add metrics to track preference update success rates

## Related Files

- `/app/api/privacy-centre/preferences/route.ts` - API endpoint (modified)
- `/components/privacy-centre/preference-centre.tsx` - Frontend component
- `/supabase/migrations/25_fix_visitor_preferences_constraint.sql` - Database migration
- `/scripts/check-visitor-preferences-constraint.ts` - Validation script (new)

## References

- Original error logs show activity status changes: `wasAccepted=true, newStatus=withdrawn`
- Supabase upsert documentation: https://supabase.com/docs/reference/javascript/upsert
- PostgREST upsert behavior: https://postgrest.org/en/stable/api.html#upsert

