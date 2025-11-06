# Widget Migration Instructions

## Problem
The widget `dpdpa_mheon92d_o34gdpk` exists in your local database but not in production, causing a 404 error.

## Solution
Run this one-time migration to insert the widget into your production database.

## Steps

### 1. Get Your Production User ID

Go to your Supabase production dashboard:
- Navigate to: **SQL Editor**
- Run this query:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```
- Copy the `id` value

### 2. Update the Migration File

Edit `supabase/migrations/insert_consently_widget.sql`:
- Replace **both** instances of `YOUR_PRODUCTION_USER_ID` with your actual user ID from step 1

### 3. Apply the Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase production project
2. Navigate to: **SQL Editor**
3. Open `supabase/migrations/insert_consently_widget.sql`
4. Copy the entire content
5. Paste into SQL Editor and click **Run**

**Option B: Via Supabase CLI**
```bash
# Make sure you're connected to production
supabase db push --db-url "your-production-database-url"
```

### 4. Verify

Test the widget endpoint:
```bash
curl https://www.consently.in/api/dpdpa/widget-public/dpdpa_mheon92d_o34gdpk
```

You should get a JSON response with widget configuration instead of a 404 error.

## Important Notes

- ✅ This is a **one-time migration** for this specific widget only
- ✅ All future widgets created through the dashboard will be stored automatically
- ✅ The migration uses `ON CONFLICT` clauses, so it's safe to run multiple times
- ✅ If the widget already exists, it will be updated instead of causing an error

## After Migration

Once the migration is complete, your widget will work on:
- https://www.consently.in (production)
- The widget will load properly on any site using this widget ID
