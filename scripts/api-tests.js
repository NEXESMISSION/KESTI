/**
 * Kesti POS - API Tests
 * 
 * This script contains tests for the API endpoints and Supabase functions
 * Run in the browser console after setting up and authenticating
 */

// Test configuration - replace with valid test data when running tests
const TEST_CONFIG = {
  // For super admin tests
  businessEmail: 'test-business@example.com',
  businessPassword: 'test-password-123',
  businessName: 'Test Business',
  businessPin: '1234',
  
  // For product tests
  productName: 'Test API Product',
  productPrice: 15.99,
  
  // IDs to test - these will be filled during tests
  businessId: null,
  productId: null,
  saleId: null,
}

// Test suite for super admin functions
async function runSuperAdminTests() {
  console.log('🧪 Running Super Admin API Tests...')
  
  // Test 1: Create business account
  console.log('\n📡 Test 1: Create Business Account')
  try {
    const response = await fetch('/api/create-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CONFIG.businessEmail,
        password: TEST_CONFIG.businessPassword,
        fullName: TEST_CONFIG.businessName,
        pin: TEST_CONFIG.businessPin,
        subscriptionEndsAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Create business test failed:', result.error || 'Unknown error')
    } else {
      console.log('✅ Business account created:', result.userId)
      TEST_CONFIG.businessId = result.userId
    }
  } catch (err) {
    console.error('❌ Create business test failed:', err)
  }
  
  // If no business ID, try to find the business to continue tests
  if (!TEST_CONFIG.businessId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', TEST_CONFIG.businessEmail)
        .single()
      
      if (data?.id) {
        TEST_CONFIG.businessId = data.id
        console.log('ℹ️ Found existing business ID:', TEST_CONFIG.businessId)
      }
    } catch (err) {
      console.error('Could not find business ID')
    }
  }
  
  // Test 2: Extend subscription
  console.log('\n📡 Test 2: Extend Subscription')
  if (TEST_CONFIG.businessId) {
    try {
      // Get current subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_ends_at')
        .eq('id', TEST_CONFIG.businessId)
        .single()
      
      if (profile?.subscription_ends_at) {
        console.log('Current subscription ends at:', new Date(profile.subscription_ends_at).toLocaleDateString())
      }
      
      // Extend subscription
      const currentDate = profile?.subscription_ends_at 
        ? new Date(profile.subscription_ends_at) 
        : new Date()
      
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 30)
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_ends_at: newDate.toISOString() 
        })
        .eq('id', TEST_CONFIG.businessId)
      
      if (error) {
        console.error('❌ Extend subscription test failed:', error)
      } else {
        console.log('✅ Subscription extended to:', newDate.toLocaleDateString())
      }
    } catch (err) {
      console.error('❌ Extend subscription test failed:', err)
    }
  } else {
    console.log('⚠️ Skipping subscription test, no business ID')
  }
  
  // Test 3: Toggle suspension
  console.log('\n📡 Test 3: Toggle Suspension')
  if (TEST_CONFIG.businessId) {
    try {
      // Get current suspension status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', TEST_CONFIG.businessId)
        .single()
      
      const currentStatus = profile?.is_suspended || false
      console.log('Current suspension status:', currentStatus ? 'Suspended' : 'Active')
      
      // Toggle suspension
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: !currentStatus 
        })
        .eq('id', TEST_CONFIG.businessId)
      
      if (error) {
        console.error('❌ Toggle suspension test failed:', error)
      } else {
        console.log(`✅ Account ${!currentStatus ? 'suspended' : 'unsuspended'} successfully`)
      }
      
      // Toggle back for further tests
      await supabase
        .from('profiles')
        .update({ is_suspended: false })
        .eq('id', TEST_CONFIG.businessId)
    } catch (err) {
      console.error('❌ Toggle suspension test failed:', err)
    }
  } else {
    console.log('⚠️ Skipping suspension test, no business ID')
  }
}

// Test suite for product operations
async function runProductTests() {
  console.log('\n🧪 Running Product API Tests...')
  
  // Test 1: Create product
  console.log('\n📡 Test 1: Create Product')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ Not authenticated')
      return
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        owner_id: session.user.id,
        name: TEST_CONFIG.productName,
        price: TEST_CONFIG.productPrice,
        unit_type: 'item',
      })
      .select()
    
    if (error) {
      console.error('❌ Create product test failed:', error)
    } else {
      console.log('✅ Product created:', data[0])
      TEST_CONFIG.productId = data[0].id
    }
  } catch (err) {
    console.error('❌ Create product test failed:', err)
  }
  
  // Test 2: Update product
  console.log('\n📡 Test 2: Update Product')
  if (TEST_CONFIG.productId) {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          price: TEST_CONFIG.productPrice + 1,
          name: TEST_CONFIG.productName + ' (Updated)',
        })
        .eq('id', TEST_CONFIG.productId)
      
      if (error) {
        console.error('❌ Update product test failed:', error)
      } else {
        console.log('✅ Product updated successfully')
      }
    } catch (err) {
      console.error('❌ Update product test failed:', err)
    }
  } else {
    console.log('⚠️ Skipping update test, no product ID')
  }
  
  // Test 3: Get product
  console.log('\n📡 Test 3: Get Product')
  if (TEST_CONFIG.productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', TEST_CONFIG.productId)
        .single()
      
      if (error) {
        console.error('❌ Get product test failed:', error)
      } else {
        console.log('✅ Product retrieved:', data)
      }
    } catch (err) {
      console.error('❌ Get product test failed:', err)
    }
  } else {
    console.log('⚠️ Skipping get test, no product ID')
  }
}

