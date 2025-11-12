-- Comprehensive diagnostic and fix script for blog posts
-- Run this to check and fix any issues

-- Step 1: Check if posts exist
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

-- Step 2: View sample posts
SELECT 
  id,
  title,
  slug,
  published,
  published_at,
  category,
  created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Fix any posts that have published=true but no published_at
UPDATE blog_posts
SET published_at = created_at
WHERE published = true AND published_at IS NULL;

-- Step 4: Ensure all inserted posts have published_at set
UPDATE blog_posts
SET published_at = COALESCE(published_at, created_at)
WHERE published = true;

-- Step 5: Verify RLS policy exists and is correct
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;

CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  TO public, anon, authenticated
  USING (published = true);

-- Step 6: Final verification
SELECT 
  'After fix - Published posts' as check_type,
  COUNT(*)::text as result
FROM blog_posts 
WHERE published = true AND published_at IS NOT NULL;

