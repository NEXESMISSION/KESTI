import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import CartItem from '@/components/CartItem'
import QuantityModal from '@/components/QuantityModal'

function POS() {
  const router = useRouter()
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [quantityModalProduct, setQuantityModalProduct] = useState<Product | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  
  // Low stock alert state
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  
  // Auto-clear warning state
  const [showAutoClearWarning, setShowAutoClearWarning] = useState(false)
  const [autoClearTimeLeft, setAutoClearTimeLeft] = useState<string | null>(null)
  
  // Calculate low stock items (only products with stock tracking enabled)
  const lowStockProducts = products.filter(product => 
    product.stock_quantity !== null && 
    product.stock_quantity <= (product.low_stock_threshold || 10)
  )
  const lowStockCount = lowStockProducts.length
  
  // Calculate total alerts (low stock + auto-clear warning)
  const totalAlerts = lowStockCount + (showAutoClearWarning ? 1 : 0)

  useEffect(() => {
    checkAuthAndFetchProducts()
    checkAutoClearStatus()
    triggerAutoClearCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerAutoClearCheck = async () => {
    try {
      // Trigger the auto-clear check in background
      await fetch('/api/check-and-auto-clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Auto-clear check failed:', error)
    }
  }

  // Prevent autofill in PIN fields
  useEffect(() => {
    // Clear any autofilled inputs
    setTimeout(() => {
      // For PIN modal
      const pinField = document.getElementById('pin-field') as HTMLInputElement | null
      if (pinField) {
        pinField.value = ''
      }
      
      // For search field - ensure it's not affected by autofill
      const searchField = document.getElementById('product-search') as HTMLInputElement | null
      if (searchField) {
        if (searchField.value && searchField.value.includes('@')) {
          // If it looks like an email was autofilled, clear it
          searchField.value = ''
          setSearchTerm('')
        }
      }
    }, 100)
  }, [])

  const checkAuthAndFetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      setUserId(session.user.id)
      await fetchProducts(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      window.location.href = '/login'
    }
  }

  const checkAutoClearStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile) return

      const useMinutes = profile.history_auto_clear_minutes && profile.history_auto_clear_minutes > 0
      const useDays = profile.history_auto_clear_days && profile.history_auto_clear_days > 0

      if (!useMinutes && !useDays) {
        setShowAutoClearWarning(false)
        return
      }

      const lastClear = profile.last_history_clear ? new Date(profile.last_history_clear) : new Date()
      const now = new Date()

      let nextClear: Date
      let hoursLeft = 0

      if (useMinutes) {
        nextClear = new Date(lastClear.getTime() + profile.history_auto_clear_minutes * 60 * 1000)
        hoursLeft = (nextClear.getTime() - now.getTime()) / (1000 * 60 * 60)
      } else {
        nextClear = new Date(lastClear.getTime() + profile.history_auto_clear_days * 24 * 60 * 60 * 1000)
        hoursLeft = (nextClear.getTime() - now.getTime()) / (1000 * 60 * 60)
      }

      // Show warning if less than 3 days (72 hours) left
      if (hoursLeft < 72 && hoursLeft > 0) {
        setShowAutoClearWarning(true)
        if (hoursLeft < 1) {
          const minutesLeft = Math.ceil(hoursLeft * 60)
          setAutoClearTimeLeft(`${minutesLeft}min`)
        } else if (hoursLeft < 24) {
          const hours = Math.ceil(hoursLeft)
          setAutoClearTimeLeft(`${hours}h`)
        } else {
          const days = Math.ceil(hoursLeft / 24)
          setAutoClearTimeLeft(`${days}d`)
        }
      } else {
        setShowAutoClearWarning(false)
      }
    } catch (error) {
      console.error('Error checking auto-clear status:', error)
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
        // Close modal and clear PIN
        setShowPinModal(false)
        setPin('')
        // Use window.location.href for full page reload to prevent redirect loop
        window.location.href = '/finance'
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

  // Group products by category
  const productsByCategory: { [key: string]: Product[] } = {}
  
  filteredProducts.forEach(product => {
    const categoryName = product.category?.name || 'Uncategorized'
    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = []
    }
    productsByCategory[categoryName].push(product)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Left: Brand */}
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            {/* Right: Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Alerts Button (Low Stock + Auto-Clear Warning) */}
              <button
                onClick={() => setShowLowStockModal(true)}
                className="relative bg-orange-600 hover:bg-orange-700 text-white p-2 sm:p-2.5 rounded-lg transition-all transform hover:scale-105"
                aria-label="تنبيهات"
                title="Alerts & Notifications"
                type="button"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {totalAlerts > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold px-1.5 animate-pulse shadow-lg">
                    {totalAlerts}
                  </span>
                )}
              </button>
              
              {/* Owner Panel Icon Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowPinModal(true);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                title="Owner Dashboard"
                type="button"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              
              {/* Logout Icon Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-2.5 rounded-lg transition text-xs sm:text-sm"
                aria-label="Logout"
                title="Logout"
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

      {/* Simple Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 بحث عن المنتجات..."
              className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              autoComplete="off"
              name="product-search"
              id="product-search"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
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
          /* Category Sections with Horizontal Scroll */
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <div key={categoryName}>
                {/* Category Header */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 px-2 sm:px-0">
                  {categoryName}
                </h2>
                
                {/* Horizontal Scrollable Products */}
                <div className="relative">
                  <div className="flex space-x-3 sm:space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          // If product is "item" type, add directly to cart with quantity 1
                          if (product.unit_type === 'item') {
                            addToCart(product, 1)
                          } else {
                            // For weight/volume products, open quantity modal
                            setQuantityModalProduct(product)
                            setShowQuantityModal(true)
                          }
                        }}
                        className="flex-shrink-0 w-48 sm:w-56 md:w-72 bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                      >
                        {/* Product Image */}
                        <div className="relative w-full h-32 sm:h-36 md:h-40">
                          <Image
                            src={product.image_url || 'https://placehold.co/300x200/e5e7eb/6b7280?text=No+Image'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 56px, 72px"
                            className="object-cover"
                          />
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-3 sm:p-4">
                          <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {product.unit_type}
                          </p>
                          
                          {/* Stock Badge */}
                          {product.stock_quantity !== null && (
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                              Stock: {product.stock_quantity}
                            </p>
                          )}
                          
                          {/* Price and Action */}
                          <div className="flex justify-between items-center mt-3 sm:mt-4">
                            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-900">
                              {product.selling_price.toFixed(2)} TND
                            </span>
                            <div className="bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium">
                              Add
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
                      <span className="text-2xl font-bold text-blue-600">{getTotalPrice().toFixed(2)} TND</span>
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
                      <>Checkout ({getTotalPrice().toFixed(2)} TND)</>
                    
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

      {/* Alerts Modal (Low Stock + Auto-Clear Warning) */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowLowStockModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-orange-600 text-white px-4 sm:px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="text-lg sm:text-xl font-bold">التنبيهات ({totalAlerts})</h2>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Auto-Clear Warning Section */}
            {showAutoClearWarning && (
              <div className="bg-red-50 border-b-4 border-red-500 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Data Will Be Deleted Soon!</h3>
                    <p className="text-red-700 mb-2">
                      Your sales and expenses history will be <strong>automatically deleted</strong> in <span className="text-2xl font-bold">{autoClearTimeLeft}</span>
                    </p>
                    <p className="text-sm text-red-600 mb-3">
                      All your transaction history will be permanently lost!
                    </p>
                    <button
                      onClick={() => {
                        setShowLowStockModal(false)
                        window.location.href = '/history'
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download My Data Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {lowStockCount === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 sm:w-20 h-16 sm:h-20 mx-auto text-green-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg sm:text-xl text-gray-600 font-semibold">لا توجد منتجات منخفضة المخزون</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">جميع المنتجات لديها مخزون كافٍ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-orange-200">
                    <p className="text-sm sm:text-lg text-gray-700 font-semibold">
                      المنتجات ذات المخزون المنخفض: <span className="text-orange-600">{lowStockCount}</span>
                    </p>
                  </div>
                  
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover w-12 h-12 sm:w-16 sm:h-16"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {product.category?.name || 'بدون فئة'}
                        </p>
                      </div>

                      {/* Stock Badge */}
                      <div className="flex-shrink-0">
                        <div className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-center min-w-[60px] sm:min-w-[80px]">
                          <div className="text-xl sm:text-2xl font-bold">{product.stock_quantity ?? 0}</div>
                          <div className="text-[10px] sm:text-xs">متبقي</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex justify-end border-t">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal with Number Pad */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">أدخل رمز PIN الخاص بالمالك</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* PIN Display */}
            <div className="mb-6 bg-gray-100 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
              <div className="flex gap-3">
                {[...Array(Math.max(4, pin.length))].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < pin.length ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => setPin(pin + num.toString())}
                  className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-2xl font-semibold py-4 rounded-lg transition"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPin(pin.slice(0, -1))}
                className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-600 py-4 rounded-lg transition flex items-center justify-center"
                title="حذف"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
              <button
                onClick={() => setPin(pin + '0')}
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-2xl font-semibold py-4 rounded-lg transition"
              >
                0
              </button>
              <button
                onClick={() => {
                  setShowPinModal(false)
                  setPin('')
                  setError(null)
                }}
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 py-4 rounded-lg transition flex items-center justify-center text-sm font-medium"
              >
                إلغاء
              </button>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition font-semibold"
            >
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(POS)
