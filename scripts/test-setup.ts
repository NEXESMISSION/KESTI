/**
 * Test setup script to verify your installation is working
 * Run in browser console after setting up the system
 */

async function testSetup() {
  console.log('🧪 Starting Kesti POS System Test...')
  
  // Test 1: Check Supabase Connection
  console.log('\n📡 Test 1: Supabase Connection')
  try {
    const { data, error } = await supabase.from('profiles').select('count').single()
    if (error) throw error
    console.log('✅ Supabase connection successful!')
  } catch (err) {
    console.error('❌ Supabase connection failed:', err)
    console.log('⚠️ Check your .env.local file for correct Supabase credentials')
    return
  }
  
  // Test 2: Auth Status
  console.log('\n🔐 Test 2: Authentication Status')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('ℹ️ Not logged in. This is expected if you\'re not authenticated.')
    } else {
      console.log('✅ Authenticated as:', session.user.email)
      
      // Test 2b: User Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) throw profileError
      console.log('✅ Profile loaded:', {
        name: profile.full_name,
        role: profile.role,
        subscription: profile.subscription_ends_at
          ? new Date(profile.subscription_ends_at).toLocaleDateString()
          : 'No subscription',
        suspended: profile.is_suspended ? 'Yes' : 'No'
      })
    }
  } catch (err) {
    console.error('❌ Authentication test failed:', err)
  }
  
  // Test 3: Test RPC Functions
  console.log('\n🔄 Test 3: RPC Functions')
  try {
    // This will fail if the function doesn't exist, which is what we want to test
    const { error } = await supabase.rpc('verify_business_pin', {
      input_pin: '0000' // Doesn't matter if it's right, just testing if function exists
    })
    
    if (error?.message.includes('function does not exist')) {
      console.error('❌ RPC function test failed: verify_business_pin function not found')
      console.log('⚠️ Check that you ran the SQL setup script in Supabase')
    } else {
      console.log('✅ RPC functions available')
    }
  } catch (err) {
    console.error('❌ RPC function test failed:', err)
  }
  
  // Test 4: Test Database Schema
  console.log('\n📋 Test 4: Database Schema')
  try {
    // Check for required tables
    const requiredTables = ['profiles', 'products', 'sales', 'sale_items']
    let allTablesExist = true
    
    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        console.error(`❌ Table "${table}" not found or not accessible`)
        allTablesExist = false
      }
    }
    
    if (allTablesExist) {
      console.log('✅ All required tables exist and are accessible')
    } else {
      console.log('⚠️ Some required tables are missing. Check that you ran the SQL setup script.')
    }
  } catch (err) {
    console.error('❌ Database schema test failed:', err)
  }
  
  console.log('\n🎯 Test Summary:')
  console.log('1. Check the results above for any errors.')
  console.log('2. Fix any issues before proceeding.')
  console.log('3. Make sure you\'ve created a super_admin user.')
  
  console.log('\n✅ Test completed! If all checks passed, you\'re ready to go!')
}

// Run the test
console.log(`
=== KESTI POS SYSTEM TEST ===
Run testSetup() to check if your system is set up correctly.
`)
