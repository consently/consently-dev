-- Create table for user cookie preferences
CREATE TABLE IF NOT EXISTS user_cookie_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  widget_id text REFERENCES widget_configs(widget_id) ON DELETE CASCADE NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure one preference record per user per widget
  UNIQUE(user_id, widget_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cookie_preferences_user_widget ON user_cookie_preferences(user_id, widget_id);

-- Create index for widget_id
CREATE INDEX IF NOT EXISTS idx_user_cookie_preferences_widget_id ON user_cookie_preferences(widget_id);

-- RLS policies
ALTER TABLE user_cookie_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own cookie preferences" ON user_cookie_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own cookie preferences" ON user_cookie_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own cookie preferences" ON user_cookie_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own cookie preferences" ON user_cookie_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_cookie_preferences_updated_at
  BEFORE UPDATE ON user_cookie_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
