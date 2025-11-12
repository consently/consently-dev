-- Check if blog posts exist and their status
-- Run this to verify the data was inserted correctly

-- Check total count
SELECT COUNT(*) as total_posts FROM blog_posts;

-- Check published posts
SELECT COUNT(*) as published_posts FROM blog_posts WHERE published = true;

-- Check posts with published_at
SELECT COUNT(*) as posts_with_date FROM blog_posts WHERE published_at IS NOT NULL;

-- View all posts with key fields
SELECT 
  id,
  title,
  slug,
  published,
  published_at,
  created_at,
  category
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'blog_posts';

