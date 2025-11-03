-- Migration: Refactor Processing Activities for Multiple Purposes and Per-Category Retention
-- Date: 2025-11-03
-- Description: 
--   - Creates new tables for purposes and data categories with retention periods
--   - Each processing activity can have multiple purposes
--   - Each purpose can have multiple data categories with individual retention periods
--   - Maintains backward compatibility with existing data

-- ============================================================================
-- STEP 1: Create new tables
-- ============================================================================

-- Table: purposes (master list of purpose options)
CREATE TABLE IF NOT EXISTS purposes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purpose_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_predefined BOOLEAN DEFAULT FALSE, -- True for system/template purposes, False for custom
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: activity_purposes (junction table - links activities to purposes)
CREATE TABLE IF NOT EXISTS activity_purposes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  purpose_id UUID NOT NULL REFERENCES purposes(id) ON DELETE CASCADE,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal-obligation', 'legitimate-interest')),
  custom_description TEXT, -- Additional context for this specific purpose
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, purpose_id) -- Prevent duplicate purpose assignments
);

-- Table: purpose_data_categories (data categories per purpose with retention)
CREATE TABLE IF NOT EXISTS purpose_data_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_purpose_id UUID NOT NULL REFERENCES activity_purposes(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  retention_period TEXT NOT NULL, -- e.g., "3 years", "Until account deletion"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_purpose_id, category_name) -- Prevent duplicate categories per purpose
);

-- Table: data_sources (sources from which data is collected)
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, source_name)
);

-- Table: data_recipients (recipients who receive the data)
CREATE TABLE IF NOT EXISTS data_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, recipient_name)
);

-- ============================================================================
-- STEP 2: Add new columns to processing_activities (for additional metadata)
-- ============================================================================

ALTER TABLE processing_activities 
  ADD COLUMN IF NOT EXISTS legal_basis TEXT CHECK (legal_basis IN ('consent', 'contract', 'legal-obligation', 'legitimate-interest'));

