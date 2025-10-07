-- =====================================================
-- KESTI 4 POS: Storage Bucket Setup
-- Run this in Supabase SQL Editor to create storage buckets
-- =====================================================

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies for product-images bucket
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
-- Verification Query
-- =====================================================
-- Run this to verify the bucket was created successfully
SELECT * FROM storage.buckets WHERE name = 'product-images';
