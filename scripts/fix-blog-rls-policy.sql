-- Fix RLS policy to ensure blog posts are publicly readable
-- This ensures anonymous users can read published blog posts

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;

-- Create a new policy that explicitly allows anonymous reads
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Also ensure the policy allows service role (for API calls)
-- This is usually handled automatically, but let's be explicit
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'blog_posts';

