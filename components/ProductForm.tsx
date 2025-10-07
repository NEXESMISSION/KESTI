import { useState, useEffect, FormEvent } from 'react'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import CategoryModal from './CategoryModal'

type ProductFormProps = {
  isOpen: boolean
  onClose: () => void
  product?: Product // For editing
  onProductSaved: () => void
}

// Unit type options for dropdown
const UNIT_TYPES = [
  { value: 'item', label: 'Per Item' },
  { value: 'kg', label: 'Per Kilogram' },
  { value: 'g', label: 'Per Gram' },
  { value: 'l', label: 'Per Liter' },
  { value: 'ml', label: 'Per Milliliter' },
]

export default function ProductForm({ isOpen, onClose, product, onProductSaved }: ProductFormProps) {
  const [name, setName] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [unitType, setUnitType] = useState('item')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [stockQuantity, setStockQuantity] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [trackStock, setTrackStock] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  
  const isEditing = !!product
  
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      
      if (isEditing && product) {
        // Populate form with product data for editing
        setName(product.name)
        setSellingPrice(product.selling_price.toString())
        setCostPrice(product.cost_price.toString())
        setUnitType(product.unit_type)
        setImageUrl(product.image_url || '')
        setCategoryId(product.category_id)
        setStockQuantity(product.stock_quantity !== null ? product.stock_quantity.toString() : '')
        setLowStockThreshold(product.low_stock_threshold !== null ? product.low_stock_threshold.toString() : '10')
        setTrackStock(product.stock_quantity !== null)
      } else {
        // Reset form for new product
        setName('')
        setSellingPrice('')
        setCostPrice('')
        setUnitType('item')
        setImageUrl('')
        setCategoryId(null)
        setStockQuantity('')
        setLowStockThreshold('10')
        setTrackStock(false)
      }
      
      setError(null)
    }
  }, [isOpen, isEditing, product])
  
  const fetchCategories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      setError('Product name is required')
      return
    }
    
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      setError('Valid selling price is required')
      return
    }
    
    if (!costPrice || isNaN(Number(costPrice)) || Number(costPrice) < 0) {
      setError('Valid cost price is required')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      
      const productData: any = {
        name: name.trim(),
        selling_price: Number(sellingPrice),
        cost_price: Number(costPrice),
        unit_type: unitType,
        image_url: imageUrl.trim() || null,
        category_id: categoryId,
        owner_id: session.user.id,
      }
      
      // Add stock fields only if tracking stock
      if (trackStock && stockQuantity) {
        productData.stock_quantity = Number(stockQuantity)
        productData.low_stock_threshold = lowStockThreshold ? Number(lowStockThreshold) : 10
      } else {
        productData.stock_quantity = null
        productData.low_stock_threshold = null
      }
      
      let result
      
      if (isEditing && product) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()
        
        if (error) throw error
        result = data
      }
      
      onProductSaved()
      onClose()
    } catch (err: any) {
      console.error('Error saving product:', err)
      setError(`Failed to ${isEditing ? 'update' : 'create'} product`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCategoryCreated = (category: ProductCategory) => {
    setCategories(prev => [...prev, category])
    setCategoryId(category.id)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter product name"
                required
              />
            </div>
            
            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Unit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type *
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                {UNIT_TYPES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                For weight/volume products, price is per unit (e.g., price per kg)
              </p>
            </div>
            
            {/* Category with Create Button */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Manage Categories
                </button>
              </div>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {/* Stock Tracking (Optional) */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="trackStock"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="trackStock" className="ml-2 text-sm font-medium text-gray-700">
                  Track Stock (Optional)
                </label>
              </div>
              
              {trackStock && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="100"
                      step="0.01"
                      min="0"
                      required={trackStock}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {unitType === 'item' ? 'Number of items' : `Amount in ${unitType}`}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="10"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when stock is below this
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  )
}
