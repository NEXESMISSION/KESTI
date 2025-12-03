import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Product, ProductCategory, Profile } from '@/lib/supabase'
import { useLoading } from '@/contexts/LoadingContext'
import ProductForm from '@/components/ProductForm'
import BulkProductImport from '@/components/BulkProductImport'
import SubscriptionBadge from '@/components/SubscriptionBadge'
import SubscriptionModal from '@/components/SubscriptionModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import AlertDialog from '@/components/AlertDialog'
import withSuspensionCheck from '@/components/withSuspensionCheck'

type ViewMode = 'products' | 'stock'

function Products() {
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // View mode - products or stock
  const [viewMode, setViewMode] = useState<ViewMode>('products')
  
  // Check for query param on mount
  useEffect(() => {
    if (router.query.view === 'stock') {
      setViewMode('stock')
    }
  }, [router.query.view])
  
  // Search & Filter states (shared)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Stock-specific filters
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc'>('name')
  
  // Stock editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newStockValue, setNewStockValue] = useState<string>('')
  const [updatingStock, setUpdatingStock] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, productId: string, productName: string }>({ show: false, productId: '', productName: '' })
  const [alertDialog, setAlertDialog] = useState<{ show: boolean, title: string, message: string, type: 'error' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' })
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
    document.title = 'KESTI - المنتجات والمخزون'
  }, [])

  const checkAuthAndFetch = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }
      
      await Promise.all([
        fetchProducts(session.user.id),
        fetchCategories(session.user.id)
      ])
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
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
    setError(null)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:category_id (id, name)`)
        .eq('owner_id', ownerId)
        .order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError('فشل تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (productId: string, file: File) => {
    if (!userId) return
    
    setUploadingImageFor(productId)
    showLoading('جاري رفع الصورة...')
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${productId}-${Date.now()}.${fileExt}`
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)
      
      // Update product with new image URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)
      
      if (updateError) throw updateError
      
      // Refresh products list
      await fetchProducts(userId)
      
      setUpdateSuccess(productId)
      setTimeout(() => setUpdateSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError('فشل رفع الصورة')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploadingImageFor(null)
      hideLoading()
    }
  }
  
  const handleImageClick = (productId: string) => {
    const input = document.getElementById(`image-input-${productId}`) as HTMLInputElement
    if (input) input.click()
  }
  
  const handleImageChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAlertDialog({
          show: true,
          title: 'نوع الملف غير صحيح',
          message: 'يرجى اختيار ملف صورة فقط (JPG, PNG, GIF, إلخ)',
          type: 'error'
        })
        // Clear the file input
        e.target.value = ''
        return
      }
      
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        setAlertDialog({
          show: true,
          title: 'الملف كبير جداً',
          message: `حجم الصورة: ${fileSizeMB} ميغابايت\n\nالحد الأقصى المسموح: 5 ميغابايت\n\nيرجى ضغط الصورة أو اختيار صورة أصغر`,
          type: 'warning'
        })
        // Clear the file input
        e.target.value = ''
        return
      }
      
      handleImageUpload(productId, file)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    showLoading('جاري حذف المنتج...')
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error
      setProducts(products.filter(p => p.id !== productId))
    } catch (err: any) {
      console.error('Error deleting product:', err)
      setError('فشل حذف المنتج')
      setTimeout(() => setError(null), 3000)
    } finally {
      hideLoading()
    }
  }

  // Stock helpers
  const getStockStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked' => {
    if (product.stock_quantity === null) return 'not_tracked'
    if (product.stock_quantity === 0) return 'out_of_stock'
    if (product.stock_quantity <= (product.low_stock_threshold || 10)) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusColor = (product: Product) => {
    const status = getStockStatus(product)
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-50'
      case 'low_stock': return 'text-yellow-600 bg-yellow-50'
      case 'out_of_stock': return 'text-red-600 bg-red-50'
      case 'not_tracked': return 'text-gray-500 bg-gray-50'
    }
  }

  const startEditing = (product: Product) => {
    setEditingProduct(product)
    setNewStockValue(product.stock_quantity !== null ? String(product.stock_quantity) : '0')
  }

  const saveStockChange = async () => {
    if (!editingProduct) return
    const newStock = parseFloat(newStockValue)
    if (isNaN(newStock) || newStock < 0) return
    
    setUpdatingStock(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', editingProduct.id)
      
      if (error) throw error
      
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, stock_quantity: newStock } : p
      ))
      setUpdateSuccess(editingProduct.id)
      setTimeout(() => {
        setUpdateSuccess(null)
        setEditingProduct(null)
      }, 1500)
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setUpdatingStock(false)
    }
  }

  // Filter products
  let filteredProducts = products

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.category_id === selectedCategory)
  }

  if (viewMode === 'stock' && stockStatus !== 'all') {
    filteredProducts = filteredProducts.filter(p => getStockStatus(p) === stockStatus)
  }

  // Sort (stock view only)
  if (viewMode === 'stock') {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'stock-asc') {
        const aStock = a.stock_quantity ?? -1
        const bStock = b.stock_quantity ?? -1
        return aStock - bStock
      }
      if (sortBy === 'stock-desc') {
        const aStock = a.stock_quantity ?? -1
        const bStock = b.stock_quantity ?? -1
        return bStock - aStock
      }
      return 0
    })
  }

  // Stats
  const inStockCount = products.filter(p => getStockStatus(p) === 'in_stock').length
  const lowStockCount = products.filter(p => getStockStatus(p) === 'low_stock').length
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out_of_stock').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 px-4 flex justify-between items-center">
          <Image src="/logo/logo no bg low qulity.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
          
          <div className="flex items-center gap-2 sm:gap-3">
            <SubscriptionBadge profile={profile} onClick={() => setShowSubscriptionModal(true)} />
            
            <button
              onClick={() => window.location.href = '/pos'}
              className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition"
              title="نقطة البيع"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-5 gap-2 py-3">
            <button
              onClick={() => window.location.href = '/products'}
              className="py-2 rounded-lg text-center bg-blue-600 text-white"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📦</span>
                <span className="text-[10px] sm:text-xs">المنتجات</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/finance'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">💰</span>
                <span className="text-[10px] sm:text-xs">المالية</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/credits'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">💳</span>
                <span className="text-[10px] sm:text-xs">الديون</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/expenses'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/history'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📜</span>
                <span className="text-[10px] sm:text-xs">السجل</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 px-4">
        {/* Show loading spinner until data is loaded */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">جاري تحميل المنتجات...</p>
            </div>
          </div>
        ) : (
          <>
        {/* View Toggle - Products / Stock */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('products')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === 'products'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">📦</span>
              <span>المنتجات</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{products.length}</span>
            </button>
            <button
              onClick={() => setViewMode('stock')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === 'stock'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">🏷️</span>
              <span>المخزون</span>
              {lowStockCount > 0 && (
                <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">{lowStockCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Stock Status Cards - Stock View Only */}
        {viewMode === 'stock' && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setStockStatus(stockStatus === 'in_stock' ? 'all' : 'in_stock')}
              className={`p-3 rounded-xl text-center transition-all ${
                stockStatus === 'in_stock' ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white shadow'
              }`}
            >
              <div className="text-2xl mb-1">✓</div>
              <div className="text-lg font-bold text-green-600">{inStockCount}</div>
              <div className="text-[10px] text-gray-500">متوفر</div>
            </button>
            <button
              onClick={() => setStockStatus(stockStatus === 'low_stock' ? 'all' : 'low_stock')}
              className={`p-3 rounded-xl text-center transition-all ${
                stockStatus === 'low_stock' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'bg-white shadow'
              }`}
            >
              <div className="text-2xl mb-1">⚠</div>
              <div className="text-lg font-bold text-yellow-600">{lowStockCount}</div>
              <div className="text-[10px] text-gray-500">منخفض</div>
            </button>
            <button
              onClick={() => setStockStatus(stockStatus === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`p-3 rounded-xl text-center transition-all ${
                stockStatus === 'out_of_stock' ? 'ring-2 ring-red-500 bg-red-50' : 'bg-white shadow'
              }`}
            >
              <div className="text-2xl mb-1">✗</div>
              <div className="text-lg font-bold text-red-600">{outOfStockCount}</div>
              <div className="text-[10px] text-gray-500">نفذ</div>
            </button>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl shadow p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 بحث..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="">كل الفئات</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}

            {/* Sort - Stock view only */}
            {viewMode === 'stock' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="name">الاسم</option>
                <option value="stock-asc">المخزون ↑</option>
                <option value="stock-desc">المخزون ↓</option>
              </select>
            )}

            {/* Add Product - Products view only */}
            {viewMode === 'products' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <span>📤</span>
                  <span className="hidden sm:inline">استيراد</span>
                </button>
                <button
                  onClick={() => { setSelectedProduct(undefined); setShowProductForm(true) }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <span>+</span>
                  <span>إضافة منتج</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center text-sm text-gray-500 mb-4">
          عرض {filteredProducts.length} من {products.length} منتج
        </div>

        {/* Products/Stock List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900">لا توجد منتجات</h3>
            <p className="text-sm text-gray-500 mt-2">أضف منتجات للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border-2 ${
                  updateSuccess === product.id ? 'border-green-500' : 'border-transparent'
                }`}
              >
                {/* Product Image & Name */}
                <div className="p-3 flex items-center gap-3">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id={`image-input-${product.id}`}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(product.id, e)}
                  />
                  
                  {/* Clickable Image with + Icon */}
                  <div 
                    className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
                    onClick={() => handleImageClick(product.id)}
                  >
                    {uploadingImageFor === product.id ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : (
                      <>
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📦</div>
                        )}
                        {/* + Icon Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.category?.name || 'غير مصنف'}</p>
                  </div>
                </div>

                {/* View-specific content */}
                {viewMode === 'products' ? (
                  /* Products View */
                  <>
                    <div className="px-3 pb-2 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500">التكلفة</div>
                        <div className="font-semibold text-gray-700">{product.cost_price?.toFixed(2) || '0'}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xs text-blue-600">البيع</div>
                        <div className="font-bold text-blue-700">{product.selling_price?.toFixed(2) || '0'}</div>
                      </div>
                    </div>
                    <div className="border-t flex divide-x divide-gray-100">
                      <button
                        onClick={() => { setSelectedProduct(product); setShowProductForm(true) }}
                        className="flex-1 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, productId: product.id, productName: product.name })}
                        className="flex-1 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </>
                ) : (
                  /* Stock View */
                  <>
                    <div className="px-3 pb-2">
                      {editingProduct?.id === product.id ? (
                        /* Editing Mode */
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-700">الكمية الجديدة:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setNewStockValue(String(Math.max(0, (parseFloat(newStockValue) || 0) - 1)))}
                                className="w-8 h-8 bg-white rounded-lg border text-lg font-bold"
                              >−</button>
                              <input
                                type="number"
                                value={newStockValue}
                                onChange={(e) => setNewStockValue(e.target.value)}
                                className="w-16 text-center border rounded-lg py-1.5 font-semibold"
                                min="0"
                              />
                              <button
                                onClick={() => setNewStockValue(String((parseFloat(newStockValue) || 0) + 1))}
                                className="w-8 h-8 bg-white rounded-lg border text-lg font-bold"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingProduct(null)}
                              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium"
                            >إلغاء</button>
                            <button
                              onClick={saveStockChange}
                              disabled={updatingStock}
                              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                            >
                              {updatingStock ? '...' : 'حفظ'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="flex items-center justify-between">
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStockStatusColor(product)}`}>
                            {product.stock_quantity !== null ? (
                              <>{product.stock_quantity} {product.unit_type}</>
                            ) : (
                              'غير متتبع'
                            )}
                          </div>
                          <button
                            onClick={() => startEditing(product)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                          >
                            تعديل الكمية
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Stock status indicator */}
                    {product.stock_quantity !== null && (
                      <div className="px-3 pb-3">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              getStockStatus(product) === 'in_stock' ? 'bg-green-500' :
                              getStockStatus(product) === 'low_stock' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (product.stock_quantity / (product.low_stock_threshold || 10)) * 50)}%`
                            }}
                          />
                        </div>
                        {product.low_stock_threshold && (
                          <div className="text-[10px] text-gray-400 mt-1 text-left">
                            تنبيه عند: {product.low_stock_threshold}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        product={selectedProduct}
        onProductSaved={() => {
          setShowProductForm(false)
          if (userId) fetchProducts(userId)
        }}
      />

      {/* Bulk Import Modal */}
      <BulkProductImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => {
          setShowBulkImport(false)
          if (userId) fetchProducts(userId)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, productId: '', productName: '' })}
        onConfirm={() => handleDeleteProduct(deleteConfirm.productId)}
        title="حذف منتج"
        message={
          <>
            هل أنت متأكد من حذف <strong className="text-gray-900">{deleteConfirm.productName}</strong>؟
            <br />
            <span className="text-red-600 font-semibold">لن تتمكن من استعادته لاحقاً</span>
          </>
        }
        confirmText="حذف"
        cancelText="إلغاء"
        confirmColor="red"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      {/* Alert Dialog (for errors/warnings) */}
      <AlertDialog
        isOpen={alertDialog.show}
        onClose={() => setAlertDialog({ show: false, title: '', message: '', type: 'error' })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        buttonText="حسناً"
      />

      {/* Subscription Modal */}
      {profile && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          profile={profile}
        />
      )}
    </div>
  )
}

export default withSuspensionCheck(Products)

