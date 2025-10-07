/**
 * Complete Super Admin Creation Script
 * This script creates BOTH:
 * 1. Authentication user in Supabase Auth
 * 2. Profile entry in the database
 * 
 * Run this after resetting the database with COMPLETE_RESET_AND_SETUP.sql
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Configuration - YOUR SUPER ADMIN DETAILS
const ADMIN_CONFIG = {
  email: 'quikasalami@gmail.com',
  password: '123456',
  fullName: 'Super Administrator',
  pin: '123456',
  subscriptionYears: 10
};

// Supabase configuration from .env
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting Super Admin Creation...\n');
console.log('Configuration:');
console.log('- Email:', ADMIN_CONFIG.email);
console.log('- Name:', ADMIN_CONFIG.fullName);
console.log('- PIN:', ADMIN_CONFIG.pin);
console.log('- Supabase URL:', SUPABASE_URL);
console.log('\n');

// Helper function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: jsonBody });
          } else {
            reject({ status: res.statusCode, data: jsonBody });
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: body });
          } else {
            reject({ status: res.statusCode, error: body });
          }
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createSuperAdmin() {
  try {
    // Extract base URL without https://
    const urlMatch = SUPABASE_URL.match(/https?:\/\/([^\/]+)/);
    const baseHost = urlMatch ? urlMatch[1] : SUPABASE_URL;

    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    
    const authOptions = {
      hostname: baseHost,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };

    let userId;
    try {
      const authResult = await makeRequest(authOptions, {
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_CONFIG.fullName
        }
      });

      userId = authResult.data.id;
      console.log('✅ Auth user created successfully!');
      console.log('   User ID:', userId);
    } catch (error) {
      if (error.data && error.data.msg && error.data.msg.includes('already exists')) {
        console.log('⚠️  User already exists in auth, fetching existing user...');
        
        // Get existing user
        const getUserOptions = {
          hostname: baseHost,
          path: '/auth/v1/admin/users',
          method: 'GET',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        };
        
        const usersResult = await makeRequest(getUserOptions);
        const existingUser = usersResult.data.users.find(u => u.email === ADMIN_CONFIG.email);
        
        if (existingUser) {
          userId = existingUser.id;
          console.log('✅ Found existing user');
          console.log('   User ID:', userId);
        } else {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    }

    // Step 2: Create/Update profile in database
    console.log('\n📝 Step 2: Creating profile in database...');
    
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + ADMIN_CONFIG.subscriptionYears);

    const profileOptions = {
      hostname: baseHost,
      path: '/rest/v1/profiles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      }
    };

    try {
      await makeRequest(profileOptions, {
        id: userId,
        email: ADMIN_CONFIG.email,
        full_name: ADMIN_CONFIG.fullName,
        role: 'super_admin',
        pin_code: ADMIN_CONFIG.pin,
        subscription_ends_at: subscriptionEndDate.toISOString(),
        is_suspended: false
      });

      console.log('✅ Profile created successfully!');
    } catch (error) {
      if (error.status === 409 || (error.data && error.data.message && error.data.message.includes('duplicate'))) {
        console.log('⚠️  Profile already exists, updating...');
        
        // Update existing profile
        const updateOptions = {
          hostname: baseHost,
          path: `/rest/v1/profiles?id=eq.${userId}`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        };

        await makeRequest(updateOptions, {
          role: 'super_admin',
          full_name: ADMIN_CONFIG.fullName,
          pin_code: ADMIN_CONFIG.pin,
          subscription_ends_at: subscriptionEndDate.toISOString(),
          is_suspended: false
        });

        console.log('✅ Profile updated successfully!');
      } else {
        throw error;
      }
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Super Admin Created!');
    console.log('='.repeat(60));
    console.log('\n📋 Your Login Details:');
    console.log('   Dashboard: http://localhost:3000/super-admin');
    console.log('   Email:', ADMIN_CONFIG.email);
    console.log('   Password:', ADMIN_CONFIG.password);
    console.log('   PIN:', ADMIN_CONFIG.pin);
    console.log('   Subscription valid until:', subscriptionEndDate.toLocaleDateString());
    console.log('\n✅ Next Steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Go to: http://localhost:3000/super-admin');
    console.log('   3. Login with the credentials above');
    console.log('   4. Start creating business accounts!');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

// Check if required env vars are set
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ ERROR: Missing environment variables!');
  console.error('Make sure .env file contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Run the script
createSuperAdmin();
