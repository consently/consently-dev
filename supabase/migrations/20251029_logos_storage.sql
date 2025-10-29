-- ============================================================================
-- LOGO STORAGE BUCKET SETUP
-- ============================================================================
-- 
-- Bucket "logos" has been created via Supabase Dashboard with:
--    - Name: logos
--    - Public bucket: YES (enabled)
--    - File size limit: 2 MB (2097152 bytes)
--    - Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp
-- 
-- Now adding storage policies for access control...
-- ============================================================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can upload logos to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to logos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload logos to their own folder
CREATE POLICY "Users can upload logos to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all logos (displayed on public widgets)
CREATE POLICY "Public read access to logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Confirm policies are created
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'LOGO STORAGE POLICIES CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  ✓ Upload logos to their own folder';
  RAISE NOTICE '  ✓ Update their own logos';
  RAISE NOTICE '  ✓ Delete their own logos';
  RAISE NOTICE '  ✓ Public can view all logos (for widget display)';
  RAISE NOTICE '============================================================================';
END $$;
