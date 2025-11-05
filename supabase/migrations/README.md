# Database Migrations

## Overview
This directory contains SQL migration scripts for the Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Paste and execute the SQL

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
1. Connect to your Supabase database using your preferred SQL client
2. Execute the migration file contents

## Available Migrations

### 20250105_add_purposes_fields.sql
**Purpose:** Adds support for additional metadata to the purposes table for DPDPA compliance.

**Changes:**
- Adds `name` column (VARCHAR 255) - Display name for the purpose
- Adds `data_category` column (VARCHAR 255) - Category of data processed
- Adds `retention_period` column (VARCHAR 255) - Data retention period
- Updates existing records to populate `name` from `purpose_name`
- Creates indexes for better query performance

**Before Running:**
- Backup your `purposes` table
- Ensure no active transactions are running

**To Apply:**
```sql
-- Connect to your Supabase database and run:
\i supabase/migrations/20250105_add_purposes_fields.sql
```

## Rollback Instructions

If you need to rollback the purposes migration:

```sql
-- Remove the new columns
ALTER TABLE purposes 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS data_category,
  DROP COLUMN IF EXISTS retention_period;

-- Drop the indexes
DROP INDEX IF EXISTS idx_purposes_name;
DROP INDEX IF EXISTS idx_purposes_data_category;
```

## Post-Migration Verification

After applying the migration, verify:

```sql
-- Check the new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purposes' 
AND column_name IN ('name', 'data_category', 'retention_period');

-- Check that existing data was migrated
SELECT id, purpose_name, name, description 
FROM purposes 
LIMIT 5;
```

## Notes
- All migrations are idempotent (safe to run multiple times)
- The `description` column should already exist in your purposes table
- The migration uses `IF NOT EXISTS` to prevent errors if columns already exist
