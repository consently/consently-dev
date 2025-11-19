# Preference Centre Revocation Fix

## Issue
Users were unable to properly save preferences and revoke consents in the Preference Centre. When toggling OFF a consent that was previously accepted, the system was incorrectly treating it as a rejection rather than a revocation (withdrawal).

## Root Cause
The preference centre component was only using two states (`'accepted'` and `'rejected'`) when managing consent preferences, ignoring the third state `'withdrawn'` that exists in the database schema. This caused the following issues:

1. **Lost Status Information**: When fetching preferences, the system converted `'withdrawn'` to `'rejected'`, losing information about whether a consent was previously accepted.
2. **Incorrect Status Updates**: When a user toggled OFF a previously accepted consent, the system sent `'rejected'` instead of `'withdrawn'`, which doesn't properly track consent revocation.
3. **Compliance Risk**: Not distinguishing between "never accepted" and "previously accepted but withdrawn" could cause compliance issues under DPDPA and other regulations.

## Database Schema
The `visitor_consent_preferences` table supports three consent statuses:
- `'accepted'`: User has accepted consent
- `'rejected'`: User has rejected consent (never accepted)
- `'withdrawn'`: User previously accepted but has now revoked consent

```sql
consent_status text NOT NULL CHECK (consent_status = ANY (ARRAY['accepted'::text, 'rejected'::text, 'withdrawn'::text]))
```

## Solution

### 1. Updated Preference State Management
Added tracking of original consent status to properly determine whether to use `'withdrawn'` or `'rejected'`:

```typescript
const [preferences, setPreferences] = useState<Record<string, 'accepted' | 'rejected' | 'withdrawn'>>({});
const [originalStatus, setOriginalStatus] = useState<Record<string, 'accepted' | 'rejected' | 'withdrawn'>>({});
```

### 2. Preserved Original Status
Modified `fetchPreferences()` to store both the original database status and the UI display state:

```typescript
// Store original status from database
origStatus[activity.id] = activity.consentStatus;
// For UI, treat 'withdrawn' as 'rejected' (toggle OFF state)
prefs[activity.id] = activity.consentStatus === 'withdrawn' ? 'rejected' : activity.consentStatus;
```

### 3. Smart Status Determination
Updated `handlePreferenceChange()` to intelligently determine the correct status:

```typescript
const handlePreferenceChange = (activityId: string, isAccepted: boolean) => {
  let newStatus: 'accepted' | 'rejected' | 'withdrawn';
  
  if (isAccepted) {
    newStatus = 'accepted';
  } else {
    // Toggling OFF - check if it was previously accepted
    const wasAccepted = originalStatus[activityId] === 'accepted' || prev[activityId] === 'accepted';
    newStatus = wasAccepted ? 'withdrawn' : 'rejected';
  }
  
  return { ...prev, [activityId]: newStatus };
};
```

### 4. Updated Bulk Actions
Modified `handleRejectAll()` to properly mark previously accepted consents as withdrawn:

```typescript
const handleRejectAll = () => {
  const allRejected: Record<string, 'accepted' | 'rejected' | 'withdrawn'> = {};
  activities.forEach((activity) => {
    const wasAccepted = originalStatus[activity.id] === 'accepted' || preferences[activity.id] === 'accepted';
    allRejected[activity.id] = wasAccepted ? 'withdrawn' : 'rejected';
  });
  setPreferences(allRejected);
};
```

## Files Modified
- `/components/privacy-centre/preference-centre.tsx`
  - Added `originalStatus` state tracking
  - Updated `fetchPreferences()` to preserve original status
  - Modified `handlePreferenceChange()` for smart status determination
  - Updated `handleAcceptAll()` and `handleRejectAll()` with proper typing
  - Fixed Switch component to pass boolean instead of status string

## API Behavior (Already Correct)
The API endpoint `/api/privacy-centre/preferences` (PATCH) already correctly handles all three statuses:
- Accepts `'withdrawn'` in the request body
- Properly upserts to database with correct status
- Creates appropriate consent records with revocation tracking
- Sets `revoked_at` timestamp for withdrawn consents

## Testing Scenarios

### Scenario 1: Initial Rejection
1. User visits preference centre (no previous consent)
2. User toggles OFF an activity
3. **Expected**: Status saved as `'rejected'`
4. **Result**: ✅ Correctly saves as rejected

### Scenario 2: Consent Revocation
1. User previously accepted consent (status: `'accepted'`)
2. User returns and toggles OFF the activity
3. **Expected**: Status saved as `'withdrawn'`
4. **Result**: ✅ Correctly saves as withdrawn

### Scenario 3: Re-acceptance After Withdrawal
1. User has withdrawn consent (status: `'withdrawn'`)
2. User toggles ON the activity again
3. **Expected**: Status saved as `'accepted'`
4. **Result**: ✅ Correctly saves as accepted

### Scenario 4: Reject All
1. User has mixed consents (some accepted, some rejected)
2. User clicks "Reject All"
3. **Expected**: Previously accepted → `'withdrawn'`, never accepted → `'rejected'`
4. **Result**: ✅ Correctly differentiates statuses

## Compliance Benefits
1. **Audit Trail**: Clear distinction between rejection and withdrawal
2. **Regulatory Compliance**: Proper tracking of consent revocation as required by DPDPA
3. **User Rights**: Enables users to exercise their right to withdraw consent
4. **Transparency**: Better visibility into consent lifecycle

## Related Files
- Database schema: `/supabase/current-entire-schema.sql` (line 552)
- API endpoint: `/app/api/privacy-centre/preferences/route.ts`
- Type definitions: `/types/database.types.ts` (line 481)

## Impact
- **User Experience**: Users can now properly save and revoke preferences
- **Data Integrity**: Correct consent status tracking in the database
- **Compliance**: Proper distinction between rejection and withdrawal
- **Analytics**: Better insights into consent revocation patterns

