-- Migration: Link Widget Configs to Banner Templates
-- This creates the connection between widget settings and banner design templates

-- Add banner_template_id column to widget_configs (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'banner_template_id'
  ) THEN
    ALTER TABLE widget_configs 
    ADD COLUMN banner_template_id UUID REFERENCES banner_configs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_widget_configs_banner_template_id 
ON widget_configs(banner_template_id);

-- Add comment for documentation
COMMENT ON COLUMN widget_configs.banner_template_id IS 
'Links widget configuration to a specific banner template design. If NULL, uses default banner template.';

-- Optionally set existing widgets to use the default banner template for each user
-- This helps with backward compatibility
UPDATE widget_configs wc
SET banner_template_id = bc.id
FROM banner_configs bc
WHERE wc.user_id = bc.user_id 
  AND bc.is_default = true
  AND wc.banner_template_id IS NULL;

-- If no default exists, use the most recently created active banner
UPDATE widget_configs wc
SET banner_template_id = bc.id
FROM (
  SELECT DISTINCT ON (bc.user_id) 
    bc.id, 
    bc.user_id
  FROM banner_configs bc
  WHERE bc.is_active = true
  ORDER BY bc.user_id, bc.created_at DESC
) bc
WHERE wc.user_id = bc.user_id 
  AND wc.banner_template_id IS NULL;
