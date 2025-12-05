import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Profile } from '@/lib/supabase'
import { useLoading } from '@/contexts/LoadingContext'
import PageHeader from '@/components/PageHeader'
import SubscriptionModal from '@/components/SubscriptionModal'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import AutoClearWarning from '@/components/AutoClearWarning'

interface Expense {
  id: string
  description: string
  amount: number
  category: string | null
  created_at: string
}

function Expenses() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  
  // Form states
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  // Filter states
  const [filterType, setFilterType] = useState<'all'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  // Saved templates feature
  const [savedTemplates, setSavedTemplates] = useState<Array<{description: string, amount: string, category: string}>>([])
  const [showSavedTemplates, setShowSavedTemplates] = useState(false)
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [loadedFromTemplate, setLoadedFromTemplate] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
    // Set document title
    document.title = 'KESTI - المصروفات'
    
    // Load saved templates from localStorage
    const saved = localStorage.getItem('expense_templates')
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading templates:', e)
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndFetch = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      await fetchExpenses(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async (ownerId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (err: any) {
      console.error('Error fetching expenses:', err)
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const expenseData: any = {
        description,
        amount: parseFloat(amount),
        category: category || null,
        expense_type: 'one_time', // Always one_time
      }

      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error
        setSuccess('Expense updated successfully!')
        resetForm()
        setShowModal(false)
      } else {
        // Create new expense
        expenseData.owner_id = session.user.id
        
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData])

        if (error) throw error
        
        // Only show save button if NOT loaded from template
        if (!loadedFromTemplate) {
          setShowSaveButton(true)
        } else {
          // If loaded from template, show success and close
          setSuccess('Expense added successfully!')
          resetForm()
          setShowModal(false)
          // Clear success after 3 seconds
          setTimeout(() => setSuccess(null), 3000)
        }
      }

      // Refresh expenses
      await fetchExpenses(session.user.id)
    } catch (err: any) {
      console.error('Error saving expense:', err)
      setError('Failed to save expense')
    }
  }
  
  const handleSaveTemplate = () => {
    const newTemplate = {
      description,
      amount,
      category
    }
    const updatedTemplates = [...savedTemplates, newTemplate]
    setSavedTemplates(updatedTemplates)
    localStorage.setItem('expense_templates', JSON.stringify(updatedTemplates))
    
    // Show success message at top
    setSuccess('Template saved successfully!')
    
    // Close and reset
    setShowSaveButton(false)
    resetForm()
    setShowModal(false)
    
    // Clear success after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }
  
  const handleLoadTemplate = (template: {description: string, amount: string, category: string}) => {
    setDescription(template.description)
    setAmount(template.amount)
    setCategory(template.category)
    setLoadedFromTemplate(true) // Mark as loaded from template
    setSuccess(null) // Clear any previous success messages
    setShowModal(true)
    setShowSavedTemplates(false)
  }
  
  const handleDeleteTemplate = (index: number) => {
    const updatedTemplates = savedTemplates.filter((_, i) => i !== index)
    setSavedTemplates(updatedTemplates)
    localStorage.setItem('expense_templates', JSON.stringify(updatedTemplates))
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setCategory(expense.category || '')
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      if (session) await fetchExpenses(session.user.id)
      
      setSuccess('Expense deleted successfully!')
    } catch (err: any) {
      console.error('Error deleting expense:', err)
      setError('Failed to delete expense')
    }
  }


  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('')
    setEditingExpense(null)
    setError(null)
    setShowSaveButton(false)
    setLoadedFromTemplate(false)
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} TND`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = !filterCategory || 
      (expense.category && expense.category.toLowerCase().includes(filterCategory.toLowerCase()))
    
    // Apply time filter
    let matchesTimeFilter = true
    if (timeFilter !== 'all') {
      const expenseDate = new Date(expense.created_at)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      if (timeFilter === 'today') {
        matchesTimeFilter = expenseDate >= today
      } else if (timeFilter === 'week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        matchesTimeFilter = expenseDate >= weekStart
      } else if (timeFilter === 'month') {
        const monthStart = new Date(today)
        monthStart.setDate(today.getDate() - 30)
        matchesTimeFilter = expenseDate >= monthStart
      }
    }
    
    return matchesCategory && matchesTimeFilter
  })

  // Filter by time first for expense calculations
  const getTimeFilteredExpenses = (expenses: Expense[]) => {
    if (timeFilter === 'all') return expenses
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.created_at)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      if (timeFilter === 'today') {
        return expenseDate >= today
      } else if (timeFilter === 'week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        return expenseDate >= weekStart
      } else if (timeFilter === 'month') {
        const monthStart = new Date(today)
        monthStart.setDate(today.getDate() - 30)
        return expenseDate >= monthStart
      }
      return true
    })
  }
  
  // Calculate totals
  const timeFilteredExpenses = getTimeFilteredExpenses(expenses)
  
  // Calculate total expenses
  const totalExpenses = timeFilteredExpenses
    .reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoClearWarning />
      
      <PageHeader />

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-2 py-3">
            <button onClick={() => window.location.href = '/products'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📦</span>
                <span className="text-[10px] sm:text-xs">المنتجات</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/finance'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">💰</span>
                <span className="text-[10px] sm:text-xs">المالية</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/credits'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">💳</span>
                <span className="text-[10px] sm:text-xs">الديون</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/expenses'} className="py-2 rounded-lg text-center bg-red-600 text-white">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/history'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📜</span>
                <span className="text-[10px] sm:text-xs">السجل</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-8">
        {/* Show loading spinner until data is loaded */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">جاري تحميل المصروفات...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span className="font-medium">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-700">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-700">✕</button>
          </div>
        )}

        {/* Quick Add Button - Top Priority */}
        <div
          onClick={() => { resetForm(); setSuccess(null); setShowModal(true); }}
          className="mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">إضافة مصروف جديد</h3>
              <p className="text-xs text-red-100">سجّل مصروفاتك بسهولة</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl mb-1">💸</p>
            <p className="text-xl sm:text-2xl font-black text-red-600">{totalExpenses.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">إجمالي المصروفات</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl mb-1">📝</p>
            <p className="text-xl sm:text-2xl font-black text-gray-800">{timeFilteredExpenses.length}</p>
            <p className="text-[10px] text-gray-500">عدد المصروفات</p>
          </div>
        </div>

        {/* Saved Templates - Compact */}
        {savedTemplates.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowSavedTemplates(!showSavedTemplates)}
              className="w-full bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📑</span>
                <span className="font-medium text-purple-700">القوالب المحفوظة ({savedTemplates.length})</span>
              </div>
              <svg className={`w-5 h-5 text-purple-500 transition-transform ${showSavedTemplates ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSavedTemplates && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {savedTemplates.map((template, index) => (
                  <div
                    key={index}
                    onClick={() => handleLoadTemplate(template)}
                    className="bg-white border border-purple-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm text-gray-900 truncate flex-1">{template.description}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(index); }}
                        className="text-red-400 hover:text-red-600 ml-1"
                      >✕</button>
                    </div>
                    <p className="text-purple-600 font-bold mt-1">{parseFloat(template.amount).toFixed(2)} TND</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Filter - Simple Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'today', label: 'اليوم' },
            { key: 'week', label: 'أسبوع' },
            { key: 'month', label: 'شهر' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                timeFilter === f.key
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow">
            <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">لا توجد مصروفات بعد</h3>
            <p className="mt-2 text-sm text-gray-600">
              انقر على "مصروف جديد" لبدء تتبع مصروفات عملك
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-lg shadow mb-3 overflow-hidden">
                  <div className="p-3 flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{expense.description}</h4>
                      <p className="text-xs text-gray-500">
                        {expense.category || 'بدون فئة'} • {formatDate(expense.created_at)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                    <button
                      onClick={() => {
                        setDescription(expense.description)
                        setAmount(String(expense.amount))
                        setCategory(expense.category || '')
                        setEditingExpense(expense)
                        setShowModal(true)
                      }}
                      className="flex-1 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 py-2 text-xs text-red-600 font-medium hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الوصف
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الفئة
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {expense.category || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className="font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {formatDate(expense.created_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setDescription(expense.description)
                                setAmount(String(expense.amount))
                                setCategory(expense.category || '')
                                setEditingExpense(expense)
                                setShowModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
          </>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف *
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="مثال: إيجار المكتب، فاتورة الكهرباء"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثال: إيجار، مرافق، راتب"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Buttons */}
                {!showSaveButton ? (
                  // Normal form buttons (before adding expense)
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                    >
                      {editingExpense ? 'تحديث' : 'إضافة'} المصروف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  // After adding expense - show save template option
                  <div className="flex flex-col gap-3 pt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-green-700 font-medium mb-2">✓ Expense added successfully!</p>
                      <p className="text-sm text-gray-600">Would you like to save this as a template?</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span>Save as Template</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
                    >
                      No Thanks, Close
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

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

export default withSuspensionCheck(Expenses)

