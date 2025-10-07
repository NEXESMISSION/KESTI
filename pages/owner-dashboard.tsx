import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import ProductForm from '@/components/ProductForm'
import withSuspensionCheck from '@/components/withSuspensionCheck'

function OwnerDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
      await fetchProducts(session.user.id)
      await fetchCategories(session.user.id)
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
    setError(null)
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
      setError('Failed to load products. Make sure you have run the SQL migration!')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))
    } catch (err: any) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      window.location.href = '/login'
    } catch (error) {
      console.error('Error during logout:', error)
      window.location.href = '/login'
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">KESTI</h1>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to POS */}
              <button
                onClick={() => router.push('/pos')}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="Back to POS"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="Logout"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal Scrolling Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto py-3 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <button
              onClick={() => router.push('/owner-dashboard')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-blue-600 text-white"
            >
              🏦 Dashboard
            </button>
            <button
              onClick={() => router.push('/stock')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              🏷️ Stock
            </button>
            <button
              onClick={() => router.push('/finance')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              💰 Finance
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              📊 Expenses
            </button>
            <button
              onClick={() => router.push('/history')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              📜 History
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create, edit and organize your products</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg relative flex justify-between items-start">
            <div>
              <p className="font-bold text-sm sm:text-base">Error:</p>
              <p className="text-sm">{error}</p>
              <p className="mt-2 text-xs sm:text-sm">Please run the SQL migration from IMPORTANT_RUN_THIS_SQL.md</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold">Manage Products</h2>
          <button
            onClick={() => {
              setSelectedProduct(undefined)
              setShowProductForm(true)
            }}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition flex items-center justify-center sm:justify-start gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Product
          </button>
        </div>

        {/* Collapsible Category Filter */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-hidden">
            {/* Filter Header - Tap to expand */}
            <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="font-medium text-sm sm:text-base">Category Filter</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  {selectedCategory ? 1 : 0}
                </span>
              </div>
              
              <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Filter Options - Expandable */}
            {filtersExpanded && (
              <div className="border-t border-gray-200 p-3 sm:p-4">
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    >
                      All Products ({products.length})
                    </button>
                    
                    {categories.map((category) => {
                      const count = products.filter(p => p.category_id === category.id).length
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${selectedCategory === category.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                        >
                          {category.name} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Clear Filter */}
                {selectedCategory && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm transition flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Results Count */}
            <div className="border-t border-gray-200 p-2 sm:p-3 text-xs sm:text-sm text-gray-600 text-center bg-gray-50">
              Showing {filteredProducts.length} products
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">No products yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Click "Add New Product" to create your first product
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden">
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-3 flex items-center space-x-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0 h-14 w-14 bg-gray-100 rounded-md overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'} • {product.unit_type}</p>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">${product.selling_price?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-gray-500">Cost: ${product.cost_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowProductForm(true)
                        }}
                        className="flex-1 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 py-2 text-xs text-red-600 font-medium hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Type
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Price
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                                <svg
                                  className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {product.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {product.unit_type}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          ${product.cost_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          ${product.selling_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setShowProductForm(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
          fetchProducts(userId as string)
        }}
      />
    </div>
  )
}

export default withSuspensionCheck(OwnerDashboard)
