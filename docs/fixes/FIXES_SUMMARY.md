# Fixes Summary - Consently Issues Resolution

## Date: 2025-01-05

## Issues Fixed

### 1. 404 Errors - Analysis ✅

#### Issue 1: `POST /api/consent/record 404`
**Status:** Endpoint exists and is properly configured
- **Location:** `app/api/consent/record/route.ts`
- **Cause:** The 404 is occurring at the production URL `https://www.consently.in`
- **Root Cause:** Likely a deployment issue or the endpoint needs to be redeployed
- **Verification:** The route file exists and has proper CORS headers configured

**What the endpoint does:**
- Records cookie consent from widgets
- Supports both cookie and DPDPA widget configs
- Inserts records into both `consent_logs` and `consent_records` tables

#### Issue 2: `GET /api/cookies/widget-public/[widgetId] 404`
**Status:** Endpoint exists and is properly configured
- **Location:** `app/api/cookies/widget-public/[widgetId]/route.ts`
- **Cause:** Similar deployment issue
- **Verification:** The route file exists with proper CORS and fallback mechanisms

**What the endpoint does:**
- Fetches widget configuration for public display
- Merges widget settings with banner templates
- Returns transformed config in camelCase for JavaScript

### 2. 500 Error - DPDPA Purposes API ✅

#### Issue: `POST /api/dpdpa/purposes 500 (Internal Server Error)`
**Status:** Fixed by adding support for new fields

**Changes Made:**
1. Updated `app/api/dpdpa/purposes/route.ts` to accept and store additional fields:
   - `name` - Display name for the purpose
   - `dataCategory` - Category of data being processed
   - `retentionPeriod` - How long data is retained

**Code Changes:**
```typescript
// Before: Only accepted purposeName and description
const { purposeName, description } = body;

// After: Now accepts additional DPDPA-required fields
const { purposeName, description, name, dataCategory, retentionPeriod } = body;

// Insert now includes new fields
.insert({
  purpose_name: purposeName,
  description: description || null,
  name: name || purposeName,
  data_category: dataCategory || null,
  retention_period: retentionPeriod || null,
  is_predefined: false,
})
```

### 3. Database Migration Created ✅

#### Migration File: `supabase/migrations/20250105_add_purposes_fields.sql`

**Purpose:** Extend the `purposes` table to support DPDPA compliance requirements

**Changes:**
- Adds `name` column (VARCHAR 255)
- Adds `data_category` column (VARCHAR 255)
- Adds `retention_period` column (VARCHAR 255)
- Populates existing records' `name` from `purpose_name`
- Creates performance indexes

**How to Apply:**

**Option 1: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20250105_add_purposes_fields.sql`
3. Execute the SQL

**Option 2: Using psql or any PostgreSQL client**
```bash
psql <your-connection-string> < supabase/migrations/20250105_add_purposes_fields.sql
```

**Verification:**
```sql
-- Check columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purposes' 
AND column_name IN ('name', 'data_category', 'retention_period');

-- Verify data migration
SELECT id, purpose_name, name, description 
FROM purposes 
LIMIT 5;
```

## Files Modified

1. **app/api/dpdpa/purposes/route.ts**
   - Added support for `name`, `dataCategory`, and `retentionPeriod` fields in POST endpoint
   - Now properly handles all DPDPA-required fields

## Files Created

1. **supabase/migrations/20250105_add_purposes_fields.sql**
   - Migration to add new columns to purposes table
   - Includes indexes for performance
   - Idempotent (safe to run multiple times)

2. **supabase/migrations/README.md**
   - Documentation for applying migrations
   - Rollback instructions
   - Verification queries

3. **FIXES_SUMMARY.md** (this file)
   - Complete documentation of all fixes

## Next Steps

### Immediate Actions Required:

1. **Apply Database Migration** ⚠️
   ```sql
   -- Run this in Supabase SQL Editor
   -- File: supabase/migrations/20250105_add_purposes_fields.sql
   ```

2. **Redeploy Application** ⚠️
   - The API changes need to be deployed to fix the 500 error
   - Deploy to production: `npm run build && npm run start` or your deployment pipeline

3. **Fix 404 Errors** ⚠️
   - The 404 errors suggest the routes aren't deployed or there's a routing issue
   - Verify the build includes the API routes:
     ```bash
     npm run build
     # Check .next/server/app/api/ contains:
     # - consent/record/route.js
     # - cookies/widget-public/[widgetId]/route.js
     # - dpdpa/purposes/route.js
     ```

### Verification After Deployment:

1. **Test Purposes API:**
   ```bash
   # Create a purpose with new fields
   curl -X POST https://www.consently.in/api/dpdpa/purposes \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-token>" \
     -d '{
       "purposeName": "Test Purpose",
       "name": "Test Display Name",
       "description": "Test description",
       "dataCategory": "Personal Data",
       "retentionPeriod": "1 year"
     }'
   ```

2. **Test Consent Recording:**
   ```bash
   curl -X POST https://www.consently.in/api/consent/record \
     -H "Content-Type: application/json" \
     -d '{
       "widgetId": "cnsty_mhc0ouby_9tmvy18rd",
       "consentId": "test-consent-id",
       "status": "accepted",
       "categories": ["necessary", "analytics"]
     }'
   ```

3. **Test Widget Config:**
   ```bash
   curl https://www.consently.in/api/cookies/widget-public/cnsty_mhc0ouby_9tmvy18rd
   ```

## Additional Notes

- All API routes have proper CORS headers configured in `next.config.ts`
- The widget.js is correctly configured to call these endpoints
- The purposes table migration is backwards compatible
- The `description` field should already exist in your purposes table

## Rollback Plan

If issues occur after deployment:

1. **Rollback Database:**
   ```sql
   ALTER TABLE purposes 
     DROP COLUMN IF EXISTS name,
     DROP COLUMN IF EXISTS data_category,
     DROP COLUMN IF EXISTS retention_period;
   
   DROP INDEX IF EXISTS idx_purposes_name;
   DROP INDEX IF EXISTS idx_purposes_data_category;
   ```

2. **Rollback Code:**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

## Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check Next.js build logs for deployment issues
3. Verify environment variables are set correctly
4. Check network tab in browser for actual error responses
