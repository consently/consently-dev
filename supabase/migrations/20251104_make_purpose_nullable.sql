-- Migration: Make legacy purpose column nullable
-- Date: 2025-11-04
-- Description: 
--   The 'purpose' column in processing_activities is a legacy field that's been
--   replaced by the activity_purposes table structure. This migration makes it
--   nullable so new activities using the structured format don't need to provide it.

-- Make the purpose column nullable (remove NOT NULL constraint)
ALTER TABLE processing_activities 
  ALTER COLUMN purpose DROP NOT NULL;

-- Also make retention_period nullable for the same reason
ALTER TABLE processing_activities 
  ALTER COLUMN retention_period DROP NOT NULL;

-- Update the comments to clarify these are legacy fields
COMMENT ON COLUMN processing_activities.purpose IS 
  'DEPRECATED: Legacy field. Use activity_purposes table instead. Nullable for new structured activities.';

COMMENT ON COLUMN processing_activities.retention_period IS 
  'DEPRECATED: Legacy field. Use purpose_data_categories.retention_period instead. Nullable for new structured activities.';

COMMENT ON COLUMN processing_activities.data_attributes IS 
  'DEPRECATED: Legacy field. Use purpose_data_categories table instead. Nullable for new structured activities.';

-- Migration complete
