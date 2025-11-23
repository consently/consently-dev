# Scripts Directory

This directory contains build scripts, utilities, and archived development/testing scripts.

## Active Scripts

### Build Scripts
- **build-widget.js** - Compiles and minifies the DPDPA widget for production
- **export-widget.ts** - Exports widget configurations
- **organize-docs.ts** - Organizes documentation files

### Migration & Setup Scripts
- **apply-purposes-migration.ts** - Applies purposes migration to database
- **import-indian-languages.js** - Imports Indian language translations
- **setup-email-verification.sh** - Sets up email verification infrastructure
- **verify-env-setup.sh** - Verifies environment configuration
- **list-widgets.ts** - Lists all configured widgets

## SQL Scripts

Located in `scripts/sql/`:
- **apply_email_columns_migration.sql** - Adds email columns to tables
- **check_email_columns.sql** - Diagnostic script for email columns

Additional SQL files are in `supabase/migrations/` for version-controlled migrations.

## Archived Scripts

Located in `scripts/archive/`:

Contains **37 test and diagnostic scripts** used during development and debugging:
- Test scripts (`test-*.ts`, `test-*.js`) - Used for testing specific features
- Diagnostic scripts (`diagnose-*.ts`, `check-*.ts`) - Used for debugging issues
- Debug scripts (`debug-*.ts`) - One-time debugging utilities
- Cleanup utilities (`cleanup-*.ts`) - Database cleanup scripts
- Backfill scripts - Historical data backfill utilities

These scripts are preserved for reference but are not actively maintained.

## Usage

### Build the Widget
```bash
node scripts/build-widget.js
```

### List Configured Widgets
```bash
npx tsx scripts/list-widgets.ts
```

### Apply Purposes Migration
```bash
npx tsx scripts/apply-purposes-migration.ts
```

## Notes

- **Build scripts** are essential for production deployment
- **Migration scripts** should be run with caution in production
- **Archived scripts** are for reference only
- Most SQL operations should use Supabase migrations instead of standalone SQL files
