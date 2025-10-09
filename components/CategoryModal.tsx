import { useState, useEffect } from 'react'
import { supabase, ProductCategory } from '@/lib/supabase'

type CategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onCategoryCreated: (category: ProductCategory) => void
}

export default function CategoryModal({ isOpen, onClose, onCategoryCreated }: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setCategoryName('')
      setError(null)
    }
  }, [isOpen])

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
      setError('فشل تحميل الفئات')
    }
  }

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      setError('اسم الفئة مطلوب')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('product_categories')
        .insert([
          { name: categoryName.trim(), owner_id: session.user.id }
        ])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setCategories(prev => [...prev, data])
        setCategoryName('')
        onCategoryCreated(data)
      }
    } catch (err: any) {
      console.error('Error creating category:', err)
      setError('فشل إنشاء الفئة')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError('فشل حذف الفئة')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">إدارة الفئات</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              فئة جديدة
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="أدخل اسم الفئة"
              />
              <button
                onClick={handleCreateCategory}
                disabled={loading}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition"
              >
                إضافة
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">فئاتك</h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-sm">لم يتم إنشاء فئات بعد.</p>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center justify-between py-2 px-4">
                    <span className="text-sm">{category.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                      title="حذف الفئة"
                    >
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
