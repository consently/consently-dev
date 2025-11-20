# Cookie Consent Count Not Updating - Fix

## Problem
The cookie consent count on the dashboard was not updating correctly. The dashboard was showing a static count that didn't reflect new consent records being added to the database.

## Root Causes

### 1. **Pagination Limitation**
The dashboard was fetching only 100 records (`/api/consent/records?limit=100`) and using `records.length` to calculate the total count. This meant:
- If there were more than 100 consents, the count would always show 100
- New consents beyond the 100-record limit wouldn't be reflected in the count

### 2. **Incorrect Aggregation**
The dashboard was calculating acceptance rate and other statistics from only the first 100 records, not the entire dataset:
```typescript
// OLD CODE - INCORRECT
totalConsents = records.length; // Only counted paginated results
acceptedCount = records.filter((r: any) => r.status === 'accepted').length;
```

### 3. **Missing Cache Control Headers**
The API endpoint `/api/consent/records` didn't have proper cache control headers, potentially causing browsers to cache old data.

### 4. **Next.js Route Caching**
The API route wasn't explicitly marked as dynamic, allowing Next.js to potentially cache the response.

## Solution

### API Changes (`app/api/consent/records/route.ts`)

1. **Added Dynamic Route Configuration**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

2. **Added Aggregated Statistics**
Modified the endpoint to return pre-calculated stats alongside paginated data:
```typescript
// Fetch aggregated statistics (separate from pagination)
const { data: allRecords } = await supabase
  .from('consent_records')
  .select('status, consent_id')
  .eq('user_id', user.id);

const stats = {
  acceptedCount: allRecords?.filter(r => r.status === 'accepted').length || 0,
  rejectedCount: allRecords?.filter(r => r.status === 'rejected').length || 0,
  partialCount: allRecords?.filter(r => r.status === 'partial').length || 0,
  revokedCount: allRecords?.filter(r => r.status === 'revoked').length || 0,
  uniqueVisitors: new Set(allRecords?.map(r => r.consent_id) || []).size,
};
```

3. **Added Cache Control Headers**
```typescript
response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
response.headers.set('Pragma', 'no-cache');
response.headers.set('Expires', '0');
```

### Dashboard Changes (`app/dashboard/cookies/page.tsx`)

1. **Use Aggregated Stats from API**
```typescript
// NEW CODE - CORRECT
totalConsents = recordsData.pagination?.total || 0;
acceptedCount = stats.acceptedCount || 0;
rejectedCount = stats.rejectedCount || 0;
partialCount = stats.partialCount || 0;
revokedCount = stats.revokedCount || 0;
uniqueVisitors = stats.uniqueVisitors || 0;
```

## Benefits

1. ✅ **Accurate Counts**: Total consent count now reflects the actual number of records in the database
2. ✅ **Real-time Updates**: Cache control headers ensure fresh data on every request
3. ✅ **Correct Statistics**: Acceptance rate and other metrics calculated from all records, not just the first 100
4. ✅ **Performance**: Only fetches minimal data needed for stats (`status, consent_id`) rather than all fields
5. ✅ **Automatic Refresh**: Dashboard still refreshes every 30 seconds as before, but now gets accurate data

## Testing

To verify the fix:

1. **Check Current Count**: Navigate to `/dashboard/cookies` and note the current count
2. **Add New Consent**: Trigger a new consent event from your widget
3. **Wait 30 Seconds**: The dashboard auto-refreshes every 30 seconds
4. **Verify Update**: The count should increase by 1

Alternatively, manually refresh the page to see the updated count immediately.

## Related Files

- `/app/api/consent/records/route.ts` - API endpoint for fetching consent records
- `/app/dashboard/cookies/page.tsx` - Cookie consent dashboard
- `/app/api/consent/record/route.ts` - API endpoint for recording new consents

## Date Fixed
November 20, 2025

