import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
  
  // Product box size - always small for more products on screen
  const productBoxSize = 'small'
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [daysRemaining, setDaysRemaining] = useState(0)
  const welcomeCheckedRef = useRef(false)
  
  // Contact modal state
  const [showContact, setShowContact] = useState(false)
  
  // View mode state: 'products' (default horizontal scroll) or 'categories' (category boxes)
  const [viewMode, setViewMode] = useState<'products' | 'categories'>('products')
  const [categoryViewSelected, setCategoryViewSelected] = useState<string | null>(null)
  
  // Custom quick-add item modal state
  const [showCustomItemModal, setShowCustomItemModal] = useState(false)
  const [customItem, setCustomItem] = useState({
    name: '',
    price: '',
    quantity: '1',
    note: ''
  })
  
  // Category scroll refs for horizontal scrolling
  const categoryScrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [canScrollLeft, setCanScrollLeft] = useState<{ [key: string]: boolean }>({})
  const [canScrollRight, setCanScrollRight] = useState<{ [key: string]: boolean }>({})
  
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
    checkFirstLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // Prevent multiple calls (React Strict Mode, etc.)
    if (welcomeCheckedRef.current) return
    welcomeCheckedRef.current = true
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Check if this specific user has seen the welcome modal (from database)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, subscription_ends_at, welcome_shown')
        .eq('id', session.user.id)
        .single()

      if (!profile) return
      
      // Skip if user has already seen welcome modal
      if (profile.welcome_shown) return

      // Calculate days remaining in trial
      if (profile.subscription_ends_at) {
        const expiryDate = new Date(profile.subscription_ends_at)
        const now = new Date()
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysLeft > 0 && daysLeft <= 15) {
          // Mark as seen in database FIRST to prevent race conditions
          await supabase
            .from('profiles')
            .update({ welcome_shown: true })
            .eq('id', session.user.id)
          
          // Then show welcome modal
          setBusinessName(profile.full_name || 'عزيزي العميل')
          setDaysRemaining(daysLeft)
          setShowWelcomeModal(true)
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
          id,
          owner_id,
          name,
          selling_price,
          cost_price,
          unit_type,
          image_url,
          category_id,
          stock_quantity,
          low_stock_threshold,
          created_at,
          category:category_id (id, name)
        `)
        .eq('owner_id', ownerId)
        .order('name')

      if (error) throw error
      setProducts((data as unknown as Product[]) || [])
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
        .select('id, owner_id, name, phone, created_at')
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
        // Navigate to finance page - use window.location for reliable full page load
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

        // Create sale items (set product_id to null for custom items)
        const saleItems = cart.map((item) => {
          const isCustomItem = item.product.id.startsWith('custom-')
          return {
            sale_id: sale.id,
            product_id: isCustomItem ? null : item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price_at_sale: item.product.selling_price,
            cost_price_at_sale: item.product.cost_price || 0,
          }
        })

        const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

        if (itemsError) throw itemsError

        setSuccess('تم إتمام الدفع بنجاح!')
      }

      // Deduct stock for products with stock tracking enabled (skip custom items)
      for (const item of cart) {
        const isCustomItem = item.product.id.startsWith('custom-')
        if (!isCustomItem && item.product.stock_quantity !== null) {
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

  // Handle adding custom quick item to cart
  const handleAddCustomItem = () => {
    if (!customItem.name.trim() || !customItem.price.trim()) {
      setError('يرجى إدخال اسم المنتج والسعر')
      return
    }
    
    const price = parseFloat(customItem.price)
    const quantity = parseFloat(customItem.quantity) || 1
    
    if (isNaN(price) || price <= 0) {
      setError('يرجى إدخال سعر صحيح')
      return
    }
    
    // Create a temporary product object for the cart
    const tempProduct: Product = {
      id: `custom-${Date.now()}`, // Unique temporary ID
      owner_id: userId || '',
      name: customItem.note ? `${customItem.name.trim()} (${customItem.note.trim()})` : customItem.name.trim(),
      selling_price: price,
      cost_price: 0, // No cost tracking for quick items
      category_id: null,
      image_url: null,
      unit_type: 'item',
      stock_quantity: null, // No stock tracking
      low_stock_threshold: null,
      created_at: new Date().toISOString()
    }
    
    addToCart(tempProduct, quantity)
    setSuccess('تمت إضافة المنتج للسلة')
    setTimeout(() => setSuccess(null), 2000)
    
    // Reset form and close modal
    setCustomItem({ name: '', price: '', quantity: '1', note: '' })
    setShowCustomItemModal(false)
  }

  // Group products by category (memoized to prevent infinite loops)
  const productsByCategory = useMemo(() => {
    const grouped: { [key: string]: Product[] } = {}
    filteredProducts.forEach(product => {
      const categoryName = product.category?.name || 'Uncategorized'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(product)
    })
    return grouped
  }, [filteredProducts])

  // Get category names for dependency tracking
  const categoryNames = useMemo(() => Object.keys(productsByCategory), [productsByCategory])

  // Check scroll buttons visibility for a category
  const checkScrollButtons = useCallback((categoryName: string) => {
    const container = categoryScrollRefs.current[categoryName]
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const newCanScrollLeft = scrollLeft > 0
      const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 10
      
      // Only update state if values actually changed
      setCanScrollLeft(prev => {
        if (prev[categoryName] === newCanScrollLeft) return prev
        return { ...prev, [categoryName]: newCanScrollLeft }
      })
      setCanScrollRight(prev => {
        if (prev[categoryName] === newCanScrollRight) return prev
        return { ...prev, [categoryName]: newCanScrollRight }
      })
    }
  }, [])

  // Initialize scroll buttons for all categories
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      categoryNames.forEach(categoryName => {
        checkScrollButtons(categoryName)
      })
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [categoryNames, checkScrollButtons])

  // Scroll category horizontally
  const scrollCategory = (categoryName: string, direction: 'left' | 'right') => {
    const container = categoryScrollRefs.current[categoryName]
    if (container) {
      const scrollAmount = 300 // pixels to scroll
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
      
      // Update button visibility after scroll
      setTimeout(() => checkScrollButtons(categoryName), 300)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Left: Brand */}
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            {/* Right: Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Main Action Buttons Group */}
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 rounded-xl p-1.5 sm:p-2">
                {/* Alerts Button (Low Stock + Auto-Clear Warning) */}
                <button
                  onClick={() => setShowLowStockModal(true)}
                  className="relative bg-orange-500 hover:bg-orange-600 text-white p-2 sm:p-2.5 rounded-lg transition-all transform hover:scale-105 shadow-sm"
                  aria-label="تنبيهات"
                  title="Alerts & Notifications"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 animate-pulse shadow-lg">
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
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition-all transform hover:scale-105 shadow-sm"
                  title="Owner Dashboard"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
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
              </div>
              
              {/* Divider */}
              <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block" />
              
              {/* Logout Button - Separated */}
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white p-2 sm:p-2.5 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600"
                aria-label="Logout"
                title="تسجيل الخروج - Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
          <div className="flex gap-2 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
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
            
            {/* View Mode Toggle Button */}
            <button
              onClick={() => {
                setViewMode(viewMode === 'products' ? 'categories' : 'products')
                setCategoryViewSelected(null)
              }}
              className={`p-2 sm:p-2.5 rounded-lg border-2 transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === 'categories'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
              }`}
              title={viewMode === 'products' ? 'عرض الفئات' : 'عرض المنتجات'}
            >
              {viewMode === 'products' ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
              <span className="hidden sm:inline text-sm font-medium">
                {viewMode === 'products' ? 'الفئات' : 'المنتجات'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Cart Sidebar on Desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Section - Scrollable */}
        <main className="flex-1 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 overflow-y-auto h-[calc(100vh-140px)]">
        
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
          <>
          {/* Quick Add Box - At Top */}
          <div
            onClick={() => setShowCustomItemModal(true)}
            className="mb-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">منتج سريع</h3>
                <p className="text-[10px] text-emerald-100">إضافة منتج يدوياً للسلة</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* View Mode: Products (horizontal scroll) or Categories (boxes) */}
          {viewMode === 'products' ? (
            /* Default View: Category Sections with Horizontal Scroll */
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
                <div key={categoryName} className="relative">
                  {/* Category Header with Scroll Arrows */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4 px-2 sm:px-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {categoryName}
                      <span className="text-sm font-normal text-gray-500 mr-2">({categoryProducts.length})</span>
                    </h2>
                    
                    {/* Scroll Arrow Buttons - Desktop */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={() => scrollCategory(categoryName, 'left')}
                        disabled={!canScrollLeft[categoryName]}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          canScrollLeft[categoryName]
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        aria-label="التمرير لليسار"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scrollCategory(categoryName, 'right')}
                        disabled={!canScrollRight[categoryName]}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          canScrollRight[categoryName]
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        aria-label="التمرير لليمين"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Horizontal Scrollable Products with Side Arrows */}
                  <div className="relative group/category">
                    {/* Left Scroll Button - Overlay Style */}
                    {canScrollLeft[categoryName] && (
                      <button
                        onClick={() => scrollCategory(categoryName, 'left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl border border-gray-200 opacity-0 group-hover/category:opacity-100 transition-all duration-200 hover:scale-110 hidden sm:flex items-center justify-center"
                        style={{ transform: 'translate(-50%, -50%)' }}
                        aria-label="التمرير لليسار"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Right Scroll Button - Overlay Style */}
                    {canScrollRight[categoryName] && (
                      <button
                        onClick={() => scrollCategory(categoryName, 'right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl border border-gray-200 opacity-0 group-hover/category:opacity-100 transition-all duration-200 hover:scale-110 hidden sm:flex items-center justify-center"
                        style={{ transform: 'translate(50%, -50%)' }}
                        aria-label="التمرير لليمين"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Products Container */}
                    <div 
                      ref={(el) => {
                        categoryScrollRefs.current[categoryName] = el
                      }}
                      onScroll={() => checkScrollButtons(categoryName)}
                      className="flex gap-2 overflow-x-auto pb-3 px-1 scroll-smooth scrollbar-hide"
                    >
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            if (product.unit_type === 'item') {
                              addToCart(product, 1)
                            } else {
                              setQuantityModalProduct(product)
                              setShowQuantityModal(true)
                            }
                          }}
                          className="group flex-shrink-0 bg-white rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer w-24 sm:w-28"
                        >
                          {/* Product Image */}
                          <div className="relative w-full h-16 sm:h-20">
                            <Image
                              src={product.image_url || 'https://placehold.co/300x200/e5e7eb/6b7280?text=No+Image'}
                              alt={product.name}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                            {/* Stock Badge */}
                            {product.stock_quantity !== null && product.stock_quantity <= (product.low_stock_threshold || 10) && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">
                                {product.stock_quantity}
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info - Compact */}
                          <div className="p-1.5">
                            <h3 className="font-semibold text-[10px] sm:text-[11px] text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="font-bold text-xs text-blue-600">
                                {product.selling_price.toFixed(2)}
                              </span>
                              <span className="text-[8px] text-gray-400">TND</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Categories View: Show category boxes or products in selected category */
            <div>
              {categoryViewSelected ? (
                /* Show products from selected category */
                <div>
                  {/* Back Button */}
                  <button
                    onClick={() => setCategoryViewSelected(null)}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">رجوع للفئات</span>
                  </button>
                  
                  {/* Category Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                    {categoryViewSelected}
                    <span className="text-sm font-normal text-gray-500 mr-2">
                      ({productsByCategory[categoryViewSelected]?.length || 0})
                    </span>
                  </h2>
                  
                  {/* Products Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
                    {productsByCategory[categoryViewSelected]?.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (product.unit_type === 'item') {
                            addToCart(product, 1)
                          } else {
                            setQuantityModalProduct(product)
                            setShowQuantityModal(true)
                          }
                        }}
                        className="group bg-white rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      >
                        {/* Product Image */}
                        <div className="relative w-full aspect-square">
                          <Image
                            src={product.image_url || 'https://placehold.co/300x200/e5e7eb/6b7280?text=No+Image'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                            className="object-cover"
                          />
                          {/* Stock Badge */}
                          {product.stock_quantity !== null && product.stock_quantity <= (product.low_stock_threshold || 10) && (
                            <div className="absolute top-1 right-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">
                              {product.stock_quantity}
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-2">
                          <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-sm text-blue-600">
                              {product.selling_price.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400">TND</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Show category boxes */
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                  {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
                    <div
                      key={categoryName}
                      onClick={() => setCategoryViewSelected(categoryName)}
                      className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-5 sm:p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[140px] sm:min-h-[180px]"
                    >
                      {/* Category Icon */}
                      <div className="bg-white/20 rounded-xl p-3 sm:p-4 w-fit mb-4">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      
                      {/* Category Name */}
                      <h3 className="font-bold text-white text-lg sm:text-xl mb-2 truncate">
                        {categoryName}
                      </h3>
                      
                      {/* Product Count */}
                      <p className="text-blue-100 text-sm sm:text-base">
                        {categoryProducts.length} منتج
                      </p>
                      
                      {/* Arrow Icon */}
                      <div className="flex justify-end mt-3">
                        <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </>
        )}
      </main>

      {/* Desktop Cart Sidebar - Clean & Modern */}
      <aside className="hidden lg:flex lg:w-80 bg-white border-l border-gray-100 flex-col h-[calc(100vh-140px)] sticky top-[140px] overflow-hidden">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">السلة</h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
              {getTotalItems()}
            </span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">السلة فارغة</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
            
            {/* Checkout Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex-shrink-0 space-y-3">
              {/* Credit Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCredit}
                  onChange={(e) => {
                    setIsCredit(e.target.checked)
                    if (!e.target.checked) setSelectedCustomerId('')
                  }}
                  className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">💳 بيع بالأجل</span>
              </label>

              {isCredit && (
                <div className="space-y-2">
                  {!showAddCustomer ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 bg-white"
                      >
                        <option value="">اختر العميل</option>
                        {creditCustomers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                      >+</button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                      <input
                        type="text"
                        placeholder="اسم العميل"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="رقم الهاتف"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button onClick={addCreditCustomer} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm">حفظ</button>
                        <button onClick={() => { setShowAddCustomer(false); setNewCustomerName(''); setNewCustomerPhone('') }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{getTotalItems()} عنصر</span>
                  <div className="text-left">
                    <span className="text-xl font-black text-gray-900">{getTotalPrice().toFixed(2)}</span>
                    <span className="text-xs text-gray-400 mr-1">TND</span>
                  </div>
                </div>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={processingCheckout}
                className={`w-full py-3 rounded-lg font-bold text-white transition ${
                  isCredit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {processingCheckout ? 'جاري...' : isCredit ? '💳 تسجيل كدين' : '✓ إتمام البيع'}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition"
              >
                تفريغ السلة
              </button>
            </div>
          </div>
        )}
      </aside>
      </div>

      {/* Mobile Cart Modal - Clean & Simple */}
      {showCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowCart(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">السلة</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{getTotalItems()}</span>
              </div>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">السلة فارغة</p>
                <button onClick={() => setShowCart(false)} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium">
                  تصفح المنتجات
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[40vh]">
                  {cart.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  {/* Credit Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCredit}
                      onChange={(e) => {
                        setIsCredit(e.target.checked)
                        if (!e.target.checked) setSelectedCustomerId('')
                      }}
                      className="w-4 h-4 text-orange-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">💳 بيع بالأجل</span>
                  </label>

                  {isCredit && (
                    <div className="space-y-2">
                      {!showAddCustomer ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                          >
                            <option value="">اختر العميل</option>
                            {creditCustomers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button onClick={() => setShowAddCustomer(true)} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm">+</button>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            placeholder="اسم العميل"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          />
                          <input
                            type="tel"
                            placeholder="رقم الهاتف"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button onClick={addCreditCustomer} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm">حفظ</button>
                            <button onClick={() => { setShowAddCustomer(false); setNewCustomerName(''); setNewCustomerPhone('') }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">إلغاء</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total & Checkout */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500">{getTotalItems()} عنصر</span>
                      <div>
                        <span className="text-2xl font-black text-gray-900">{getTotalPrice().toFixed(2)}</span>
                        <span className="text-sm text-gray-400 mr-1">TND</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={processingCheckout}
                      className={`w-full py-3.5 rounded-xl font-bold text-white transition ${
                        isCredit ? 'bg-orange-500 active:bg-orange-600' : 'bg-green-500 active:bg-green-600'
                      } disabled:opacity-50`}
                    >
                      {processingCheckout ? 'جاري...' : isCredit ? '💳 تسجيل كدين' : '✓ إتمام البيع'}
                    </button>
                  </div>
                  
                  <button onClick={clearCart} className="w-full py-2 text-sm text-gray-400 hover:text-red-500">
                    تفريغ السلة
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button - Mobile Only */}
      <button
        onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-6 right-4 bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2 z-50 active:scale-95 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {getTotalItems() > 0 ? (
          <span className="font-bold">{getTotalPrice().toFixed(2)}</span>
        ) : (
          <span className="font-medium">السلة</span>
        )}
        {getTotalItems() > 0 && (
          <span className="bg-white text-blue-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
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

      {/* Custom Quick Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomItemModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">إضافة منتج سريع</h2>
                    <p className="text-sm text-emerald-200">للمنتجات النادرة أو الخاصة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomItemModal(false)}
                  className="text-white/80 hover:text-white transition p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Name Field - Required */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم المنتج <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: قطعة غيار..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  autoFocus
                />
              </div>

              {/* Price Field - Required */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  السعر (دينار) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customItem.price}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-lg font-semibold"
                />
              </div>

              {/* Quantity Field - Optional (defaults to 1) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الكمية <span className="text-gray-400 font-normal">(اختياري - الافتراضي: 1)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={customItem.quantity}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                />
              </div>

              {/* Note Field - Optional */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظة <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={customItem.note}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="أي تفاصيل إضافية..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                />
              </div>

              {/* Info Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-sm text-emerald-800 flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>هذا المنتج سيُضاف للسلة فقط ولن يُحفظ في قائمة المنتجات. مناسب للمنتجات النادرة أو الخاصة.</span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => {
                  setCustomItem({ name: '', price: '', quantity: '1', note: '' })
                  setShowCustomItemModal(false)
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCustomItem}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة للسلة
              </button>
            </div>
          </div>
        </div>
      )}

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
