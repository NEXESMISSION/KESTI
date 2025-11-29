import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Product, ProductCategory, CreditCustomer } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import CartItem from '@/components/CartItem'
import QuantityModal from '@/components/QuantityModal'
import WelcomeModal from '@/components/WelcomeModal'

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
  
  // Credit system state
  const [isCredit, setIsCredit] = useState(false)
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  
  // Product box size control
  const [productBoxSize, setProductBoxSize] = useState<'small' | 'large'>('large')
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [daysRemaining, setDaysRemaining] = useState(0)
  
  // Contact modal state
  const [showContact, setShowContact] = useState(false)
  
  const contactInfo = {
    phone: '+216 53518337',
    email: 'support@kestipro.com',
    whatsapp: '+216 53518337',
    facebook: 'https://www.facebook.com/profile.php?id=61581670844981',
    instagram: 'https://www.instagram.com/kesti_tn'
  }
  
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
    checkFirstLogin()
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

  // Keyboard support for PIN modal
  useEffect(() => {
    if (!showPinModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard input when PIN modal is open
      if (e.key >= '0' && e.key <= '9') {
        // Number keys
        e.preventDefault()
        setPin(prev => prev + e.key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Backspace or Delete
        e.preventDefault()
        setPin(prev => prev.slice(0, -1))
      } else if (e.key === 'Enter') {
        // Enter to submit
        e.preventDefault()
        if (pin.length > 0) {
          handlePinSubmit()
        }
      } else if (e.key === 'Escape') {
        // Escape to close
        e.preventDefault()
        setShowPinModal(false)
        setPin('')
        setError(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPinModal, pin])

  const checkAuthAndFetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
      await fetchProducts(session.user.id)
      await fetchCreditCustomers(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
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

      const lastClearTime = profile.last_history_clear_at
      if (!lastClearTime) {
        setShowAutoClearWarning(true)
        return
      }

      const lastClear = new Date(lastClearTime)
      const now = new Date()
      const timeDiffMs = now.getTime() - lastClear.getTime()

      if (useMinutes) {
        const minutesPassed = Math.floor(timeDiffMs / (1000 * 60))
        if (minutesPassed >= (profile.history_auto_clear_minutes || 0)) {
          setShowAutoClearWarning(true)
          setAutoClearTimeLeft(`${minutesPassed} دقيقة`)
        }
      } else if (useDays) {
        const daysPassed = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24))
        if (daysPassed >= (profile.history_auto_clear_days || 0)) {
          setShowAutoClearWarning(true)
          setAutoClearTimeLeft(`${daysPassed} يوم`)
        }
      }
    } catch (error) {
      console.error('Error checking auto-clear status:', error)
    }
  }

  const checkFirstLogin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Check if this specific user has seen the welcome modal
      const welcomeKey = `hasSeenWelcome_${session.user.id}`
      const hasSeenWelcome = localStorage.getItem(welcomeKey)
      if (hasSeenWelcome) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, subscription_ends_at')
        .eq('id', session.user.id)
        .single()

      if (!profile) return

      // Calculate days remaining in trial
      if (profile.subscription_ends_at) {
        const expiryDate = new Date(profile.subscription_ends_at)
        const now = new Date()
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysLeft > 0 && daysLeft <= 15) {
          // Show welcome modal for users with active trial
          setBusinessName(profile.full_name || 'عزيزي العميل')
          setDaysRemaining(daysLeft)
          setShowWelcomeModal(true)
          
          // Mark as seen for this specific user
          localStorage.setItem(welcomeKey, 'true')
        }
      }
    } catch (error) {
      console.error('Error checking first login:', error)
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

  const fetchCreditCustomers = async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_customers')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name')

      if (error) throw error
      setCreditCustomers(data || [])
    } catch (err: any) {
      console.error('Error fetching credit customers:', err)
    }
  }

  const addCreditCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }

    try {
      const { data, error } = await supabase
        .from('credit_customers')
        .insert([{
          owner_id: userId,
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      setCreditCustomers([...creditCustomers, data])
      setSelectedCustomerId(data.id)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setShowAddCustomer(false)
      setSuccess('تمت إضافة العميل بنجاح')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error adding customer:', err)
      setError('فشل في إضافة العميل')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase (this clears localStorage)
      await supabase.auth.signOut({ scope: 'local' })
      
      // Clear all auth-related cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      
      // Clear localStorage manually as backup
      localStorage.clear()
      sessionStorage.clear()
      
      // Force a small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Use replace instead of href to prevent back button issues
      window.location.replace('/login?logout=true')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear storage even on error
      localStorage.clear()
      sessionStorage.clear()
      // Force redirect even if there's an error
      window.location.replace('/login?logout=true')
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
        // Navigate to finance page
        router.push('/finance')
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

    // Check if credit is selected and customer is chosen
    if (isCredit && !selectedCustomerId) {
      setError('يرجى اختيار عميل للبيع بالأجل')
      return
    }

    setProcessingCheckout(true)
    setError(null)
    try {
      if (isCredit) {
        // Handle Credit Sale
        const { data: creditSale, error: creditSaleError } = await supabase
          .from('credit_sales')
          .insert([
            {
              owner_id: userId,
              customer_id: selectedCustomerId,
              total_amount: getTotalPrice(),
              paid_amount: 0,
              remaining_amount: getTotalPrice(),
              is_paid: false,
            },
          ])
          .select()
          .single()

        if (creditSaleError) throw creditSaleError

        // Create credit sale items
        const creditSaleItems = cart.map((item) => ({
          credit_sale_id: creditSale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price_at_sale: item.product.selling_price,
          cost_price_at_sale: item.product.cost_price || 0,
        }))

        const { error: itemsError } = await supabase.from('credit_sale_items').insert(creditSaleItems)

        if (itemsError) throw itemsError

        setSuccess('تم تسجيل البيع بالأجل بنجاح!')
      } else {
        // Handle Regular Sale
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

        setSuccess('تم إتمام الدفع بنجاح!')
      }

      // Deduct stock for products with stock tracking enabled (for both regular and credit sales)
      for (const item of cart) {
        if (item.product.stock_quantity !== null) {
          const newStock = item.product.stock_quantity - item.quantity
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, newStock) })
            .eq('id', item.product.id)
          
          if (stockError) {
            console.error('Error updating stock for product:', item.product.name, stockError)
          }
        }
      }

      clearCart()
      setShowCart(false)
      setIsCredit(false)
      setSelectedCustomerId('')
      
      // Refresh products to show updated stock
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchProducts(session.user.id)
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError('فشل في إتمام العملية')
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
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

      {/* Main Content Area with Cart Sidebar on Desktop */}
      <div className="flex-1 flex">
        {/* Products Section */}
        <main className="flex-1 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 overflow-y-auto">
        {/* Product Size Controls */}
        {!loading && products.length > 0 && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => setProductBoxSize('small')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                productBoxSize === 'small'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="حجم صغير"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => setProductBoxSize('large')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                productBoxSize === 'large'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="حجم كبير"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        )}

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
            <h3 className="mt-4 text-xl font-semibold text-gray-900">لا توجد منتجات بعد</h3>
            <p className="mt-2 text-gray-600">
              انقر على زر + أعلاه لإضافة أول منتج
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
                  <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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
                        className={`group flex-shrink-0 bg-white rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer ${
                          productBoxSize === 'small' ? 'w-32 sm:w-36' : 'w-48 sm:w-52 md:w-56'
                        }`}
                      >
                        {/* Product Image */}
                        <div className={`relative w-full ${
                          productBoxSize === 'small' ? 'h-20 sm:h-24' : 'h-32 sm:h-36 md:h-40'
                        }`}>
                          <Image
                            src={product.image_url || 'https://placehold.co/300x200/e5e7eb/6b7280?text=No+Image'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 56px, 72px"
                            className="object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          {/* Stock Badge Overlay */}
                          {product.stock_quantity !== null && (
                            <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium">
                              {product.stock_quantity} left
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className={`${productBoxSize === 'small' ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3'}`}>
                          <h3 className={`font-bold ${productBoxSize === 'small' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} text-gray-900 truncate mb-1`}>
                            {product.name}
                          </h3>
                          
                          {/* Price */}
                          <div className="flex items-center justify-between">
                            <span className={`font-extrabold ${productBoxSize === 'small' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} text-blue-600`}>
                              {product.selling_price.toFixed(2)}
                            </span>
                            <span className={`${productBoxSize === 'small' ? 'text-[9px]' : 'text-[10px] sm:text-xs'} text-gray-500 font-medium`}>
                              TND/{product.unit_type}
                            </span>
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

      {/* Desktop Cart Sidebar - Always visible on lg+ screens */}
      <aside className="hidden lg:flex lg:w-96 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-lg font-bold">عربة التسوق</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
              {getTotalItems()}
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 mb-4">
              <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">السلة فارغة</h3>
            <p className="text-sm text-gray-500 text-center">ابدأ بإضافة المنتجات</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {cart.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
            
            <div className="border-t-2 border-gray-100 p-4 bg-white shadow-lg">
              {/* Credit System */}
              <div className="mb-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-3">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="credit-checkbox-desktop"
                    checked={isCredit}
                    onChange={(e) => {
                      setIsCredit(e.target.checked)
                      if (!e.target.checked) {
                        setSelectedCustomerId('')
                      }
                    }}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="credit-checkbox-desktop" className="mr-2 text-sm font-bold text-gray-800">
                    💳 بيع بالأجل
                  </label>
                </div>

                {isCredit && (
                  <div className="space-y-2">
                    {!showAddCustomer ? (
                      <div className="flex gap-2">
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          <option value="">اختر العميل</option>
                          {creditCustomers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowAddCustomer(true)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-semibold whitespace-nowrap shadow-md"
                        >
                          + جديد
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-orange-50 p-3 rounded-lg">
                        <input
                          type="text"
                          placeholder="اسم العميل *"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="رقم الهاتف (اختياري)"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={addCreditCustomer}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => {
                              setShowAddCustomer(false)
                              setNewCustomerName('')
                              setNewCustomerPhone('')
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-3 border-2 border-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-600">الإجمالي</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{getTotalPrice().toFixed(2)}</div>
                    <div className="text-xs text-blue-500 font-medium">TND</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-blue-200">
                  {getTotalItems()} {getTotalItems() !== 1 ? 'عناصر' : 'عنصر'} • {cart.length} {cart.length !== 1 ? 'منتجات' : 'منتج'}
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={processingCheckout}
                className={`w-full ${isCredit ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white py-3.5 rounded-xl transition-all flex items-center justify-center font-bold shadow-lg transform hover:scale-[1.02] active:scale-100`}
              >
                {processingCheckout ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري المعالجة...
                  </>
                ) : (
                  <>{isCredit ? '💳 تسجيل كدين' : '💰 إتمام الشراء'}</>
                )}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl transition font-semibold"
              >
                🗑️ تفريغ السلة
              </button>
            </div>
          </div>
        )}
      </aside>
      </div>

      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-40">
          <div className="bg-gray-50 w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">عربة التسوق</h2>
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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">عربة التسوق فارغة</h3>
                <p className="text-sm text-gray-500 mb-6">أضف بعض المنتجات للبدء</p>
                <button 
                  onClick={() => setShowCart(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg"
                >
                  متابعة التسوق
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
                  {/* Credit System */}
                  <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="credit-checkbox"
                        checked={isCredit}
                        onChange={(e) => {
                          setIsCredit(e.target.checked)
                          if (!e.target.checked) {
                            setSelectedCustomerId('')
                          }
                        }}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="credit-checkbox" className="mr-2 text-sm font-medium text-gray-700">
                        💳 بيع بالأجل (دين)
                      </label>
                    </div>

                    {isCredit && (
                      <div className="space-y-2">
                        {!showAddCustomer ? (
                          <div className="flex gap-2">
                            <select
                              value={selectedCustomerId}
                              onChange={(e) => setSelectedCustomerId(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            >
                              <option value="">اختر العميل</option>
                              {creditCustomers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setShowAddCustomer(true)}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm whitespace-nowrap"
                            >
                              + جديد
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 bg-orange-50 p-3 rounded-lg">
                            <input
                              type="text"
                              placeholder="اسم العميل *"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                            <input
                              type="tel"
                              placeholder="رقم الهاتف (اختياري)"
                              value={newCustomerPhone}
                              onChange={(e) => setNewCustomerPhone(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={addCreditCustomer}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddCustomer(false)
                                  setNewCustomerName('')
                                  setNewCustomerPhone('')
                                }}
                                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">المجموع الفرعي</span>
                      <span className="text-2xl font-bold text-blue-600">{getTotalPrice().toFixed(2)} TND</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getTotalItems()} {getTotalItems() !== 1 ? 'عناصر' : 'عنصر'} في العربة
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={processingCheckout}
                    className={`w-full ${isCredit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-lg transition flex items-center justify-center font-medium`}
                  >
                    {processingCheckout ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>{isCredit ? '💳 تسجيل كدين' : '💰 إتمام الشراء'} ({getTotalPrice().toFixed(2)} دينار)</>
                    
                    )}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition text-sm"
                  >
                    تفريغ العربة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button - Mobile Only */}
      <button
        onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 z-50"
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
                        router.push('/history')
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

      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal 
        show={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        businessName={businessName}
        daysRemaining={daysRemaining}
        onContactClick={() => setShowContact(true)}
      />

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-md w-full shadow-2xl animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">تواصل معنا</h3>
              <button 
                onClick={() => setShowContact(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2.5">
              {/* Phone */}
              <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-xs text-gray-500 font-medium">اتصل الآن</p>
                  <p className="text-sm md:text-base font-bold text-gray-900 truncate" dir="ltr">{contactInfo.phone}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-xs text-gray-500 font-medium">واتساب</p>
                  <p className="text-sm md:text-base font-bold text-gray-900 truncate" dir="ltr">{contactInfo.whatsapp}</p>
                </div>
              </a>

              {/* Email */}
              <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-xs text-gray-500 font-medium">البريد الإلكتروني</p>
                  <p className="text-xs md:text-sm font-bold text-gray-900 truncate">{contactInfo.email}</p>
                </div>
              </a>
            </div>

            {/* Social Media */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 font-medium">تابعنا</span>
                <div className="flex gap-2">
                  <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 rounded-lg flex items-center justify-center transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 text-center">
              <p className="text-white text-sm font-bold">جاهزون للإجابة على أسئلتك! 💬</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(POS)
