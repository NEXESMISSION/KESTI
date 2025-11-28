import { useState, useRef, ChangeEvent } from 'react'
import { supabase, Product } from '@/lib/supabase'

type BulkProductImportProps = {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

type ProductRow = {
  name: string
  selling_price: number
  cost_price: number
  unit_type: 'item' | 'kg' | 'g' | 'l' | 'ml'
  category_name?: string
  stock_quantity?: number
  low_stock_threshold?: number
  row_number: number
}

export default function BulkProductImport({ isOpen, onClose, onImportComplete }: BulkProductImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<ProductRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setSuccess(null)
    setShowPreview(false)

    // Validate file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)')
      setFile(null)
      return
    }

    // Parse the file
    try {
      const products = await parseFile(selectedFile)
      setPreview(products)
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message || 'Failed to parse file')
      setFile(null)
    }
  }

  const parseFile = async (file: File): Promise<ProductRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          const fileExtension = file.name.split('.').pop()?.toLowerCase()

          let products: ProductRow[] = []

          if (fileExtension === 'csv') {
            products = parseCSV(text)
          } else {
            // For Excel files, we need a library. For now, ask user to convert to CSV
            throw new Error('Please convert Excel file to CSV format. Excel support coming soon!')
          }

          if (products.length === 0) {
            throw new Error('No valid products found in file')
          }

          resolve(products)
        } catch (err: any) {
          reject(err)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const parseCSV = (text: string): ProductRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row')
    }

    // Expected columns: name, selling_price, cost_price, unit_type, category_name, stock_quantity, low_stock_threshold
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const products: ProductRow[] = []

    // Validate required headers
    const requiredHeaders = ['name', 'selling_price', 'cost_price', 'unit_type']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length < 4) continue // Skip invalid rows

      try {
        const name = values[headers.indexOf('name')]
        const selling_price = parseFloat(values[headers.indexOf('selling_price')])
        const cost_price = parseFloat(values[headers.indexOf('cost_price')])
        const unit_type = values[headers.indexOf('unit_type')] as 'item' | 'kg' | 'g' | 'l' | 'ml'

        // Validate unit_type
        if (!['item', 'kg', 'g', 'l', 'ml'].includes(unit_type)) {
          throw new Error(`Invalid unit_type at row ${i + 1}: ${unit_type}. Must be one of: item, kg, g, l, ml`)
        }

        // Validate required fields
        if (!name || isNaN(selling_price) || isNaN(cost_price)) {
          throw new Error(`Invalid data at row ${i + 1}. Name, selling_price, and cost_price are required.`)
        }

        const product: ProductRow = {
          name,
          selling_price,
          cost_price,
          unit_type,
          row_number: i + 1,
        }

        // Optional fields
        const categoryIdx = headers.indexOf('category_name')
        if (categoryIdx !== -1 && values[categoryIdx]) {
          product.category_name = values[categoryIdx]
        }

        const stockQtyIdx = headers.indexOf('stock_quantity')
        if (stockQtyIdx !== -1 && values[stockQtyIdx]) {
          const qty = parseFloat(values[stockQtyIdx])
          if (!isNaN(qty)) product.stock_quantity = qty
        }

        const lowStockIdx = headers.indexOf('low_stock_threshold')
        if (lowStockIdx !== -1 && values[lowStockIdx]) {
          const threshold = parseFloat(values[lowStockIdx])
          if (!isNaN(threshold)) product.low_stock_threshold = threshold
        }

        products.push(product)
      } catch (err: any) {
        throw new Error(err.message || `Error parsing row ${i + 1}`)
      }
    }

    return products
  }

  const handleImport = async () => {
    if (!preview || preview.length === 0) {
      setError('No products to import')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('Not authenticated')

      const userId = session.user.id

      // Get or create categories
      const categoryMap = new Map<string, string>()
      const categoryNames = preview.map(p => p.category_name).filter((name): name is string => Boolean(name))
      const uniqueCategories = Array.from(new Set(categoryNames))

      if (uniqueCategories.length > 0) {
        // Fetch existing categories
        const { data: existingCategories } = await supabase
          .from('product_categories')
          .select('id, name')
          .eq('owner_id', userId)

        existingCategories?.forEach(cat => {
          categoryMap.set(cat.name.toLowerCase(), cat.id)
        })

        // Create missing categories
        const categoriesToCreate = uniqueCategories.filter(
          cat => !categoryMap.has(cat!.toLowerCase())
        )

        if (categoriesToCreate.length > 0) {
          const { data: newCategories, error: catError } = await supabase
            .from('product_categories')
            .insert(
              categoriesToCreate.map(name => ({
                name,
                owner_id: userId,
              }))
            )
            .select()

          if (catError) throw catError

          newCategories?.forEach(cat => {
            categoryMap.set(cat.name.toLowerCase(), cat.id)
          })
        }
      }

      // Prepare products for insertion
      const productsToInsert = preview.map(product => ({
        name: product.name,
        selling_price: product.selling_price,
        cost_price: product.cost_price,
        unit_type: product.unit_type,
        owner_id: userId,
        category_id: product.category_name
          ? categoryMap.get(product.category_name.toLowerCase()) || null
          : null,
        stock_quantity: product.stock_quantity || null,
        low_stock_threshold: product.low_stock_threshold || null,
        image_url: null,
      }))

      // Insert products
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select()

      if (insertError) throw insertError

      setSuccess(`Successfully imported ${data?.length || 0} products!`)
      setShowPreview(false)
      setFile(null)
      setPreview([])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent to refresh products
      setTimeout(() => {
        onImportComplete()
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error('Error importing products:', err)
      setError(err.message || 'Failed to import products')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `name,selling_price,cost_price,unit_type,category_name,stock_quantity,low_stock_threshold
Product 1,15.50,10.00,item,Electronics,100,10
Product 2,25.75,18.50,kg,Food,50,5
Product 3,8.00,5.50,l,Beverages,200,20`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">استيراد المنتجات بالجملة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 التعليمات</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>قم بتنزيل نموذج ملف CSV أدناه</li>
              <li>املأ ملف CSV ببيانات منتجاتك</li>
              <li>ارفع الملف وراجع المعاينة</li>
              <li>انقر على "استيراد" لإضافة المنتجات</li>
            </ol>
            
            <div className="mt-3">
              <button
                onClick={downloadTemplate}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تنزيل نموذج CSV
              </button>
            </div>
          </div>

          {/* File Format Info */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📄 تنسيق الملف</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>الأعمدة المطلوبة:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-gray-200 px-1 rounded">name</code> - اسم المنتج</li>
                <li><code className="bg-gray-200 px-1 rounded">selling_price</code> - سعر البيع (رقم)</li>
                <li><code className="bg-gray-200 px-1 rounded">cost_price</code> - سعر التكلفة (رقم)</li>
                <li><code className="bg-gray-200 px-1 rounded">unit_type</code> - نوع الوحدة (item, kg, g, l, ml)</li>
              </ul>
              <p className="mt-2"><strong>الأعمدة الاختيارية:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-gray-200 px-1 rounded">category_name</code> - اسم الفئة</li>
                <li><code className="bg-gray-200 px-1 rounded">stock_quantity</code> - كمية المخزون (رقم)</li>
                <li><code className="bg-gray-200 px-1 rounded">low_stock_threshold</code> - حد التنبيه (رقم)</li>
              </ul>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر ملف CSV
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Preview */}
          {showPreview && preview.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                معاينة المنتجات ({preview.length} منتج)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">الاسم</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">سعر البيع</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">سعر التكلفة</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">الوحدة</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">الفئة</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">{product.row_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.selling_price.toFixed(2)} TND</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.cost_price.toFixed(2)} TND</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{product.unit_type}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{product.category_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{product.stock_quantity || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
            >
              إلغاء
            </button>
            {showPreview && preview.length > 0 && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'جاري الاستيراد...' : `استيراد ${preview.length} منتج`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
