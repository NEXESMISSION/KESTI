import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Product type definition
type Product = {
  id: string
  name: string
  price: number
  unit_type: string
  created_at?: string
}

export default function ProductsSimple() {
  // State for products and UI
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // State for product form
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    unit_type: 'item' as 'item' | 'weight'
  })
  
  // Load products on mount
  useEffect(() => {
    checkSession()
    fetchProducts()
  }, [])
  
  // Check if user is authenticated and has the right role
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
  
  // Open modal to add/edit product
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setForm({
        name: product.name,
        price: product.price.toString(),
        unit_type: product.unit_type as 'item' | 'weight'
      })
    } else {
      setEditingProduct(null)
      setForm({
        name: '',
        price: '',
        unit_type: 'item'
      })
    }
    setShowModal(true)
  }
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setError(null)
      
      // Validate form
      if (!form.name.trim()) {
        setError('Product name is required')
        return
      }
      
      const price = parseFloat(form.price)
      if (isNaN(price) || price <= 0) {
        setError('Price must be a positive number')
        return
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      
      // Format the product data
      const productData = {
        name: form.name.trim(),
        price,
        unit_type: form.unit_type
      }
      
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        
        if (error) throw error
        
        setSuccess('Product updated successfully')
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            owner_id: session.user.id
          })
        
        if (error) throw error
        
        setSuccess('Product created successfully')
      }
      
      // Reset form and close modal
      setShowModal(false)
      fetchProducts()
    } catch (err: any) {
      console.error('Error saving product:', err)
      setError(err.message || 'Failed to save product')
    }
  }
  
  // Delete a product
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess('Product deleted successfully')
      fetchProducts()
    } catch (err: any) {
      console.error('Error deleting product:', err)
      setError(err.message || 'Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600">Manage your inventory</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/pos-simple'}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded"
            >
              Back to POS
            </button>
          </div>
        </div>
      </header>
      
      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-300 rounded p-4 text-red-700">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-300 rounded p-4 text-green-700">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Add Product Button */}
        <div className="mb-6">
          <button
            onClick={() => openProductModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            + Add New Product
          </button>
        </div>
        
        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">No products yet</h3>
              <p className="mt-1 text-gray-500">Create your first product by clicking &quot;Add New Product&quot;</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.price.toFixed(2)} TND</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {product.unit_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openProductModal(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({...form, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                <select
                  value={form.unit_type}
                  onChange={(e) => setForm({...form, unit_type: e.target.value as 'item' | 'weight'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="item">Item</option>
                  <option value="weight">Weight</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
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
