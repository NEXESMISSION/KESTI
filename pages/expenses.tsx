import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'

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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      await fetchExpenses(session.user.id)
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      localStorage.clear()
      sessionStorage.clear()
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.replace('/login?logout=true')
    } catch (error) {
      console.error('Error logging out:', error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login?logout=true')
    }
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
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to POS */}
              <button
                onClick={() => window.location.href = '/pos'}
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

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3 py-3">
            <button
              onClick={() => window.location.href = '/owner-dashboard'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المنتجات"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📦</span>
                <span className="text-[10px] sm:text-xs">المنتجات</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/stock'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
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
              onClick={() => window.location.href = '/credits'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="الديون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💳</span>
                <span className="text-[10px] sm:text-xs">الديون</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/expenses'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-blue-600 text-white"
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
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 sm:py-3 rounded-lg relative flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:py-3 rounded-lg relative flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}


        {/* Main Total Card - Simple & Clean */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
            <div className="text-center">
              <p className="text-sm sm:text-base opacity-90 mb-2">💸 إجمالي المصروفات</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">{formatCurrency(totalExpenses)}</p>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <span className="text-xs sm:text-sm">{timeFilteredExpenses.length} مصروف</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl mb-3">💵</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-gray-500 mt-2">إجمالي المصروفات</p>
          </div>
        </div>

        {/* Quick Add Button & Saved Templates - Always visible */}
        <div className="flex justify-end gap-3 mb-4">
          {savedTemplates.length > 0 && (
            <button
              onClick={() => setShowSavedTemplates(!showSavedTemplates)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Saved ({savedTemplates.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              resetForm()
              setSuccess(null)
              setShowModal(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>مصروف جديد</span>
          </button>
        </div>
        
        {/* Saved Templates List */}
        {showSavedTemplates && savedTemplates.length > 0 && (
          <div className="bg-white rounded-xl shadow mb-4 p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved Expense Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedTemplates.map((template, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition cursor-pointer bg-gradient-to-br from-purple-50 to-white"
                  onClick={() => handleLoadTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{template.description}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTemplate(index)
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-purple-600 font-bold text-lg">{parseFloat(template.amount).toFixed(2)} TND</p>
                  {template.category && (
                    <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simple Filters - Always visible, no collapse */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">الفترة</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="all">الكل</option>
                <option value="today">اليوم</option>
                <option value="week">7 أيام</option>
                <option value="month">30 يوم</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory('')
                  setTimeFilter('all')
                }}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="flex justify-center items-center h-40 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
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
                            {false && (
                              <button
                                onClick={() => handleToggleActive(expense)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title={expense.is_active ? "إيقاف" : "تفعيل"}
                              >
                                {expense.is_active ? "إيقاف" : "تفعيل"}
                              </button>
                            )}
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

                {false && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التكرار *
                      </label>
                      <select
                        value={recurringFrequency}
                        onChange={(e) => setRecurringFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">يومي</option>
                        <option value="weekly">أسبوعي</option>
                        <option value="monthly">شهري</option>
                        <option value="yearly">سنوي</option>
                        <option value="custom">مخصص (اختر الفترة)</option>
                      </select>
                    </div>

                    {/* Custom Interval Options */}
                    {recurringFrequency === 'custom' && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          كل كم من الوقت؟
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">العدد</label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={customIntervalAmount}
                              onChange={(e) => setCustomIntervalAmount(e.target.value)}
                              placeholder="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">الوحدة</label>
                            <select
                              value={customIntervalUnit}
                              onChange={(e) => setCustomIntervalUnit(e.target.value as any)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="minutes">دقيقة/دقائق</option>
                              <option value="hours">ساعة/ساعات</option>
                              <option value="days">يوم/أيام</option>
                              <option value="weeks">أسبوع/أسابيع</option>
                              <option value="months">شهر/أشهر</option>
                              <option value="years">سنة/سنوات</option>
                            </select>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
                          <span className="font-medium">المعاينة:</span> كل {customIntervalAmount} {' '}
                          {customIntervalUnit === 'minutes' && (parseInt(customIntervalAmount) === 1 ? 'دقيقة' : 'دقائق')}
                          {customIntervalUnit === 'hours' && (parseInt(customIntervalAmount) === 1 ? 'ساعة' : 'ساعات')}
                          {customIntervalUnit === 'days' && (parseInt(customIntervalAmount) === 1 ? 'يوم' : 'أيام')}
                          {customIntervalUnit === 'weeks' && (parseInt(customIntervalAmount) === 1 ? 'أسبوع' : 'أسابيع')}
                          {customIntervalUnit === 'months' && (parseInt(customIntervalAmount) === 1 ? 'شهر' : 'أشهر')}
                          {customIntervalUnit === 'years' && (parseInt(customIntervalAmount) === 1 ? 'سنة' : 'سنوات')}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        متى يبدأ المصروف المتكرر؟
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="start-now"
                            name="start-option"
                            checked={!useCustomDate}
                            onChange={() => {
                              setUseCustomDate(false)
                              setNextOccurrenceDate(new Date().toISOString().split('T')[0])
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor="start-now" className="text-sm text-gray-700 cursor-pointer">
                            ابدأ اليوم
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="start-custom"
                            name="start-option"
                            checked={useCustomDate}
                            onChange={() => {
                              setUseCustomDate(true)
                              // Set to tomorrow as default
                              const tomorrow = new Date()
                              tomorrow.setDate(tomorrow.getDate() + 1)
                              setNextOccurrenceDate(tomorrow.toISOString().split('T')[0])
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor="start-custom" className="text-sm text-gray-700 cursor-pointer">
                            اختر تاريخ محدد
                          </label>
                        </div>
                        {useCustomDate && (
                          <input
                            type="date"
                            value={nextOccurrenceDate}
                            onChange={(e) => setNextOccurrenceDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                          />
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">ملاحظة:</p>
                          <p>
                            {recurringFrequency === 'daily' && 'سيتم إضافة هذا المصروف تلقائيًا كل يوم'}
                            {recurringFrequency === 'weekly' && 'سيتم إضافة هذا المصروف تلقائيًا كل أسبوع'}
                            {recurringFrequency === 'monthly' && 'سيتم إضافة هذا المصروف تلقائيًا كل شهر'}
                            {recurringFrequency === 'yearly' && 'سيتم إضافة هذا المصروف تلقائيًا كل عام'}
                            {recurringFrequency === 'custom' && `سيتم إضافة هذا المصروف تلقائيًا كل ${customIntervalAmount} `}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'minutes' && (parseInt(customIntervalAmount) === 1 ? 'دقيقة' : 'دقائق')}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'hours' && (parseInt(customIntervalAmount) === 1 ? 'ساعة' : 'ساعات')}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'days' && (parseInt(customIntervalAmount) === 1 ? 'يوم' : 'أيام')}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'weeks' && (parseInt(customIntervalAmount) === 1 ? 'أسبوع' : 'أسابيع')}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'months' && (parseInt(customIntervalAmount) === 1 ? 'شهر' : 'أشهر')}
                            {recurringFrequency === 'custom' && customIntervalUnit === 'years' && (parseInt(customIntervalAmount) === 1 ? 'سنة' : 'سنوات')}
                            {!useCustomDate && ' بدءًا من اليوم'}
                            {useCustomDate && nextOccurrenceDate && ` بدءًا من ${new Date(nextOccurrenceDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                          </p>
                          <p className="mt-1 text-blue-700">
                            يمكنك إيقاف أو تعديل المصروف المتكرر في أي وقت.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

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
    </div>
  )
}

export default withSuspensionCheck(Expenses)
