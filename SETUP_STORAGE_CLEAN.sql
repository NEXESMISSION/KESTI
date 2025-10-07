-- =====================================================
-- KESTI 4 POS: Storage Bucket Setup (Clean Version)
-- This version won't error if policies already exist
-- =====================================================

-- Step 1: Create product-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- Step 2: Remove old policies (if they exist)
-- =====================================================

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update/Delete Access" ON storage.objects;

-- =====================================================
-- Step 3: Create fresh policies
-- =====================================================

-- 1. Public Read Access - Anyone can view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Authenticated Upload Access - Only authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Authenticated Update Access - Users can update their own uploads
CREATE POLICY "Authenticated users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated Delete Access - Users can delete their own uploads
CREATE POLICY "Authenticated users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- =====================================================
-- Verification: Check what was created
-- =====================================================

-- Check bucket
SELECT 
  'Bucket Created:' as status,
  name, 
  public, 
  file_size_limit/1024/1024 as "size_limit_MB"
FROM storage.buckets 
WHERE name = 'product-images';

-- Check policies
SELECT 
  'Policies Created:' as status,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%product-images%' OR policyname IN ('Public Access', 'Authenticated users can upload images', 'Authenticated users can update own images', 'Authenticated users can delete own images');

-- =====================================================
-- ✅ Setup Complete!
-- =====================================================
-- You should see:
-- - 1 row showing product-images bucket with public=true
-- - 1 row showing 4 policies created
--
-- Now test uploading an image in your app!
-- =====================================================
