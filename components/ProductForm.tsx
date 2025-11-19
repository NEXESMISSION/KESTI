import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase, Product, ProductCategory } from '@/lib/supabase'
import Image from 'next/image'
import CategoryModal from './CategoryModal'

type ProductFormProps = {
  isOpen: boolean
  onClose: () => void
  product?: Product // For editing
  onProductSaved: () => void
}

// Unit type options for dropdown
const UNIT_TYPES = [
  { value: 'item', label: 'لكل قطعة' },
  { value: 'kg', label: 'لكل كيلوغرام' },
  { value: 'g', label: 'لكل غرام' },
  { value: 'l', label: 'لكل لتر' },
  { value: 'ml', label: 'لكل ملليتر' },
]

export default function ProductForm({ isOpen, onClose, product, onProductSaved }: ProductFormProps) {
  const [name, setName] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [unitType, setUnitType] = useState('item')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [stockQuantity, setStockQuantity] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [trackStock, setTrackStock] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('الصورة كبيرة جدًا. يرجى اختيار صورة أقل من 5 ميجابايت.')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة.')
      return
    }

    setImageFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Helper function to compress image
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Resize if image is too large (max 1200px on longest side)
          const maxSize = 1200
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize
              width = maxSize
            } else {
              width = (width / height) * maxSize
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with compression (0.85 quality)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'))
                return
              }
              
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              
              console.log('Original size:', (file.size / 1024).toFixed(2), 'KB')
              console.log('Compressed size:', (compressedFile.size / 1024).toFixed(2), 'KB')
              
              resolve(compressedFile)
            },
            'image/jpeg',
            0.85 // 85% quality
          )
        }
        img.onerror = () => reject(new Error('Could not load image'))
      }
      reader.onerror = () => reject(new Error('Could not read file'))
    })
  }

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    try {
      setUploading(true)
      setUploadProgress(0)
      
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('User not authenticated')
      
      const userId = user.id
      
      // Compress image before upload
      console.log('Compressing image...')
      const compressedImage = await compressImage(imageFile)
      
      const fileExt = 'jpg' // Always use jpg after compression
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`
      
      // Start upload process
      setUploadProgress(10)
      
      console.log('Uploading to product-images bucket...')
      
      // Upload directly to product-images bucket
      setUploadProgress(30)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedImage, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        console.error('Error details:', uploadError.message, uploadError.statusCode)
        
        // Check if it's a bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
          throw new Error(
            'Storage bucket "product-images" not found. Please create it in your Supabase dashboard: ' +
            'Storage → New bucket → Name: product-images → Public: Yes'
          )
        }
        
        // Check if it's a policy/permission error
        if (uploadError.message?.includes('policy') || uploadError.statusCode === '403') {
          throw new Error(
            'Permission denied. Please set up storage policies in Supabase SQL Editor. ' +
            'See SETUP_STORAGE_BUCKETS.sql for the required policies.'
          )
        }
        
        throw new Error(`Upload failed: ${uploadError.message}`)
      }
      
      console.log('Upload successful:', uploadData)
      setUploadProgress(80)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }
      
      console.log('Image URL:', urlData.publicUrl)
      setUploading(false)
      setUploadProgress(100)
      
      return urlData.publicUrl
    } catch (err: any) {
      console.error('خطأ في تحميل الصورة:', err)
      setUploading(false)
      setError(`فشل تحميل الصورة. يرجى المحاولة مرة أخرى.`)
      setUploadProgress(0)
      return null
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    if (!name || !sellingPrice) {
      setError('اسم المنتج وسعر البيع مطلوبان')
      setLoading(false)
      return
    }

    try {
      // Calculate numeric values
      const sellingPriceNum = parseFloat(sellingPrice)
      const costPriceNum = costPrice ? parseFloat(costPrice) : 0
      
      // Stock related values
      let stockQty = null
      let lowStockThresh = null
      
      if (trackStock) {
        if (!stockQuantity) {
          setError('يرجى ملء جميع الحقول المطلوبة')
          setLoading(false)
          return
        }
        
        stockQty = parseFloat(stockQuantity)
        lowStockThresh = parseFloat(lowStockThreshold)
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('Not authenticated')
      const userId = session.user.id

      // Upload image if there's a new one or use existing URL
      let finalImageUrl = imageUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) finalImageUrl = uploadedUrl
      }
      
      const productData: any = {
        name,
        selling_price: sellingPriceNum,
        cost_price: costPriceNum,
        unit_type: unitType,
        image_url: finalImageUrl,
        category_id: categoryId,
        stock_quantity: stockQty,
        low_stock_threshold: lowStockThresh,
      }
      
      let result
      
      if (isEditing && product) {
        // For updates, don't include owner_id (it shouldn't change)
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // For inserts, include owner_id
        productData.owner_id = userId
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
      console.error('خطأ في حفظ المنتج:', err)
      setError(`فشل ${isEditing ? 'تحديث' : 'إضافة'} المنتج`)
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
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
                اسم المنتج *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>
            
            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سعر البيع *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm pointer-events-none">TND</span>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سعر التكلفة *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm pointer-events-none">TND</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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
                نوع الوحدة *
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                {[
                  { value: 'item', label: 'قطعة' },
                  { value: 'kg', label: 'كجم' },
                  { value: 'g', label: 'غرام' },
                  { value: 'ml', label: 'مل' },
                  { value: 'l', label: 'لتر' },
                ].map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                للمنتجات بالوزن/الحجم، السعر لكل وحدة (مثال: السعر لكل كجم)
              </p>
            </div>
            
            {/* Category with Create Button */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  الفئة
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + إدارة الفئات
                </button>
              </div>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر فئة</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                صورة المنتج
              </label>
              
              {/* Image preview */}
              {(imagePreview || imageUrl) && (
                <div className="mb-3 relative w-full h-40 border rounded-lg overflow-hidden">
                  <Image 
                    src={imagePreview || imageUrl} 
                    alt="معاينة المنتج" 
                    fill
                    className="object-contain"
                    loading="lazy"
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setImageUrl('');
                    }} 
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* File input */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">انقر للرفع</span> أو اسحب وأفلت</p>
                    <p className="text-xs text-gray-500">PNG, JPG أو WebP (الحد الأقصى 5 ميجابايت)</p>
                  </div>
                  <input 
                    id="dropzone-file" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              {/* Upload progress */}
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
              

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
                  تتبع المخزون (اختياري)
                </label>
              </div>
              
              {trackStock && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      كمية المخزون *
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
                      {unitType === 'item' ? 'عدد القطع' : `الكمية بال${unitType}`}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تنبيه انخفاض المخزون
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
                      تنبيه عندما يكون المخزون أقل من هذا
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
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث المنتج' : 'إضافة المنتج'}
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
