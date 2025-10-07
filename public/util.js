/**
 * Kesti POS - Browser Console Utilities
 * 
 * This file contains helpful functions that can be used in the browser console
 * for testing, debugging, and troubleshooting the Kesti POS system.
 * 
 * To use, open browser console (F12) and type the function name.
 */

// Test if Supabase is accessible
async function testSupabase() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single()
    if (error) throw error
    console.log('✅ Supabase connection successful!')
    return true
  } catch (err) {
    console.error('❌ Supabase connection failed:', err)
    return false
  }
}

// Get current user info
async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('Not logged in')
      return null
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) throw error
    console.log('Current user:', data)
    return data
  } catch (err) {
    console.error('Error getting user:', err)
    return null
  }
}

// List all products for current user
async function listProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    if (error) throw error
    console.table(data)
    return data
  } catch (err) {
    console.error('Error listing products:', err)
    return null
  }
}

// List recent sales
async function listSales(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    console.log('Recent sales:', data)
    return data
  } catch (err) {
    console.error('Error listing sales:', err)
    return null
  }
}

// Create a test product
async function createTestProduct(name = 'Test Product', price = 9.99) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('Not logged in')
      return null
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        owner_id: session.user.id,
        name: name,
        price: price,
        unit_type: 'item'
      })
      .select()
    
    if (error) throw error
    console.log('Product created:', data[0])
    return data[0]
  } catch (err) {
    console.error('Error creating product:', err)
    return null
  }
}

// Delete a product by ID
async function deleteProduct(productId) {
  if (!productId) {
    console.error('Product ID is required')
    return false
  }
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
    
    if (error) throw error
    console.log('Product deleted successfully')
    return true
  } catch (err) {
    console.error('Error deleting product:', err)
    return false
  }
}

// Check account status
async function checkAccountStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('Not logged in')
      return null
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) throw error
    
    const status = {
      name: data.full_name,
      role: data.role,
      suspended: data.is_suspended,
      subscriptionActive: false,
      subscriptionEndsAt: data.subscription_ends_at,
      daysLeft: 0
    }
    
    if (data.subscription_ends_at) {
      const expiryDate = new Date(data.subscription_ends_at)
      const now = new Date()
      status.subscriptionActive = expiryDate > now
      status.daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    }
    
    console.log('Account status:', status)
    return status
  } catch (err) {
    console.error('Error checking account status:', err)
    return null
  }
}

// Help menu
function help() {
  console.log(`
=== Kesti POS Console Utilities ===

Available functions:

testSupabase()
  Test if Supabase connection is working

getCurrentUser()
  Show information about the logged-in user

listProducts()
  List all products for the current user

listSales(limit = 10)
  List recent sales with items

createTestProduct(name = 'Test Product', price = 9.99)
  Create a test product

deleteProduct(productId)
  Delete a product by ID

checkAccountStatus()
  Check current account status (subscription, etc.)

help()
  Show this help menu
  `)
}

// Show help message when loaded
console.log('Kesti POS Utilities loaded. Type help() for available commands.')