// Test suite for sales operations
async function runSaleTests() {
  console.log('\n🧪 Running Sale API Tests...')
  
  // First create a product if we don't have one
  if (!TEST_CONFIG.productId) {
    console.log('Creating test product for sales tests...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('❌ Not authenticated')
        return
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          owner_id: session.user.id,
          name: 'Sale Test Product',
          price: 10.99,
          unit_type: 'item',
        })
        .select()
      
      if (error) {
        console.error('❌ Create product failed:', error)
        return
      } else {
        TEST_CONFIG.productId = data[0].id
      }
    } catch (err) {
      console.error('❌ Create product failed:', err)
      return
    }
  }
  
  // Test 1: Create sale
  console.log('\n📡 Test 1: Create Sale')
  try {
    const saleItems = [{
      productId: TEST_CONFIG.productId,
      quantity: 2,
      priceAtSale: TEST_CONFIG.productPrice || 10.99,
    }]
    
    const totalAmount = saleItems.reduce(
      (sum, item) => sum + (item.priceAtSale * item.quantity), 
      0
    )
    
    const { data, error } = await supabase.rpc('create_sale', {
      sale_total: totalAmount,
      items: saleItems,
    })
    
    if (error) {
      console.error('❌ Create sale test failed:', error)
    } else {
      console.log('✅ Sale created with ID:', data)
      TEST_CONFIG.saleId = data
    }
  } catch (err) {
    console.error('❌ Create sale test failed:', err)
  }
  
  // Test 2: Get sale items
  console.log('\n📡 Test 2: Get Sale Items')
  if (TEST_CONFIG.saleId) {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          sale:sales(*)
        `)
        .eq('sale_id', TEST_CONFIG.saleId)
      
      if (error) {
        console.error('❌ Get sale items test failed:', error)
      } else {
        console.log('✅ Sale items retrieved:', data)
      }
    } catch (err) {
      console.error('❌ Get sale items test failed:', err)
    }
  } else {
    console.log('⚠️ Skipping sale items test, no sale ID')
  }
}

// Test RPC functions
async function testRpcFunctions() {
  console.log('\n🧪 Testing RPC Functions...')
  
  // Test 1: verify_business_pin
  console.log('\n📡 Test 1: verify_business_pin')
  try {
    const { data, error } = await supabase.rpc('verify_business_pin', {
      input_pin: '1234', // Just testing if function exists
    })
    
    if (error && error.message.includes('function does not exist')) {
      console.error('❌ RPC test failed: verify_business_pin function not found')
    } else {
      console.log('✅ verify_business_pin function exists')
    }
  } catch (err) {
    console.error('❌ RPC test failed:', err)
  }
  
  // Test 2: create_sale
  console.log('\n📡 Test 2: create_sale')
  try {
    // We just check if the function exists, we don't need to create another sale
    const { error } = await supabase.rpc('create_sale', {
      sale_total: 0,
      items: [],
    })
    
    if (error && error.message.includes('function does not exist')) {
      console.error('❌ RPC test failed: create_sale function not found')
    } else {
      console.log('✅ create_sale function exists')
    }
  } catch (err) {
    console.error('❌ RPC test failed:', err)
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Kesti POS API Tests...\n')
  
  // Check authentication first
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('❌ Not authenticated. Please login first.')
    return
  }
  
  console.log('🔐 Authenticated as:', session.user.email)
  
  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  console.log('👤 User role:', profile?.role)
  
  // Run role-specific tests
  if (profile?.role === 'super_admin') {
    await runSuperAdminTests()
  }
  
  await runProductTests()
  await runSaleTests()
  await testRpcFunctions()
  
  console.log('\n✅ API tests completed!')
}

// Clean up test data
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')
  
  if (TEST_CONFIG.productId) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', TEST_CONFIG.productId)
      
      if (error) {
        console.error('❌ Product cleanup failed:', error)
      } else {
        console.log('✅ Test product deleted')
      }
    } catch (err) {
      console.error('❌ Product cleanup failed:', err)
    }
  }
  
  console.log('✅ Cleanup completed!')
}

console.log(`
=== KESTI POS API TESTS ===

Available test functions:

runAllTests()
  Run all available API tests based on your user role

runSuperAdminTests()
  Test super admin specific endpoints

runProductTests()
  Test product management endpoints

runSaleTests()
  Test sales management endpoints

testRpcFunctions()
  Test RPC function availability

cleanupTestData()
  Clean up any test data created during testing

Make sure you're logged in before running tests!
`)
