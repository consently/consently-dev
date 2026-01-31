# Age Verification Module Removal Migration

## Overview
This migration removes all database tables, columns, and constraints related to the Age Verification, DigiLocker, and API Setu integration that has been deprecated.

## Files

### 1. `202502010001_remove_age_verification_module.sql`
**Purpose**: Main migration file to remove age verification components from the database.

**What it removes:**
- `age_verification_sessions` table - Stores DigiLocker age verification sessions
- `meripehchaan_consent_artefacts` table - Stores MeriPehchaan consent artifacts
- Columns from `dpdpa_widget_configs`:
  - `enable_age_gate`
  - `age_gate_threshold`
  - `age_gate_minor_message`
  - `require_age_verification`
  - `age_verification_threshold`
  - `age_verification_provider`
  - `minor_handling`
  - `minor_guardian_message`
  - `verification_validity_days`
- Column from `dpdpa_consent_records`:
  - `age_verification_id`
- Related foreign key constraints and indexes

### 2. `202502010001_remove_age_verification_module_rollback.sql`
**Purpose**: Rollback script to restore the age verification components if needed.

**⚠️ Warning**: This rollback script recreates the tables but cannot restore deleted data.

## How to Run

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `202502010001_remove_age_verification_module.sql`
4. Run the script

### Option 2: Using Supabase CLI
```bash
# If using Supabase CLI locally
supabase db reset

# Or apply the migration directly
psql $DATABASE_URL -f supabase/migrations/202502010001_remove_age_verification_module.sql
```

### Option 3: Using psql
```bash
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
psql $DATABASE_URL -f supabase/migrations/202502010001_remove_age_verification_module.sql
```

## Pre-Migration Checklist

Before running this migration, ensure:

- [ ] You have backed up your database (strongly recommended)
- [ ] You have verified no active code depends on these tables/columns
- [ ] You have communicated the change to your team
- [ ] You understand this will delete all existing age verification data

## Verification

After running the migration, verify the removal:

```sql
-- Check if tables are removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('age_verification_sessions', 'meripehchaan_consent_artefacts');
-- Should return 0 rows

-- Check if columns are removed from dpdpa_widget_configs
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dpdpa_widget_configs' 
AND column_name LIKE '%age%';
-- Should return 0 rows

-- Check if age_verification_id column is removed from dpdpa_consent_records
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dpdpa_consent_records' 
AND column_name = 'age_verification_id';
-- Should return 0 rows
```

## Rollback

If you need to rollback this migration:

1. Run the rollback script: `202502010001_remove_age_verification_module_rollback.sql`
2. Note that data will NOT be restored - only the schema structure

## Related Code Changes

This database migration should be accompanied by:
- Removal of age verification API routes
- Removal of DigiLocker integration code
- Removal of API Setu integration code
- Update to widget configuration interfaces

See the related commits in the codebase for complete removal.

## Support

If you encounter issues:
1. Check the Supabase logs for specific error messages
2. Ensure you have proper permissions to alter tables
3. Verify no other tables have foreign keys to the removed tables
4. Consider running the migration in a transaction (BEGIN/COMMIT are included)
