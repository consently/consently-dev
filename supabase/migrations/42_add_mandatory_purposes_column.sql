-- Migration: Add mandatory_purposes column to dpdpa_widget_configs
-- Description: Add a column to store purpose IDs that cannot be deselected by users in the widget

-- Add mandatory_purposes column (array of purpose UUIDs)
ALTER TABLE dpdpa_widget_configs 
ADD COLUMN IF NOT EXISTS mandatory_purposes UUID[] DEFAULT ARRAY[]::UUID[];

-- Add constraint to limit the number of mandatory purposes (same as selected_activities)
ALTER TABLE dpdpa_widget_configs 
ADD CONSTRAINT valid_mandatory_purposes 
CHECK (array_length(mandatory_purposes, 1) IS NULL OR array_length(mandatory_purposes, 1) <= 100);

-- Add comment
COMMENT ON COLUMN dpdpa_widget_configs.mandatory_purposes IS 'Array of purpose UUIDs that users cannot deselect in the consent widget';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added mandatory_purposes column to dpdpa_widget_configs';
END $$;
