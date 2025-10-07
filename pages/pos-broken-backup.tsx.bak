import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import ProductForm from '@/components/ProductForm'
import CartItem from '@/components/CartItem'
import QuantityModal from '@/components/QuantityModal'

const POS = () => {
  const router = useRouter()
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [quantityModalProduct, setQuantityModalProduct] = useState<Product | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAuthAndFetchProducts()
  }, [])

  const checkAuthAndFetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
      await fetchProducts(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    }
  }

  const fetchCategories = async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchProducts = async (ownerId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:category_id (id, name)
        `)
        .eq('owner_id', ownerId)
        .order('name')

      if (error) throw error
      setProducts(data || [])
      await fetchCategories(ownerId)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      
      // Use window.location.href for full page reload to clear all state
      window.location.href = '/login'
    } catch (error) {
      console.error('Error during logout:', error)
      // Force redirect even if there's an error
      window.location.href = '/login'
    }
  }

  const handlePinSubmit = async () => {
    if (!pin.trim()) {
      setError('PIN is required')
      return
    }

    setError(null)
    try {
      // Verify PIN in profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('pin_code, role')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (!profile || profile.pin_code !== pin) {
        setError('Invalid PIN')
        return
      }

      // Check if user is business owner
      const userRole = typeof profile.role === 'object' ? 
        profile.role.toString() : String(profile.role)

      if (userRole === 'business_user') {
        router.push('/owner-dashboard')
      } else {
        setError('Access denied. Not a business owner.')
      }
    } catch (err: any) {
      console.error('Error verifying PIN:', err)
      setError('Failed to verify PIN')
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setProcessingCheckout(true)
    setError(null)
    try {
      // Create a sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            owner_id: userId,
            total_amount: getTotalPrice(),
          },
        ])
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_at_sale: item.product.selling_price,
        cost_price_at_sale: item.product.cost_price || 0,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

      if (itemsError) throw itemsError

      // Deduct stock for products with stock tracking enabled
      for (const item of cart) {
        // Only update if product has stock tracking (stock_quantity is not null)
        if (item.product.stock_quantity !== null) {
          const newStock = item.product.stock_quantity - item.quantity
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, newStock) }) // Ensure never negative
            .eq('id', item.product.id)
          
          if (stockError) {
            console.error('Error updating stock for product:', item.product.name, stockError)
            // Don't throw - sale is complete, just log the error
          }
        }
      }

      setSuccess('Checkout complete!')
      clearCart()
      setShowCart(false)
      
      // Refresh products to show updated stock
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchProducts(session.user.id)
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError('Failed to process checkout')
    } finally {
      setProcessingCheckout(false)
    }
  }

  // Filter products based on search criteria
  const filteredProducts = products.filter(product => {
    // Search by name or category name
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category?.name && product.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filter by selected category
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">🛍️ Cashier</h1>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Cart Button with Badge */}
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg transition flex items-center gap-1 sm:gap-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs sm:text-sm md:text-base font-medium hidden xs:inline">Cart</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowPinModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg transition text-xs sm:text-sm md:text-base"
              >
                <span className="hidden sm:inline">Owner Dashboard</span>
                <span className="sm:hidden">👤</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4 lg:px-8">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {/* Search by Name/Category */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                🔍 Search Products
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category..."
                className="w-full px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Results count and clear filters */}
          <div className="mt-2 sm:mt-3 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold text-blue-600">{filteredProducts.length}</span> of {products.length} products
            </p>
            
            {(searchTerm || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-2 sm:py-4 md:py-6 px-2 sm:px-4 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No products yet</h3>
            <p className="mt-2 text-gray-600">
              Click the + button above to add your first product
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-600">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    // If unit type is 'item', directly add to cart with quantity 1
                    if (product.unit_type === 'item') {
                      addToCart(product, 1)
                    } else {
                      // For other unit types (kg, g, l, ml), show quantity modal
                      setQuantityModalProduct(product)
                      setShowQuantityModal(true)
                    }
                  }}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex flex-col relative group cursor-pointer hover:border-2 hover:border-blue-500"
                >
                  {/* Product image */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-gray-400 text-xl">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product info */}
                  <div className="font-medium text-gray-900 truncate">{product.name}</div>
                  <div className="text-gray-700 mt-1">
                    ${product.selling_price.toFixed(2)} / {product.unit_type}
                  </div>
                  
                  {/* Category tag */}
                  {product.category && (
                    <div className="mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                      {product.category.name}
                    </div>
                  )}
                  
                  {/* Click to add indicator */}
                  <div className="mt-3 text-center text-xs text-gray-500">
                    {product.unit_type === 'item' ? 'Click to add' : 'Click to specify quantity'}
                  </div>
                </div>
              ))}

            {products.length > 0 && 
              selectedCategory && 
              products.filter(product => product.category_id === selectedCategory).length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No products found in this category.
                </div>
              )
            }
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-40">
          <div className="bg-gray-50 w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <div className="bg-white rounded-full p-6 mb-4">
                  <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p className="text-sm text-gray-500 mb-6">Add some products to get started</p>
                <button 
                  onClick={() => setShowCart(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {cart.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
                
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Subtotal</span>
                      <span className="text-2xl font-bold text-blue-600">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={processingCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition flex items-center justify-center font-medium"
                  >
                    {processingCheckout ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>Checkout (${getTotalPrice().toFixed(2)})</>
                    )}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 z-50"
        aria-label="Open Cart"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
              {getTotalItems()}
            </span>
          )}
        </div>
      </button>
      
      {/* Quantity Modal */}
      <QuantityModal
        isOpen={showQuantityModal}
        product={quantityModalProduct}
        onClose={() => {
          setShowQuantityModal(false)
          setQuantityModalProduct(null)
        }}
        onAdd={(quantity, unitQuantity) => {
          if (quantityModalProduct) {
            addToCart(quantityModalProduct, quantity, unitQuantity)
          }
          setShowQuantityModal(false)
          setQuantityModalProduct(null)
        }}
      />
      
      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        product={selectedProduct}
        onProductSaved={() => {
          setShowProductForm(false);
          fetchProducts(userId as string);
        }}
      />

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Enter Owner PIN</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary mb-4"
              placeholder="Enter PIN code"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePinSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowPinModal(false)
                  setPin('')
                  setError(null)
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(POS)
