# Setting Up Supabase Storage for KESTI POS

To ensure product image uploads work correctly, you need to set up storage buckets in your Supabase project.

## Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Storage" in the left sidebar
4. Click "Create bucket"
5. Create a bucket named `product-images`
6. Enable public access for the bucket
7. Set file size limit to 5MB (or your preferred limit)

## Option 2: Using the Setup Script

We've included a script that attempts to create the necessary storage buckets automatically:

1. Make sure your `.env` file contains the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only needed for script
   ```

2. Run the setup script:
   ```bash
   node scripts/create-storage-buckets.js
   ```

3. Check the output for any errors or additional setup steps required

## Storage Policies

For the upload functionality to work correctly, you need the following storage policies:

### For product-images bucket:
1. **Public Read Access**: Anyone can view images
   ```sql
   CREATE POLICY "Public Access" 
   ON storage.objects FOR SELECT 
   USING (bucket_id = 'product-images');
   ```

2. **Authenticated Upload Access**: Only authenticated users can upload
   ```sql
   CREATE POLICY "Authenticated Upload Access" 
   ON storage.objects FOR INSERT 
   WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'product-images');
   ```

3. **Owner Update/Delete Access**: Only the owner can update/delete their uploads
   ```sql
   CREATE POLICY "Owner Update/Delete Access" 
   ON storage.objects FOR UPDATE, DELETE
   USING (auth.uid() = owner AND bucket_id = 'product-images');
   ```

## Troubleshooting

If you encounter issues with image uploads:

1. Check if the bucket exists (via Supabase dashboard)
2. Verify your RLS policies are set correctly
3. Make sure you're using the latest Supabase JS client
4. Check browser console for any upload errors
5. Verify your authentication is working correctly

For any persistent issues, you can always use the URL input field as a fallback.
