-- Add INSERT policy for users table
-- This allows authenticated users to create their own profile record

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
