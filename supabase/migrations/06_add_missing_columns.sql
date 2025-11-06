-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-06
-- Purpose: Add missing columns to existing cookie widget tables
-- ============================================================================

-- Check and add missing columns to banner_configs
DO $$ 
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'banner_configs' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE banner_configs ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: banner_configs.is_active';
  END IF;

  -- Add is_default column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'banner_configs' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE banner_configs ADD COLUMN is_default BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: banner_configs.is_default';
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'banner_configs' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE banner_configs ADD COLUMN description TEXT;
    RAISE NOTICE 'Added column: banner_configs.description';
  END IF;
END $$;

-- Check and add missing columns to widget_configs
DO $$ 
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: widget_configs.is_active';
  END IF;

  -- Add banner_template_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'banner_template_id'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN banner_template_id UUID REFERENCES banner_configs(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added column: widget_configs.banner_template_id';
  END IF;

  -- Add position column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN position VARCHAR(50);
    RAISE NOTICE 'Added column: widget_configs.position';
  END IF;

  -- Add layout column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'layout'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN layout VARCHAR(50);
    RAISE NOTICE 'Added column: widget_configs.layout';
  END IF;

  -- Add theme column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'theme'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN theme JSONB;
    RAISE NOTICE 'Added column: widget_configs.theme';
  END IF;

  -- Add supported_languages column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'supported_languages'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[];
    RAISE NOTICE 'Added column: widget_configs.supported_languages';
  END IF;

  -- Add banner_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'banner_content'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN banner_content JSONB;
    RAISE NOTICE 'Added column: widget_configs.banner_content';
  END IF;

  -- Add auto_show column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'auto_show'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN auto_show BOOLEAN;
    RAISE NOTICE 'Added column: widget_configs.auto_show';
  END IF;

  -- Add show_after_delay column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_configs' 
    AND column_name = 'show_after_delay'
  ) THEN
    ALTER TABLE widget_configs ADD COLUMN show_after_delay INTEGER;
    RAISE NOTICE 'Added column: widget_configs.show_after_delay';
  END IF;
END $$;

-- Add missing indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_banner_configs_is_active'
  ) THEN
    CREATE INDEX idx_banner_configs_is_active ON banner_configs(is_active);
    RAISE NOTICE 'Created index: idx_banner_configs_is_active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_banner_configs_is_default'
  ) THEN
    CREATE INDEX idx_banner_configs_is_default ON banner_configs(is_default);
    RAISE NOTICE 'Created index: idx_banner_configs_is_default';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_widget_configs_is_active'
  ) THEN
    CREATE INDEX idx_widget_configs_is_active ON widget_configs(is_active);
    RAISE NOTICE 'Created index: idx_widget_configs_is_active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_widget_configs_banner_template_id'
  ) THEN
    CREATE INDEX idx_widget_configs_banner_template_id ON widget_configs(banner_template_id);
    RAISE NOTICE 'Created index: idx_widget_configs_banner_template_id';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
  RAISE NOTICE 'You can now run the previous migration again if needed.';
END $$;
