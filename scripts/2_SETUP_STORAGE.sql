-- ============================================================================
-- SETUP STORAGE BUCKETS FOR KESTI POS
-- ============================================================================
-- This script creates and configures the storage bucket for product images
-- Run this after the main database setup
-- ============================================================================

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Set up storage policies for product-images bucket
-- Policy 1: Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy 3: Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Policy 4: Allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the setup:
--
-- 1. Check bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'product-images';
--
-- 2. Check policies are active:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%images%';
--
-- 3. Test URL format (replace with actual file):
-- SELECT concat('https://your-project.supabase.co/storage/v1/object/public/product-images/', 'test.jpg');
-- ============================================================================
