// =====================================================
// KESTI 4 POS: Storage Diagnostic Tool
// =====================================================
// Run this to diagnose storage bucket issues
// Usage: node scripts/diagnose-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('\n🔍 KESTI 4 POS - Storage Diagnostic Tool\n');
console.log('='.repeat(50));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file\n');
  process.exit(1);
}

console.log('✓ Environment variables found');
console.log(`✓ Supabase URL: ${supabaseUrl}\n`);

// Test with anon key (what the app uses)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test with service key if available
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function diagnoseStorage() {
  try {
    console.log('📦 TEST 1: Listing buckets with ANON key...');
    console.log('-'.repeat(50));
    
    const { data: bucketsAnon, error: listErrorAnon } = await supabaseAnon.storage.listBuckets();
    
    if (listErrorAnon) {
      console.log('⚠️  Cannot list buckets with ANON key');
      console.log('   Error:', listErrorAnon.message);
      console.log('   This is NORMAL - anon key has limited permissions\n');
    } else {
      console.log(`✓ Found ${bucketsAnon.length} bucket(s):`);
      bucketsAnon.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
      
      const productBucket = bucketsAnon.find(b => b.name === 'product-images');
      if (productBucket) {
        console.log('✅ product-images bucket EXISTS\n');
      } else {
        console.log('❌ product-images bucket NOT FOUND\n');
      }
    }
    
    // Test with admin key
    if (supabaseAdmin) {
      console.log('📦 TEST 2: Listing buckets with SERVICE key...');
      console.log('-'.repeat(50));
      
      const { data: bucketsAdmin, error: listErrorAdmin } = await supabaseAdmin.storage.listBuckets();
      
      if (listErrorAdmin) {
        console.log('❌ Error listing buckets with SERVICE key');
        console.log('   Error:', listErrorAdmin.message, '\n');
      } else {
        console.log(`✓ Found ${bucketsAdmin.length} bucket(s):`);
        bucketsAdmin.forEach(bucket => {
          console.log(`   - ${bucket.name} (public: ${bucket.public})`);
        });
        
        const productBucket = bucketsAdmin.find(b => b.name === 'product-images');
        if (productBucket) {
          console.log('✅ product-images bucket EXISTS');
          console.log(`   Public: ${productBucket.public}`);
          console.log(`   File size limit: ${productBucket.file_size_limit ? Math.round(productBucket.file_size_limit/1024/1024) + 'MB' : 'unlimited'}\n`);
        } else {
          console.log('❌ product-images bucket NOT FOUND\n');
        }
      }
    } else {
      console.log('⚠️  TEST 2: Skipped (no SERVICE_ROLE_KEY in .env)\n');
    }
    
    // Test upload to product-images
    console.log('📤 TEST 3: Attempting to upload test file...');
    console.log('-'.repeat(50));
    
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseAnon.storage
      .from('product-images')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Upload FAILED');
      console.log(`   Error: ${uploadError.message}`);
      console.log(`   Status: ${uploadError.statusCode || 'unknown'}`);
      
      if (uploadError.message?.includes('Bucket not found')) {
        console.log('\n💡 DIAGNOSIS: Bucket does not exist');
        console.log('   FIX: Run SETUP_STORAGE_CLEAN.sql in Supabase SQL Editor\n');
      } else if (uploadError.message?.includes('policy') || uploadError.statusCode === '403') {
        console.log('\n💡 DIAGNOSIS: Bucket exists but policies are missing/incorrect');
        console.log('   FIX: Run SETUP_STORAGE_CLEAN.sql in Supabase SQL Editor\n');
      } else if (uploadError.message?.includes('JWT')) {
        console.log('\n💡 DIAGNOSIS: Authentication issue');
        console.log('   FIX: Make sure you\'re logged in when uploading\n');
      } else {
        console.log('\n💡 DIAGNOSIS: Unknown error - check Supabase dashboard\n');
      }
    } else {
      console.log('✅ Upload SUCCESSFUL!');
      console.log(`   Path: ${uploadData.path}`);
      
      // Get public URL
      const { data: urlData } = supabaseAnon.storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
      
      if (urlData?.publicUrl) {
        console.log(`   URL: ${urlData.publicUrl}`);
      }
      
      // Clean up test file
      await supabaseAnon.storage
        .from('product-images')
        .remove([uploadData.path]);
      
      console.log('   Test file cleaned up');
      console.log('\n✅ DIAGNOSIS: Storage is working correctly!\n');
    }
    
    console.log('='.repeat(50));
    console.log('\n📋 SUMMARY:\n');
    
    if (!listErrorAnon && bucketsAnon?.some(b => b.name === 'product-images')) {
      console.log('✅ Bucket exists (confirmed)');
    } else if (supabaseAdmin && !listErrorAdmin && bucketsAdmin?.some(b => b.name === 'product-images')) {
      console.log('✅ Bucket exists (confirmed via admin key)');
    } else {
      console.log('❌ Bucket might not exist - run SETUP_STORAGE_CLEAN.sql');
    }
    
    if (!uploadError) {
      console.log('✅ Upload works correctly');
      console.log('✅ Policies configured correctly');
      console.log('\n🎉 Your storage is fully functional!\n');
    } else {
      console.log('❌ Upload failed - see error details above');
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('1. Go to https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and run: SETUP_STORAGE_CLEAN.sql');
      console.log('5. Re-run this diagnostic: node scripts/diagnose-storage.js\n');
    }
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.log('\n🔧 Try running: SETUP_STORAGE_CLEAN.sql in Supabase SQL Editor\n');
  }
}

diagnoseStorage();
