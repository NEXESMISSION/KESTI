// =====================================================
// KESTI 4 POS: Automated Storage Bucket Setup
// =====================================================
// This script creates the necessary storage buckets for product images
// Run with: node scripts/create-storage-buckets.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('\n🚀 KESTI 4 POS - Storage Bucket Setup\n');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env file');
  console.log('\nPlease add to your .env file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  console.log('\nPlease add to your .env file:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('OR');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('✓ Supabase credentials found');
console.log(`✓ Project: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
  try {
    console.log('📦 Checking existing buckets...');
    
    // List all existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      console.log('\n⚠️  This might be a permissions issue.');
      console.log('💡 Try using SUPABASE_SERVICE_ROLE_KEY instead of ANON_KEY');
      return;
    }
    
    console.log(`✓ Found ${buckets.length} existing bucket(s)\n`);
    
    // Check if product-images bucket exists
    const productBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (productBucketExists) {
      console.log('✅ product-images bucket already exists!');
      console.log('\n✓ Setup complete - no action needed\n');
      return;
    }
    
    // Create product-images bucket
    console.log('📦 Creating product-images bucket...');
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      console.log('\n⚠️  Could not create bucket automatically.');
      console.log('\n📋 Manual Setup Required:');
      console.log('1. Go to: https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to Storage → Create new bucket');
      console.log('4. Name: product-images');
      console.log('5. Enable: Public bucket');
      console.log('6. File size limit: 5MB');
      console.log('\n💡 OR run the SQL script: SETUP_STORAGE_BUCKETS.sql');
      return;
    }
    
    console.log('✅ product-images bucket created successfully!');
    console.log('\n📋 Bucket Configuration:');
    console.log('   - Name: product-images');
    console.log('   - Public: Yes');
    console.log('   - Max file size: 5MB');
    console.log('   - Allowed types: JPEG, PNG, WebP, GIF');
    
    console.log('\n⚠️  IMPORTANT: Set up storage policies!');
    console.log('\nRun this SQL in Supabase SQL Editor:');
    console.log('\n' + '='.repeat(50));
    console.log(`
-- Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated Upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
    `.trim());
    console.log('\n' + '='.repeat(50));
    
    console.log('\n✅ Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Run the SQL policies above in Supabase SQL Editor');
    console.log('2. Test image upload in your app');
    console.log('3. Check QUICK_SETUP_GUIDE.md for more details\n');

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.log('\n💡 Fallback Option:');
    console.log('Run the SQL script instead: SETUP_STORAGE_BUCKETS.sql');
    console.log('This will create the bucket and all necessary policies\n');
  }
}

createBuckets();