-- Mark old columns as deprecated (we'll keep them for backward compatibility)
COMMENT ON COLUMN processing_activities.purpose IS 'DEPRECATED: Use activity_purposes table instead';
COMMENT ON COLUMN processing_activities.retention_period IS 'DEPRECATED: Use purpose_data_categories.retention_period instead';
COMMENT ON COLUMN processing_activities.data_attributes IS 'DEPRECATED: Use purpose_data_categories table instead';

-- ============================================================================
-- STEP 3: Create indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purposes_purpose_name ON purposes(purpose_name);
CREATE INDEX IF NOT EXISTS idx_purposes_is_predefined ON purposes(is_predefined);

CREATE INDEX IF NOT EXISTS idx_activity_purposes_activity_id ON activity_purposes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_purposes_purpose_id ON activity_purposes(purpose_id);

CREATE INDEX IF NOT EXISTS idx_purpose_data_categories_activity_purpose_id ON purpose_data_categories(activity_purpose_id);
CREATE INDEX IF NOT EXISTS idx_purpose_data_categories_category_name ON purpose_data_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_data_sources_activity_id ON data_sources(activity_id);
CREATE INDEX IF NOT EXISTS idx_data_recipients_activity_id ON data_recipients(activity_id);

-- ============================================================================
-- STEP 4: Add updated_at triggers
-- ============================================================================

CREATE TRIGGER update_purposes_updated_at
  BEFORE UPDATE ON purposes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_purposes_updated_at
  BEFORE UPDATE ON activity_purposes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purpose_data_categories_updated_at
  BEFORE UPDATE ON purpose_data_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purpose_data_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_recipients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS Policies
-- ============================================================================

-- Purposes: Read-only for all authenticated users (shared resource)
CREATE POLICY "Anyone can read purposes" ON purposes
  FOR SELECT USING (true);

-- Activity Purposes: Users can manage their own activity purposes
CREATE POLICY "Users can view own activity purposes" ON activity_purposes
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activity purposes" ON activity_purposes
  FOR INSERT WITH CHECK (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activity purposes" ON activity_purposes
  FOR UPDATE USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activity purposes" ON activity_purposes
  FOR DELETE USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

-- Purpose Data Categories: Users can manage their own categories
CREATE POLICY "Users can view own data categories" ON purpose_data_categories
  FOR SELECT USING (
    activity_purpose_id IN (
      SELECT ap.id FROM activity_purposes ap
      JOIN processing_activities pa ON ap.activity_id = pa.id
      WHERE pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own data categories" ON purpose_data_categories
  FOR INSERT WITH CHECK (
    activity_purpose_id IN (
      SELECT ap.id FROM activity_purposes ap
      JOIN processing_activities pa ON ap.activity_id = pa.id
      WHERE pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own data categories" ON purpose_data_categories
  FOR UPDATE USING (
    activity_purpose_id IN (
      SELECT ap.id FROM activity_purposes ap
      JOIN processing_activities pa ON ap.activity_id = pa.id
      WHERE pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own data categories" ON purpose_data_categories
  FOR DELETE USING (
    activity_purpose_id IN (
      SELECT ap.id FROM activity_purposes ap
      JOIN processing_activities pa ON ap.activity_id = pa.id
      WHERE pa.user_id = auth.uid()
    )
  );

-- Data Sources: Users can manage their own data sources
CREATE POLICY "Users can view own data sources" ON data_sources
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own data sources" ON data_sources
  FOR INSERT WITH CHECK (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own data sources" ON data_sources
  FOR DELETE USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

-- Data Recipients: Users can manage their own data recipients
CREATE POLICY "Users can view own data recipients" ON data_recipients
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own data recipients" ON data_recipients
  FOR INSERT WITH CHECK (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own data recipients" ON data_recipients
  FOR DELETE USING (
    activity_id IN (
      SELECT id FROM processing_activities WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Insert predefined common purposes (from the UI screenshot)
-- ============================================================================

INSERT INTO purposes (purpose_name, description, is_predefined) VALUES
  ('Enable Order Tracking', 'Track and monitor customer orders throughout the fulfillment process', true),
  ('Manage Billing & Payments', 'Process payments, generate invoices, and maintain billing records', true),
  ('Provide Customer Support', 'Handle customer inquiries, resolve issues, and improve satisfaction', true),
  ('Marketing Communications', 'Send promotional content, newsletters, and personalized offers', true),
  ('Analytics & Reporting', 'Analyze user behavior, generate insights, and create reports', true),
  ('Account Management', 'Create, maintain, and manage user accounts and profiles', true),
  ('Product Recommendations', 'Provide personalized product suggestions based on user preferences', true),
  ('Fraud Prevention', 'Detect and prevent fraudulent activities and unauthorized access', true),
  ('Service Improvement', 'Improve products, services, and user experience', true),
  ('Legal Compliance', 'Comply with legal obligations and regulatory requirements', true)
ON CONFLICT (purpose_name) DO NOTHING;

-- ============================================================================
-- STEP 8: Data Migration Helper View (for backward compatibility)
-- ============================================================================

-- Create a view that provides the old data structure for existing code
CREATE OR REPLACE VIEW processing_activities_legacy AS
SELECT 
  pa.id,
  pa.user_id,
  pa.activity_name,
  pa.industry,
  pa.purpose, -- Legacy field
  pa.retention_period, -- Legacy field
  pa.data_attributes, -- Legacy field
  pa.data_processors,
  pa.legal_basis,
  pa.is_active,
  pa.created_at,
  pa.updated_at,
  -- Aggregate new structure data for reference
  (
    SELECT json_agg(json_build_object(
      'purpose_id', ap.purpose_id,
      'purpose_name', p.purpose_name,
      'legal_basis', ap.legal_basis,
      'custom_description', ap.custom_description,
      'data_categories', (
        SELECT json_agg(json_build_object(
          'category_name', pdc.category_name,
          'retention_period', pdc.retention_period
        ))
        FROM purpose_data_categories pdc
        WHERE pdc.activity_purpose_id = ap.id
      )
    ))
    FROM activity_purposes ap
    JOIN purposes p ON ap.purpose_id = p.id
    WHERE ap.activity_id = pa.id
  ) AS purposes_structured
FROM processing_activities pa;

-- ============================================================================
-- STEP 9: Comments for documentation
-- ============================================================================

COMMENT ON TABLE purposes IS 'Master list of purpose options for data processing activities';
COMMENT ON TABLE activity_purposes IS 'Junction table linking processing activities to their purposes';
COMMENT ON TABLE purpose_data_categories IS 'Data categories for each purpose with individual retention periods';
COMMENT ON TABLE data_sources IS 'Sources from which data is collected for processing activities';
COMMENT ON TABLE data_recipients IS 'Recipients who receive data from processing activities';

COMMENT ON COLUMN activity_purposes.legal_basis IS 'Legal basis for this specific purpose: consent, contract, legal-obligation, or legitimate-interest';
COMMENT ON COLUMN purpose_data_categories.retention_period IS 'How long this specific data category will be retained (e.g., "3 years", "Until account deletion")';

-- ============================================================================
-- Migration Complete
-- ============================================================================
