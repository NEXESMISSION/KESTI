import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'

// Product type definition
type Product = {
  id: string
  name: string
  price: number
  unit_type: string
}

export default function POSSimple() {
  // State for products, user, and UI
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPINModal, setShowPINModal] = useState(false)
  const [pin, setPin] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Use the cart context
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems 
  } = useCart()
  
  // Load products on mount
  useEffect(() => {
    checkSession()
    fetchProducts()
  }, [])

  // Check user session
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (profileError || !profile) {
        throw new Error('Could not fetch profile')
      }
      
      setUser(profile)
      
      // Check if user is business user
      const role = profile.role?.toString() || ''
      if (role !== 'business_user') {
        window.location.href = '/super-admin-basic'
      }
    } catch (err) {
      console.error('Session check error:', err)
      setError('Authentication error. Please log in again.')
    }
  }
  
  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      
      // Fetch products for this business
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('name')
        
      if (error) throw error
      
      setProducts(data || [])
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle product click to add to cart
  const handleProductClick = (product: Product) => {
    addToCart(product, 1)
  }
  
  // Handle PIN verification for admin access
  const verifyPIN = async () => {
    try {
      if (!pin) {
        setError('Please enter your PIN')
        return
      }
      
      const { data, error } = await supabase.rpc('verify_business_pin', {
        input_pin: pin
      })
      
      if (error) throw error
      
      if (data === true) {
        // PIN is correct, navigate to owner panel
        window.location.href = '/owner/products'
      } else {
        setError('Invalid PIN')
        setPin('')
      }
    } catch (err: any) {
      console.error('PIN verification error:', err)
      setError('PIN verification failed')
    }
  }
  
  // Complete the sale
  const handleCheckout = async () => {
    try {
      if (cart.length === 0) {
        setError('Cart is empty')
        return
      }
      
      setLoading(true)
      
      // Calculate total
      const totalAmount = getTotalPrice()
      
      // Format cart items for the RPC function
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        priceAtSale: item.product.price
      }))
      
      // Create the sale
      const { data, error } = await supabase.rpc('create_sale', {
        sale_total: totalAmount,
        items: items
      })
      
      if (error) throw error
      
      // Success! Clear cart and close cart modal
      clearCart()
      setShowCart(false)
      alert('Sale completed successfully!')
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError('Failed to complete sale')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kesti POS</h1>
            {user && <p className="text-sm text-gray-600">{user.full_name || 'Business User'}</p>}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPINModal(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Owner Panel
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded relative"
            >
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">
                  {getTotalItems()}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2 mt-4">
          <div className="bg-red-50 border border-red-300 rounded p-4 text-red-700">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        </div>
      )}
      
      {/* Main content - Product grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
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
                strokeWidth="2" 
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-gray-500">Go to the owner panel to add products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-3xl mb-2">🛍️</div>
                <div className="font-medium truncate">{product.name}</div>
                <div className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{product.unit_type}</div>
              </button>
            ))}
          </div>
        )}
      </main>
      
      {/* PIN Modal */}
      {showPINModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Enter Owner PIN</h2>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded mb-4 text-center text-xl tracking-widest"
              placeholder="••••"
              maxLength={6}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={verifyPIN}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowPINModal(false)
                  setPin('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Your cart is empty
              </div>
            ) : (
              <>
                <div className="mb-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                        >
                          +
                        </button>
                        <div className="w-20 text-right font-bold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-4">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Sale'}
                    </button>
                    <button
                      onClick={() => {
                        clearCart()
                        setShowCart(false)
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded font-semibold"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
