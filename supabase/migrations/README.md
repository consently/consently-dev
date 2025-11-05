# Database Migrations

## Overview
This directory contains SQL migration scripts for the Supabase database. The migrations have been redesigned to be clean, idempotent, and easy to understand.

## Migration Strategy

### Fresh Installation
If you're setting up a new database, simply run the migrations in order:

1. `01_create_purposes_unified.sql` - Creates the unified purposes system

### Existing Database (Need to Reset)
If you have an existing database and need to reset the purposes table:

1. **BACKUP YOUR DATA FIRST!**
2. Run `00_rollback_purposes.sql` - Removes old purposes table
3. Run `01_create_purposes_unified.sql` - Creates clean purposes system

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
2. Execute the migration file contents in order

## Available Migrations

### 00_rollback_purposes.sql
**Purpose:** Clean rollback script to remove old purposes implementation

**⚠️ WARNING:** This will delete ALL custom purposes created by users!

**Changes:**
- Drops all RLS policies on purposes table
- Drops all indexes
- Drops the purposes table with CASCADE (removes all references)

**When to use:**
- Only when you need to completely reset the purposes system
- When migrating from an old implementation
- When fixing a broken migration state

**Before Running:**
```sql
-- Backup your purposes data
CREATE TABLE purposes_backup AS SELECT * FROM purposes;
```

### 01_create_purposes_unified.sql
**Purpose:** Creates a clean, unified purposes system for DPDPA compliance

**What it creates:**
- `purposes` table with all necessary fields
- Indexes for performance optimization
- RLS policies for security
- Predefined purposes (10 standard purposes)
- Trigger for automatic `updated_at` management

**Key Features:**
- Idempotent (safe to run multiple times)
- Handles both predefined and custom purposes in one table
- Uses `is_predefined` flag to distinguish purpose types
- Case-insensitive unique constraint on `purpose_name`

**Fields:**
- `id` - UUID primary key
- `purpose_name` - Unique identifier (VARCHAR 255)
- `name` - Display name (VARCHAR 255)
- `description` - Detailed description (TEXT)
- `data_category` - Optional metadata for data sources (VARCHAR 255)
- `retention_period` - Optional metadata for data recipients (VARCHAR 255)
- `is_predefined` - Boolean flag (true = predefined, false = custom)
- `created_at` - Timestamp with timezone
- `updated_at` - Timestamp with timezone (auto-updated)

## Post-Migration Verification

After applying the migrations, verify the setup:

```sql
-- Check table structure
\d purposes

-- Count purposes by type
SELECT 
  COUNT(*) as total_purposes,
  COUNT(*) FILTER (WHERE is_predefined = true) as predefined_count,
  COUNT(*) FILTER (WHERE is_predefined = false) as custom_count
FROM purposes;

-- View all predefined purposes
SELECT id, purpose_name, name, description
FROM purposes
WHERE is_predefined = true
ORDER BY purpose_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'purposes';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'purposes';
```

Expected results:
- **total_purposes**: 10 (or more if custom purposes exist)
- **predefined_count**: 10
- **custom_count**: 0 (initially)
- **RLS policies**: 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **Indexes**: 5 indexes

## Rollback Instructions

If you need to rollback the unified purposes migration:

```sql
-- This is what 00_rollback_purposes.sql does
DROP POLICY IF EXISTS "Allow authenticated users to delete custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to update custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to create custom purposes" ON purposes;
DROP POLICY IF EXISTS "Allow authenticated users to read purposes" ON purposes;

DROP INDEX IF EXISTS idx_purposes_created_at;
DROP INDEX IF EXISTS idx_purposes_data_category;
DROP INDEX IF EXISTS idx_purposes_is_predefined;
DROP INDEX IF EXISTS idx_purposes_name;
DROP INDEX IF EXISTS idx_purposes_purpose_name;

DROP TABLE IF EXISTS purposes CASCADE;
```

## Testing Custom Purposes

After migration, test the custom purposes functionality:

```sql
-- Create a test custom purpose (as an authenticated user)
INSERT INTO purposes (purpose_name, name, description, is_predefined)
VALUES (
  'Test Custom Purpose',
  'Test Custom Purpose',
  'This is a test custom purpose',
  false
);

-- Verify it was created
SELECT * FROM purposes WHERE is_predefined = false;

-- Clean up test
DELETE FROM purposes WHERE purpose_name = 'Test Custom Purpose';
```

## Architecture Notes

### Unified Design
The purposes system uses a **single table** for both predefined and custom purposes:

- **Predefined purposes** (`is_predefined = true`):
  - Created by system migrations
  - Cannot be modified or deleted by users
  - Always available to all users
  - 10 standard purposes covering common use cases

- **Custom purposes** (`is_predefined = false`):
  - Created by users via API
  - Can be modified and deleted by users
  - Unique per `purpose_name` (case-insensitive)
  - Stored in same table as predefined purposes

### Security (RLS Policies)
- **SELECT**: All authenticated users can read all purposes
- **INSERT**: Users can only create custom purposes (`is_predefined = false`)
- **UPDATE**: Users can only update custom purposes
- **DELETE**: Users can only delete custom purposes

### Relationships
```
purposes (unified table)
  ↓ (referenced by)
activity_purposes
  ↓ (contains)
purpose_data_categories
```

The `activity_purposes` table links processing activities to purposes (both predefined and custom).

## Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution:** The migration is idempotent. If the table exists, it will be used. To start fresh, run `00_rollback_purposes.sql` first.

### Issue: Cannot create custom purposes
**Solution:** Check RLS policies are correctly set up:
```sql
SELECT * FROM pg_policies WHERE tablename = 'purposes';
```

### Issue: Predefined purposes not showing up
**Solution:** Run the INSERT statement from `01_create_purposes_unified.sql` again. It uses `ON CONFLICT DO UPDATE` so it's safe to run multiple times.

### Issue: Custom purpose with same name as predefined purpose
**Solution:** The `purpose_name` field has a UNIQUE constraint. Choose a different name.

## Support

For more information about the purposes system, see:
- `/PURPOSES_SYSTEM_DOCUMENTATION.md` - Complete system documentation
- `/docs/DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md` - DPDPA implementation guide

## Changelog

### 2025-01-05 - v2 (Current)
- Consolidated three separate migrations into one unified migration
- Added rollback script for clean database reset
- Improved documentation and idempotency
- Added trigger for automatic `updated_at` management
- Enhanced RLS policies

### 2025-01-05 - v1 (Deprecated)
- Initial separate migrations (removed):
  - `20250105_create_purposes_table.sql`
  - `20250105_add_purposes_fields.sql`
  - `20250105_fix_purposes_rls.sql`
