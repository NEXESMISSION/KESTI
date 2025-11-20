import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Product } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'

function Stock() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc'>('name')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Stock editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newStockValue, setNewStockValue] = useState<string>('')
  const [updatingStock, setUpdatingStock] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndFetch()
    // Set document title
    document.title = 'KESTI - المخزون'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthAndFetch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      await fetchProducts(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      window.location.href = '/login'
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
    } catch (err: any) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      window.location.href = '/login?logout=true'
    } catch (error) {
      console.error('Error logging out:', error)
      window.location.href = '/login?logout=true'
    }
  }

  const getStockStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked' => {
    if (product.stock_quantity === null) return 'not_tracked'
    if (product.stock_quantity === 0) return 'out_of_stock'
    if (product.stock_quantity <= (product.low_stock_threshold || 10)) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusColor = (product: Product) => {
    const status = getStockStatus(product)
    switch (status) {
      case 'in_stock': return 'text-green-600'
      case 'low_stock': return 'text-yellow-600'
      case 'out_of_stock': return 'text-red-600'
      case 'not_tracked': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return '✓ In Stock'
      case 'low_stock': return '⚠ Low Stock'
      case 'out_of_stock': return '✗ Out of Stock'
      case 'not_tracked': return '- Not Tracked'
      default: return 'Unknown'
    }
  }

  // Apply filters
  let filteredProducts = products

  // Filter by stock status
  if (stockStatus !== 'all') {
    filteredProducts = filteredProducts.filter(p => getStockStatus(p) === stockStatus)
  }

  // Filter by search term
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  // Filter by category
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category_id === categoryFilter)
  }

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'stock-asc') {
      const aStock = a.stock_quantity !== null ? a.stock_quantity : -1
      const bStock = b.stock_quantity !== null ? b.stock_quantity : -1
      return aStock - bStock
    } else if (sortBy === 'stock-desc') {
      const aStock = a.stock_quantity !== null ? a.stock_quantity : -1
      const bStock = b.stock_quantity !== null ? b.stock_quantity : -1
      return bStock - aStock
    }
    return 0
  })

  // Calculate statistics
  const trackedProducts = products.filter(p => p.stock_quantity !== null)
  const inStockCount = products.filter(p => getStockStatus(p) === 'in_stock').length
  const lowStockCount = products.filter(p => getStockStatus(p) === 'low_stock').length
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out_of_stock').length
  const notTrackedCount = products.filter(p => getStockStatus(p) === 'not_tracked').length
  
  // Count active filters for badge
  const getActiveFilterCount = () => {
    let count = 0
    if (searchTerm !== '') count++
    if (stockStatus !== 'all') count++
    if (categoryFilter !== 'all') count++
    if (sortBy !== 'name') count++
    return count
  }

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  
  // Stock editing functions
  const startEditing = (product: Product) => {
    setEditingProduct(product)
    setNewStockValue(product.stock_quantity !== null ? String(product.stock_quantity) : '0')
    setUpdateError(null)
    setUpdateSuccess(null)
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setNewStockValue('')
    setUpdateError(null)
  }

  const saveStockChange = async () => {
    if (!editingProduct) return
    
    // Validate input
    const newStock = parseFloat(newStockValue)
    if (isNaN(newStock) || newStock < 0) {
      setUpdateError('Please enter a valid number (0 or greater)')
      return
    }
    
    setUpdatingStock(true)
    try {
      // Update the stock in Supabase
      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', editingProduct.id)
      
      if (error) throw error
      
      // Update local state
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, stock_quantity: newStock } : p
      ))
      
      setUpdateSuccess(`Stock updated to ${newStock} ${editingProduct.unit_type}`)
      setTimeout(() => {
        setUpdateSuccess(null)
        setEditingProduct(null)
      }, 2000)
    } catch (error) {
      console.error('Error updating stock:', error)
      setUpdateError('Failed to update stock. Please try again.')
    } finally {
      setUpdatingStock(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to POS */}
              <button
                onClick={() => router.push('/pos')}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="العودة إلى نقطة البيع"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="تسجيل الخروج"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-3 py-3">
            <button
              onClick={() => window.location.href = '/owner-dashboard'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="لوحة التحكم"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">🏦</span>
                <span className="text-[10px] sm:text-xs">لوحة التحكم</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/stock'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-blue-600 text-white"
              title="المخزون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">🏷️</span>
                <span className="text-[10px] sm:text-xs">المخزون</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/finance'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المالية"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💰</span>
                <span className="text-[10px] sm:text-xs">المالية</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/expenses'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المصروفات"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/history'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="السجل"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📜</span>
                <span className="text-[10px] sm:text-xs">السجل</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Search Bar - Always Visible */}
        <div className="bg-white rounded-xl shadow mb-4 relative">
          <div className="p-3 sm:p-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 بحث عن منتجات..."
                className="w-full px-4 py-2 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
        
        {/* Collapsible Filter Options */}
        <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">
          {/* Filter Header - Tap to expand */}
          <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="font-medium text-sm sm:text-base">التصفية والترتيب</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">{getActiveFilterCount()}</span>
            </div>
            
            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Filter Options - Expandable */}
          {filtersExpanded && (
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Stock Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">حالة المخزون</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">كل المنتجات</option>
                    <option value="in_stock">متوفر</option>
                    <option value="low_stock">مخزون منخفض</option>
                    <option value="out_of_stock">نفذ من المخزون</option>
                    <option value="not_tracked">غير متتبع</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الفئة</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">كل الفئات</option>
                    {categories.map((cat) => cat && (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="name">الاسم (أ-ي)</option>
                    <option value="stock-asc">المخزون (من الأقل إلى الأعلى)</option>
                    <option value="stock-desc">المخزون (من الأعلى إلى الأقل)</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStockStatus('all')
                      setSearchTerm('')
                      setCategoryFilter('all')
                      setSortBy('name')
                    }}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    مسح كل الفلاتر
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Count - Always Visible */}
          <div className="border-t border-gray-200 p-2 sm:p-3 text-xs sm:text-sm text-gray-600 text-center bg-gray-50">
            عرض <span className="font-semibold text-blue-600">{filteredProducts.length}</span> من {products.length} منتج
          </div>
        </div>

        {/* Products Display - Cards on Mobile, Table on Desktop */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 sm:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-xs sm:text-sm text-gray-500">جاري تحميل بيانات المخزون...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-gray-900">لم يتم العثور على منتجات</h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">حاول تعديل الفلاتر أو أضف منتجات أولاً</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-3 flex items-center space-x-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded overflow-hidden">
                          {product.image_url ? (
                            <Image 
                              src={product.image_url} 
                              alt={product.name} 
                              width={48} 
                              height={48} 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                              quality={75}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-xs">No img</div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category?.name || 'غير مصنف'}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                        <div className="flex justify-between items-center">
                          {/* Unit Type */}
                          <div className="text-xs text-gray-500">
                            {product.unit_type}
                          </div>
                          
                          {/* Status Badge */}
                          <div>
                            {product.stock_quantity !== null ? (
                              getStockStatus(product) === 'in_stock' ? (
                                <span className="px-1.5 py-0.5 text-xs leading-none font-medium rounded-full bg-green-100 text-green-800">
                                  متوفر
                                </span>
                              ) : getStockStatus(product) === 'low_stock' ? (
                                <span className="px-1.5 py-0.5 text-xs leading-none font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  مخزون منخفض
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-xs leading-none font-medium rounded-full bg-red-100 text-red-800">
                                  نفذ من المخزون
                                </span>
                              )
                            ) : (
                              <span className="px-1.5 py-0.5 text-xs leading-none font-medium rounded-full bg-gray-100 text-gray-800">
                                غير متتبع
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Stock Level with Edit Button */}
                        {editingProduct?.id === product.id ? (
                          <div className="mt-2 border border-blue-200 rounded-lg p-2 bg-blue-50">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs font-medium text-gray-700">تحديث المخزون:</div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => {
                                    const currentVal = parseFloat(newStockValue) || 0;
                                    setNewStockValue(String(Math.max(0, currentVal - 1)));
                                  }}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 w-6 h-6 rounded flex items-center justify-center"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={newStockValue}
                                  onChange={(e) => setNewStockValue(e.target.value)}
                                  className="w-16 text-center text-xs border rounded py-1 px-1"
                                  min="0"
                                  step="0.1"
                                />
                                <button 
                                  onClick={() => {
                                    const currentVal = parseFloat(newStockValue) || 0;
                                    setNewStockValue(String(currentVal + 1));
                                  }}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 w-6 h-6 rounded flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            {updateError && (
                              <p className="text-xs text-red-500 mt-1">{updateError}</p>
                            )}
                            
                            <div className="flex justify-between mt-2 gap-1">
                              <button
                                onClick={cancelEditing}
                                className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={saveStockChange}
                                disabled={updatingStock}
                                className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded flex items-center justify-center gap-1"
                              >
                                {updatingStock ? (
                                  <>
                                    <div className="w-3 h-3 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                    حفظ...
                                  </>
                                ) : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                              {/* Stock Level */}
                              {product.stock_quantity !== null ? (
                                <span className={`text-xs font-semibold ${getStockStatusColor(product)}`}>
                                  {product.stock_quantity} {product.unit_type}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">بدون تتبع</span>
                              )}
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => startEditing(product)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded inline-flex items-center"
                                title="تعديل المخزون"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                تعديل
                              </button>
                            </div>
                            
                            {/* Low Stock Alert */}
                            {product.low_stock_threshold !== null && (
                              <span className="text-xs text-gray-500">
                                تنبيه: {product.low_stock_threshold}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Success Message */}
                        {updateSuccess && product.id === editingProduct?.id && (
                          <div className="mt-2 text-xs text-green-600 bg-green-50 p-1 rounded text-center">
                            {updateSuccess}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المنتج
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الفئة
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        نوع الوحدة
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مستوى المخزون
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تنبيه نقص المخزون
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-md overflow-hidden">
                              {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-xs">بدون صورة</div>
                              )}
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {product.category?.name || 'غير مصنف'}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {product.unit_type}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {product.stock_quantity !== null ? (
                            <span className={`font-semibold ${getStockStatusColor(product)}`}>
                              {product.stock_quantity} {product.unit_type}
                            </span>
                          ) : (
                            <span className="text-gray-500">بدون تتبع</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {product.low_stock_threshold !== null ? (
                            <span>{product.low_stock_threshold} {product.unit_type}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          {product.stock_quantity !== null ? (
                            getStockStatus(product) === 'in_stock' ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ✓ متوفر
                              </span>
                            ) : getStockStatus(product) === 'low_stock' ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                ⚠️ مخزون منخفض
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                ✗ نفذ من المخزون
                              </span>
                            )
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              غير متتبع
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {editingProduct?.id === product.id ? (
                            <div className="flex flex-col gap-2 max-w-[220px]">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const currentVal = parseFloat(newStockValue) || 0;
                                    setNewStockValue(String(Math.max(0, currentVal - 1)));
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={newStockValue}
                                  onChange={(e) => setNewStockValue(e.target.value)}
                                  className="w-20 text-center text-xs border rounded py-1 px-1"
                                  min="0"
                                  step="0.1"
                                />
                                <button
                                  onClick={() => {
                                    const currentVal = parseFloat(newStockValue) || 0;
                                    setNewStockValue(String(currentVal + 1));
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  +
                                </button>
                              </div>
                              
                              {updateError && (
                                <p className="text-xs text-red-500">{updateError}</p>
                              )}
                              
                              <div className="flex justify-start gap-2">
                                <button
                                  onClick={saveStockChange}
                                  disabled={updatingStock}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded flex items-center gap-1"
                                >
                                  {updatingStock ? (
                                    <>
                                      <div className="w-3 h-3 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                      Save
                                    </>
                                  ) : 'حفظ'}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-xs bg-gray-300 hover:bg-gray-400 py-1 px-2 rounded"
                                >
                                  إلغاء
                                </button>
                              </div>
                              
                              {updateSuccess && product.id === editingProduct?.id && (
                                <p className="text-xs text-green-600">{updateSuccess}</p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(product)}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-1 px-2 rounded inline-flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              تعديل المخزون
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default withSuspensionCheck(Stock)
