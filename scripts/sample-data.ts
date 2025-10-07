/**
 * Script to generate sample data for testing
 * 
 * How to use:
 * 1. Create a business account through the Super Admin interface
 * 2. Login as the business user
 * 3. Copy the user ID from the console log
 * 4. Update the OWNER_ID constant below with that ID
 * 5. Run the script in the browser console
 */

// Replace with your business user ID
const OWNER_ID = 'your-business-user-id'

// Sample product data
const SAMPLE_PRODUCTS = [
  { name: 'Coffee - Small', price: 2.99, unit_type: 'item' },
  { name: 'Coffee - Medium', price: 3.99, unit_type: 'item' },
  { name: 'Coffee - Large', price: 4.99, unit_type: 'item' },
  { name: 'Espresso', price: 3.49, unit_type: 'item' },
  { name: 'Cappuccino', price: 4.49, unit_type: 'item' },
  { name: 'Latte', price: 4.99, unit_type: 'item' },
  { name: 'Mocha', price: 5.49, unit_type: 'item' },
  { name: 'Tea', price: 2.99, unit_type: 'item' },
  { name: 'Croissant', price: 3.49, unit_type: 'item' },
  { name: 'Muffin', price: 2.99, unit_type: 'item' },
  { name: 'Sandwich', price: 6.99, unit_type: 'item' },
  { name: 'Bagel', price: 3.49, unit_type: 'item' },
  { name: 'Cookie', price: 1.99, unit_type: 'item' },
  { name: 'Chips', price: 1.49, unit_type: 'item' },
  { name: 'Chocolate Bar', price: 2.49, unit_type: 'item' },
  { name: 'Water Bottle', price: 1.99, unit_type: 'item' },
  { name: 'Soda', price: 2.49, unit_type: 'item' },
  { name: 'Juice', price: 3.49, unit_type: 'item' },
  { name: 'Salad', price: 7.99, unit_type: 'item' },
  { name: 'Fresh Fruit', price: 4.99, unit_type: 'weight' },
]

// Function to create products
async function createSampleProducts() {
  if (!OWNER_ID || OWNER_ID === 'your-business-user-id') {
    console.error('Please set a valid OWNER_ID in the script')
    return
  }

  console.log('Creating sample products...')
  
  try {
    // Create products in batches of 5
    for (let i = 0; i < SAMPLE_PRODUCTS.length; i += 5) {
      const batch = SAMPLE_PRODUCTS.slice(i, i + 5)
      
      const productsToCreate = batch.map(product => ({
        owner_id: OWNER_ID,
        name: product.name,
        price: product.price,
        unit_type: product.unit_type,
      }))
      
      const { data, error } = await supabase
        .from('products')
        .insert(productsToCreate)
        .select()
      
      if (error) {
        console.error('Error creating products:', error)
        break
      }
      
      console.log(`Created ${batch.length} products:`, data)
    }
    
    console.log('Sample products created successfully!')
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Example sale generation function
async function createSampleSale() {
  if (!OWNER_ID || OWNER_ID === 'your-business-user-id') {
    console.error('Please set a valid OWNER_ID in the script')
    return
  }
  
  try {
    // Get some random products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .limit(5)
    
    if (!products || products.length === 0) {
      console.error('No products found. Create products first.')
      return
    }
    
    // Create a sample sale with 2-3 items
    const saleItems = products.slice(0, 3).map(product => ({
      productId: product.id,
      quantity: Math.floor(Math.random() * 3) + 1,
      priceAtSale: product.price
    }))
    
    // Calculate total
    const total = saleItems.reduce(
      (sum, item) => sum + (item.quantity * item.priceAtSale), 
      0
    )
    
    const { data, error } = await supabase.rpc('create_sale', {
      sale_total: total,
      items: saleItems
    })
    
    if (error) {
      console.error('Error creating sale:', error)
      return
    }
    
    console.log('Sample sale created successfully:', {
      saleId: data,
      total,
      items: saleItems
    })
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Instructions for running in console
console.log(`
=== SAMPLE DATA GENERATOR ===
1. First update the OWNER_ID in the script with your business user ID
2. Run createSampleProducts() to create 20 sample products
3. Run createSampleSale() to create a test sale
`)
