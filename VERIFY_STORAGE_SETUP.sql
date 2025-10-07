  -- =====================================================
-- KESTI 4 POS: Verify Storage Setup
-- Run this to check if everything is configured correctly
-- =====================================================

-- 1. Check if product-images bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'product-images';

-- Expected: 1 row with name='product-images', public=true

-- =====================================================

-- 2. Check existing storage policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Expected: Should see policies for product-images bucket

-- =====================================================

-- 3. Check if you can list files in the bucket (as authenticated user)
-- This is a read test - run this after logging in
SELECT * FROM storage.objects 
WHERE bucket_id = 'product-images' 
LIMIT 5;

-- Expected: Should return rows (or empty if no files uploaded yet)
-- If you get an error, your policies aren't set up correctly
