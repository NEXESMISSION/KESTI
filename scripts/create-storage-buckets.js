// Create storage buckets for product images
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
  try {
    // Check if product-images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const productBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (!productBucketExists) {
      console.log('Creating product-images bucket...');
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      
      if (error) {
        console.error('Error creating product-images bucket:', error);
      } else {
        console.log('Product images bucket created successfully');
      }
    } else {
      console.log('Product images bucket already exists');
    }

    // Configure bucket policies for public access
    console.log('Setting up public access policy for product-images bucket...');
    const { error: policyError } = await supabase.storage.from('product-images')
      .createSignedUploadUrl('test-policy-setup.txt'); // This is just to test permissions
      
    if (policyError && policyError.message.includes('policy')) {
      console.log('Setting up storage policies...');
      
      // You might need admin rights to do this, depending on your Supabase setup
      // This is just a placeholder - in production you'd configure this via the Supabase dashboard
      console.log('Please set up the following bucket policies in your Supabase dashboard:');
      console.log('1. Allow public read access to product-images');
      console.log('2. Allow authenticated users to upload to product-images');
    }
    
    console.log('Setup completed.');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createBuckets();
