-- Comprehensive fix for blog posts visibility issues
-- Run this script to fix RLS policies and ensure blog posts are accessible

-- Step 1: Check current state
SELECT 
  'Total posts' as check_type,
  COUNT(*)::text as result
FROM blog_posts
UNION ALL
SELECT 
  'Published posts' as check_type,
  COUNT(*)::text as result
FROM blog_posts WHERE published = true
UNION ALL
SELECT 
  'Posts with published_at' as check_type,
  COUNT(*)::text as result
FROM blog_posts WHERE published_at IS NOT NULL;

-- Step 2: Fix published_at for any posts that are missing it
UPDATE blog_posts
SET published_at = COALESCE(published_at, created_at, NOW())
WHERE published = true AND published_at IS NULL;

-- Step 3: Ensure tags are properly formatted (should be array)
-- Check if any posts have null tags
UPDATE blog_posts
SET tags = COALESCE(tags, ARRAY[]::TEXT[])
WHERE tags IS NULL;

-- Step 4: Drop and recreate RLS policy to ensure it works for anonymous users
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;

-- Create policy that explicitly allows public and anonymous access
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  TO public, anon, authenticated
  USING (published = true);

-- Step 5: Verify the policy was created
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

-- Step 6: Test query (should return published posts)
SELECT 
  slug,
  title,
  published,
  published_at IS NOT NULL as has_date,
  array_length(tags, 1) as tag_count
FROM blog_posts
WHERE published = true
ORDER BY published_at DESC
LIMIT 5;

