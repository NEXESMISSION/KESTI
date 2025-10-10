import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import ProductForm from '@/components/ProductForm'
import CartItem from '@/components/CartItem'

function POS() {
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
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [showSizeSlider, setShowSizeSlider] = useState(false)
  const [productSize, setProductSize] = useState(3) // 1-5 scale for product size
  const [showLowStockModal, setShowLowStockModal] = useState(false)

  // Calculate low stock items (products with stock < 10)
  const lowStockProducts = products.filter(product => (product.stock_quantity ?? 0) < 10)
  const lowStockCount = lowStockProducts.length

  useEffect(() => {
    checkAuthAndFetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
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
        quantity: item.quantity,
        price_at_sale: item.product.selling_price,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

      if (itemsError) throw itemsError

      setSuccess('Checkout complete!')
      clearCart()
      setShowCart(false)
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError('Failed to process checkout')
    } finally {
      setProcessingCheckout(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-10 w-auto" priority />
            
            <div className="flex items-center gap-3">
              {/* Low Stock Alert Button */}
              <button
                onClick={() => setShowLowStockModal(true)}
                className="relative bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg transition-all transform hover:scale-105"
                aria-label="تنبيهات المخزون المنخفض"
                title="تنبيهات المخزون المنخفض"
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
                {lowStockCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold px-1.5 animate-pulse shadow-lg">
                    {lowStockCount}
                  </span>
                )}
              </button>
              
              {/* Add Product Button */}
              <button
                onClick={() => {
                  setSelectedProduct(undefined)
                  setShowProductForm(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-all transform hover:scale-105"
                aria-label="إضافة منتج"
                title="إضافة منتج"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              
              {/* Owner Panel Icon Button */}
              <button
                onClick={() => setShowPinModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-all transform hover:scale-105"
                aria-label="لوحة المالك"
                title="لوحة المالك"
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
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-all transform hover:scale-105"
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
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
          
          {/* Category Filter */}
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                كل المنتجات
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${selectedCategory === category.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
              انقر على زر + أعلاه لإضافة منتجك الأول
            </p>
          </div>
        ) : (
          <>
            {/* Size Controls */}
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowSizeSlider(!showSizeSlider)}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
                <span>حجم المنتجات</span>
              </button>
            </div>
            
            {showSizeSlider && (
              <div className="mt-2 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">صغير</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={productSize} 
                    onChange={(e) => setProductSize(parseInt(e.target.value))} 
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">كبير</span>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="mt-4 grid gap-4 transition-all duration-300"
                 style={{
                   gridTemplateColumns: `repeat(auto-fill, minmax(${70 + productSize * 30}px, 1fr))`
                 }}>
            {products
              .filter(product => !selectedCategory || product.category_id === selectedCategory)
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex flex-col relative group"
                >
                  {/* Product image */}
                  <div className="w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden transition-all duration-300"
                       style={{ height: `${80 + productSize * 20}px` }}>
                    {product.image_url ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={product.image_url} 
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 384px"
                          className="object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xl">
                        لا توجد صورة
                      </div>
                    )}
                  </div>
                  
                  {/* Edit button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      setShowProductForm(true);
                    }}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="تعديل المنتج"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  
                  {/* Product info */}
                  <div className="font-medium text-gray-900 truncate">{product.name}</div>
                  <div className="text-gray-700 mt-1">
                    {product.selling_price.toFixed(2)} TND / {product.unit_type}
                  </div>
                  
                  {/* Category tag */}
                  {product.category && (
                    <div className="mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                      {product.category.name}
                    </div>
                  )}
                  
                  {/* Add to cart button */}
                  <button
                    onClick={() => {
                      // For weight/volume items, add unit selection
                      if (product.unit_type !== 'item') {
                        // Open a modal or use a different method to select quantity
                        // For now, just add 1 quantity with 1 unit
                        addToCart(product, 1, 1);
                      } else {
                        addToCart(product);
                      }
                    }}
                    className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    أضف إلى السلة
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-40">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">سلة التسوق</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p>سلة التسوق فارغة</p>
                <p className="text-sm text-gray-500 mt-2">أضف بعض المنتجات للبدء</p>
                <button 
                  onClick={() => setShowCart(false)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  متابعة التسوق
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {cart.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
                
                <div className="border-t border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-700">المجموع الفرعي</div>
                    <div className="font-medium text-lg">{getTotalPrice().toFixed(2)} دينار</div>
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
                        جاري المعالجة...
                      </>
                    ) : (
                      <>إتمام الشراء ({getTotalPrice().toFixed(2)} دينار)</>
                    
                    )}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition text-sm"
                  >
                    إفراغ السلة
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
        aria-label="فتح السلة"
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

      {/* Low Stock Alert Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowLowStockModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
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
                <h2 className="text-xl font-bold">تنبيه المخزون المنخفض</h2>
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {lowStockCount === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-20 h-20 mx-auto text-green-500 mb-4"
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
                  <p className="text-xl text-gray-600 font-semibold">لا توجد منتجات منخفضة المخزون</p>
                  <p className="text-gray-500 mt-2">جميع المنتجات لديها مخزون كافٍ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-orange-200">
                    <p className="text-gray-700 font-semibold text-lg">
                      المنتجات ذات المخزون المنخفض: <span className="text-orange-600">{lowStockCount}</span>
                    </p>
                  </div>
                  
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover w-16 h-16"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
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
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.category?.name || 'بدون فئة'}
                        </p>
                      </div>

                      {/* Stock Badge */}
                      <div className="flex-shrink-0">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-center min-w-[80px]">
                          <div className="text-2xl font-bold">{product.stock_quantity ?? 0}</div>
                          <div className="text-xs">متبقي</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
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

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          /* Reduce alert button size on mobile */
          .relative.bg-orange-600 {
            padding: 0.625rem;
          }
          .relative.bg-orange-600 svg {
            height: 1.25rem;
            width: 1.25rem;
          }
          /* Adjust badge positioning for mobile */
          .relative.bg-orange-600 .animate-pulse {
            min-width: 20px;
            height: 20px;
            font-size: 0.65rem;
            top: -0.375rem;
            right: -0.375rem;
          }
          /* Modal adjustments for mobile */
          .max-w-2xl {
            max-width: calc(100vw - 2rem);
          }
          /* Low stock modal header on mobile */
          .bg-orange-600.px-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .bg-orange-600 h2 {
            font-size: 1.125rem;
          }
          .bg-orange-600 svg.h-7 {
            height: 1.5rem;
            width: 1.5rem;
          }
          /* Product cards in modal on mobile */
          .p-4.bg-red-50 {
            padding: 0.75rem;
            gap: 0.75rem;
          }
          .p-4.bg-red-50 h3 {
            font-size: 1rem;
          }
          .p-4.bg-red-50 .w-16.h-16 {
            width: 3rem;
            height: 3rem;
          }
          .min-w-\[80px\] {
            min-width: 60px;
            padding: 0.5rem;
          }
          .min-w-\[80px\] .text-2xl {
            font-size: 1.5rem;
          }
          .min-w-\[80px\] .text-xs {
            font-size: 0.625rem;
          }
        }
      `}</style>
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(POS)
