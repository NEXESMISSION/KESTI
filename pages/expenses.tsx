import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'

interface Expense {
  id: string
  description: string
  amount: number
  category: string | null
  expense_type: 'one_time' | 'recurring'
  recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  next_occurrence_date: string | null
  is_active: boolean
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
  const [expenseType, setExpenseType] = useState<'one_time' | 'recurring'>('one_time')
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [nextOccurrenceDate, setNextOccurrenceDate] = useState('')
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'one_time' | 'recurring'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
        expense_type: expenseType,
      }

      if (expenseType === 'recurring') {
        expenseData.recurring_frequency = recurringFrequency
        expenseData.next_occurrence_date = nextOccurrenceDate || new Date().toISOString().split('T')[0]
        expenseData.is_active = true
      }

      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error
        setSuccess('Expense updated successfully!')
      } else {
        // Create new expense
        expenseData.owner_id = session.user.id
        
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData])

        if (error) throw error
        setSuccess('Expense added successfully!')
      }

      // Reset form and refresh
      resetForm()
      setShowModal(false)
      await fetchExpenses(session.user.id)
    } catch (err: any) {
      console.error('Error saving expense:', err)
      setError('Failed to save expense')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setCategory(expense.category || '')
    setExpenseType(expense.expense_type)
    if (expense.expense_type === 'recurring') {
      setRecurringFrequency(expense.recurring_frequency || 'monthly')
      setNextOccurrenceDate(expense.next_occurrence_date || '')
    }
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

  const handleToggleActive = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ is_active: !expense.is_active })
        .eq('id', expense.id)

      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      if (session) await fetchExpenses(session.user.id)
    } catch (err: any) {
      console.error('Error toggling expense:', err)
      setError('Failed to update expense')
    }
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('')
    setExpenseType('one_time')
    setRecurringFrequency('monthly')
    setNextOccurrenceDate('')
    setEditingExpense(null)
    setError(null)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      router.push('/login')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
    const matchesType = filterType === 'all' || expense.expense_type === filterType
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
    
    return matchesType && matchesCategory && matchesTimeFilter
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
  
  const totalOneTime = timeFilteredExpenses
    .filter(e => e.expense_type === 'one_time')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  
  const totalRecurring = timeFilteredExpenses
    .filter(e => e.expense_type === 'recurring' && e.is_active)
    .reduce((sum, e) => sum + Number(e.amount), 0)

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
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
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
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap bg-blue-600 text-white"
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

        {/* Expense Summary - Horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-2 mb-4 sm:mb-6">
          <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-6 min-w-max sm:min-w-0">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">One-Time Expenses</h3>
                <span className="text-lg sm:text-xl bg-blue-50 text-blue-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{formatCurrency(totalOneTime)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {timeFilteredExpenses.filter(e => e.expense_type === 'one_time').length} expenses
                {timeFilter !== 'all' && (
                  <span className="ml-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'Today' : 
                     timeFilter === 'week' ? '7 days' : 
                     timeFilter === 'month' ? '30 days' : ''}
                  </span>
                )}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Recurring</h3>
                <span className="text-lg sm:text-xl bg-red-50 text-red-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{formatCurrency(totalRecurring)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {timeFilteredExpenses.filter(e => e.expense_type === 'recurring' && e.is_active).length} active
                {timeFilter !== 'all' && (
                  <span className="ml-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'Today' : 
                     timeFilter === 'week' ? '7 days' : 
                     timeFilter === 'month' ? '30 days' : ''}
                  </span>
                )}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Expenses</h3>
                <span className="text-lg sm:text-xl bg-gray-100 text-gray-700 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {formatCurrency(totalOneTime + totalRecurring)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {timeFilteredExpenses.length} total
                {timeFilter !== 'all' && (
                  <span className="ml-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'Today' : 
                     timeFilter === 'week' ? '7 days' : 
                     timeFilter === 'month' ? '30 days' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Button - Always visible */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Expense</span>
          </button>
        </div>

        {/* Collapsible Filter Options */}
        <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">
          {/* Filter Header - Tap to expand */}
          <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="font-medium text-sm sm:text-base">Filters</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {(filterType !== 'all' ? 1 : 0) + (filterCategory ? 1 : 0) + (timeFilter !== 'all' ? 1 : 0)}
              </span>
            </div>
            
            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Filter Options - Expandable */}
          {filtersExpanded && (
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Time Period</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Filter by Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Expenses</option>
                    <option value="one_time">One-Time Only</option>
                    <option value="recurring">Recurring Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search Category</label>
                  <input
                    type="text"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    placeholder="e.g., Rent, Utilities..."
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    autoComplete="off"
                  />
                </div>

                {/* Clear Filters */}
                {(filterType !== 'all' || filterCategory || timeFilter !== 'all') && (
                  <div className="sm:col-span-2">
                    <button
                      onClick={() => {
                        setFilterType('all')
                        setFilterCategory('')
                        setTimeFilter('all')
                      }}
                      className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Count - Always Visible */}
          <div className="border-t border-gray-200 p-2 sm:p-3 text-xs sm:text-sm text-gray-600 text-center bg-gray-50">
            Showing <span className="font-semibold text-blue-600">{filteredExpenses.length}</span> of {expenses.length} expenses
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
            <h3 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">No expenses yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Click "New Expense" to start tracking your business expenses
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
                        {expense.category || 'No category'} • {formatDate(expense.created_at)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                  
                  <div className="px-3 pb-2 flex items-center gap-1.5">
                    {expense.expense_type === 'one_time' ? (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        One-time
                      </span>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {expense.recurring_frequency}
                        </span>
                        {expense.is_active ? (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                    {expense.expense_type === 'recurring' && (
                      <button
                        onClick={() => handleToggleActive(expense)}
                        className="flex-1 py-2 text-xs text-indigo-600 font-medium hover:bg-indigo-50"
                      >
                        {expense.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDescription(expense.description)
                        setAmount(String(expense.amount))
                        setCategory(expense.category || '')
                        setExpenseType(expense.expense_type)
                        if (expense.expense_type === 'recurring') {
                          setRecurringFrequency(expense.recurring_frequency as any || 'monthly')
                          setNextOccurrenceDate(expense.next_occurrence_date || '')
                        }
                        setEditingExpense(expense)
                        setShowModal(true)
                      }}
                      className="flex-1 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 py-2 text-xs text-red-600 font-medium hover:bg-red-50"
                    >
                      Delete
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
                        Description
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {expense.expense_type === 'one_time' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              One-time
                            </span>
                          ) : (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {expense.recurring_frequency}
                              </span>
                              {expense.is_active ? (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {formatDate(expense.created_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {expense.expense_type === 'recurring' && (
                              <button
                                onClick={() => handleToggleActive(expense)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title={expense.is_active ? "Deactivate" : "Activate"}
                              >
                                {expense.is_active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setDescription(expense.description)
                                setAmount(String(expense.amount))
                                setCategory(expense.category || '')
                                setExpenseType(expense.expense_type)
                                if (expense.expense_type === 'recurring') {
                                  setRecurringFrequency(expense.recurring_frequency as any || 'monthly')
                                  setNextOccurrenceDate(expense.next_occurrence_date || '')
                                }
                                setEditingExpense(expense)
                                setShowModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
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
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="e.g., Office Rent, Electricity Bill"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
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
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Rent, Utilities, Salary"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Expense Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Type *
                  </label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="one_time">One-Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>

                {/* Recurring Options */}
                {expenseType === 'recurring' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency *
                      </label>
                      <select
                        value={recurringFrequency}
                        onChange={(e) => setRecurringFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Occurrence Date
                      </label>
                      <input
                        type="date"
                        value={nextOccurrenceDate}
                        onChange={(e) => setNextOccurrenceDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                  >
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withSuspensionCheck(Expenses)
