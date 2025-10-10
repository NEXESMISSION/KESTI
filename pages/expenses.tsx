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
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly')
  const [nextOccurrenceDate, setNextOccurrenceDate] = useState('')
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [customIntervalAmount, setCustomIntervalAmount] = useState('1')
  const [customIntervalUnit, setCustomIntervalUnit] = useState<'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'>('days')
  
  // Ref to prevent duplicate processing in React Strict Mode
  const processingRef = useRef(false)
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'one_time' | 'recurring'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndFetch()
    // Set document title
    document.title = 'KESTI - المصروفات'
    
    // Process on load with duplicate checking
    // Wait a bit to ensure expenses are loaded
    setTimeout(() => {
      processRecurringExpenses()
    }, 1000)
    
    // Set up interval to check every 10 seconds for minute-level precision
    const interval = setInterval(() => {
      processRecurringExpenses()
    }, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
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

  const processRecurringExpenses = async () => {
    // Prevent duplicate execution (React Strict Mode calls effects twice)
    if (processingRef.current) {
      console.log('Already processing, skipping...')
      return
    }
    
    processingRef.current = true
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        processingRef.current = false
        return
      }

      const now = new Date()

      // Get all active recurring expenses
      const { data: allRecurring, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', session.user.id)
        .eq('expense_type', 'recurring')
        .eq('is_active', true)

      if (fetchError) throw fetchError
      if (!allRecurring || allRecurring.length === 0) return

      // Filter to only process expenses that are actually due
      const dueExpenses = allRecurring.filter(expense => {
        const nextDate = new Date(expense.next_occurrence_date)
        return nextDate <= now
      })

      if (dueExpenses.length === 0) {
        console.log('No recurring expenses due at this time')
        return
      }

      console.log(`Processing ${dueExpenses.length} due recurring expenses...`)

      for (const expense of dueExpenses) {
        try {
          // Check if we already created an expense for this occurrence recently (last 2 minutes for tighter control)
          const twoMinutesAgo = new Date()
          twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)
          
          // Get the expected occurrence number
          const expectedOccurrence = (expense.occurrence_count || 0) + 1
          
          // Check if this specific occurrence was already created
          const { data: recentExpenses, error: recentError } = await supabase
            .from('expenses')
            .select('description, created_at')
            .eq('owner_id', session.user.id)
            .eq('expense_type', 'one_time')
            .eq('description', `${expense.description} (متكرر #${expectedOccurrence})`)
            .gte('created_at', twoMinutesAgo.toISOString())
          
          if (recentError) throw recentError
          
          if (recentExpenses && recentExpenses.length > 0) {
            console.log(`⏭️ Skipping ${expense.description} #${expectedOccurrence} - already created recently`)
            continue
          }
          
          // Calculate next occurrence date
          const currentDate = new Date(expense.next_occurrence_date)
          let nextDate = new Date(currentDate)

          if (expense.recurring_frequency === 'custom') {
            const amount = expense.custom_interval_amount || 1
            const unit = expense.custom_interval_unit || 'days'

            if (unit === 'minutes') {
              nextDate.setMinutes(currentDate.getMinutes() + amount)
            } else if (unit === 'hours') {
              nextDate.setHours(currentDate.getHours() + amount)
            } else if (unit === 'days') {
              nextDate.setDate(currentDate.getDate() + amount)
            } else if (unit === 'weeks') {
              nextDate.setDate(currentDate.getDate() + (amount * 7))
            } else if (unit === 'months') {
              nextDate.setMonth(currentDate.getMonth() + amount)
            } else if (unit === 'years') {
              nextDate.setFullYear(currentDate.getFullYear() + amount)
            }
          } else {
            switch (expense.recurring_frequency) {
              case 'daily':
                nextDate.setDate(currentDate.getDate() + 1)
                break
              case 'weekly':
                nextDate.setDate(currentDate.getDate() + 7)
                break
              case 'monthly':
                nextDate.setMonth(currentDate.getMonth() + 1)
                break
              case 'yearly':
                nextDate.setFullYear(currentDate.getFullYear() + 1)
                break
            }
          }

          // Get current occurrence count and increment it
          const occurrenceCount = (expense.occurrence_count || 0) + 1
          
          // Create a new one-time expense entry for this occurrence
          const newExpense = {
            owner_id: session.user.id,
            description: `${expense.description} (متكرر #${occurrenceCount})`,
            amount: expense.amount,
            category: expense.category,
            expense_type: 'one_time' as const,
            created_at: new Date().toISOString()
          }

          const { error: insertError } = await supabase
            .from('expenses')
            .insert([newExpense])

          if (insertError) throw insertError

          // Update the recurring expense template with next occurrence date and counter
          const { error: updateError } = await supabase
            .from('expenses')
            .update({ 
              next_occurrence_date: nextDate.toISOString(),
              occurrence_count: occurrenceCount
            })
            .eq('id', expense.id)

          if (updateError) throw updateError

          console.log(`✅ Created recurring expense entry: ${expense.description}`)
          console.log(`   Next occurrence: ${nextDate.toISOString()}`)
          console.log(`   Occurrence count: ${occurrenceCount}`)
        } catch (err) {
          console.error(`Error processing expense ${expense.id}:`, err)
        }
      }

      // Refresh the expenses list
      await fetchExpenses(session.user.id)
    } catch (err) {
      console.error('Error processing recurring expenses:', err)
    } finally {
      // Reset the flag after a short delay to allow next check
      setTimeout(() => {
        processingRef.current = false
      }, 1000) // 1 second cooldown (faster for 10-second intervals)
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
        expenseData.is_active = true
        
        // Calculate the NEXT occurrence date (not today, but after the interval)
        const startDate = nextOccurrenceDate ? new Date(nextOccurrenceDate) : new Date()
        let nextDate = new Date(startDate)
        
        if (recurringFrequency === 'custom') {
          const amount = parseInt(customIntervalAmount)
          const unit = customIntervalUnit
          
          if (unit === 'minutes') {
            nextDate.setMinutes(startDate.getMinutes() + amount)
          } else if (unit === 'hours') {
            nextDate.setHours(startDate.getHours() + amount)
          } else if (unit === 'days') {
            nextDate.setDate(startDate.getDate() + amount)
          } else if (unit === 'weeks') {
            nextDate.setDate(startDate.getDate() + (amount * 7))
          } else if (unit === 'months') {
            nextDate.setMonth(startDate.getMonth() + amount)
          } else if (unit === 'years') {
            nextDate.setFullYear(startDate.getFullYear() + amount)
          }
          
          // Save custom interval data
          expenseData.custom_interval_amount = amount
          expenseData.custom_interval_unit = unit
        } else {
          switch (recurringFrequency) {
            case 'daily':
              nextDate.setDate(startDate.getDate() + 1)
              break
            case 'weekly':
              nextDate.setDate(startDate.getDate() + 7)
              break
            case 'monthly':
              nextDate.setMonth(startDate.getMonth() + 1)
              break
            case 'yearly':
              nextDate.setFullYear(startDate.getFullYear() + 1)
              break
          }
        }
        
        // Set next occurrence to AFTER the first one
        expenseData.next_occurrence_date = nextDate.toISOString()
      }

      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error
        
        // If editing a recurring expense and it's active, create a new occurrence
        if (expenseType === 'recurring' && expenseData.is_active) {
          const newOccurrence = {
            owner_id: session.user.id,
            description: `${description} (متكرر #${(editingExpense as any).occurrence_count || 1})`,
            amount: parseFloat(amount),
            category: category || null,
            expense_type: 'one_time' as const,
            created_at: new Date().toISOString()
          }
          
          const { error: occurrenceError } = await supabase
            .from('expenses')
            .insert([newOccurrence])
          
          if (occurrenceError) {
            console.error('Error creating occurrence after edit:', occurrenceError)
          }
        }
        
        setSuccess('Expense updated successfully!')
      } else {
        // Create new expense
        expenseData.owner_id = session.user.id
        
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData])

        if (error) throw error
        
        // If it's a recurring expense, create the first occurrence immediately
        if (expenseType === 'recurring') {
          const firstExpense = {
            owner_id: session.user.id,
            description: `${description} (متكرر #1)`,
            amount: parseFloat(amount),
            category: category || null,
            expense_type: 'one_time' as const,
            created_at: new Date().toISOString()
          }
          
          const { error: firstError } = await supabase
            .from('expenses')
            .insert([firstExpense])
          
          if (firstError) {
            console.error('Error creating first recurring expense:', firstError)
          }
        }
        
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
  
  // Only count one-time expenses in the total (recurring are just templates)
  const totalOneTime = timeFilteredExpenses
    .filter(e => e.expense_type === 'one_time')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  
  // Count active recurring templates (for display only, not in total)
  const activeRecurringCount = timeFilteredExpenses
    .filter(e => e.expense_type === 'recurring' && e.is_active)
    .length
  
  // Total is only one-time expenses (actual expenses, not templates)
  const totalExpenses = totalOneTime

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
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

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-3 py-3">
            <button
              onClick={() => router.push('/owner-dashboard')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="لوحة التحكم"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">🏦</span>
                <span className="text-[10px] sm:text-xs">لوحة التحكم</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/stock')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المخزون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">🏷️</span>
                <span className="text-[10px] sm:text-xs">المخزون</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/finance')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المالية"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💰</span>
                <span className="text-[10px] sm:text-xs">المالية</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-blue-600 text-white"
              title="المصروفات"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/history')}
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


        {/* Expense Summary - Grid Layout for Mobile */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-white rounded-xl shadow p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-gray-500">مصروفات لمرة واحدة</h3>
                <span className="text-base sm:text-xl bg-blue-50 text-blue-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{formatCurrency(totalOneTime)}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">
                {timeFilteredExpenses.filter(e => e.expense_type === 'one_time').length} مصروف
                {timeFilter !== 'all' && (
                  <span className="mr-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'اليوم' : 
                     timeFilter === 'week' ? '7 أيام' : 
                     timeFilter === 'month' ? '30 يوم' : ''}
                  </span>
                )}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-gray-500">مصروفات متكررة</h3>
                <span className="text-base sm:text-xl bg-red-50 text-red-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{activeRecurringCount}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">
                قوالب نشطة
                {timeFilter !== 'all' && (
                  <span className="mr-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'اليوم' : 
                     timeFilter === 'week' ? '7 أيام' : 
                     timeFilter === 'month' ? '30 يوم' : ''}
                  </span>
                )}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-gray-500">إجمالي المصروفات</h3>
                <span className="text-base sm:text-xl bg-gray-100 text-gray-700 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">
                {timeFilteredExpenses.filter(e => e.expense_type === 'one_time').length} مصروف
                {timeFilter !== 'all' && (
                  <span className="mr-1.5 inline-block bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded-full">
                    {timeFilter === 'today' ? 'اليوم' : 
                     timeFilter === 'week' ? '7 أيام' : 
                     timeFilter === 'month' ? '30 يوم' : ''}
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
            <span>مصروف جديد</span>
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
            عرض <span className="font-semibold text-blue-600">{filteredExpenses.length}</span> من {expenses.length} مصروف
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
                  
                  <div className="px-3 pb-2 flex items-center gap-1.5">
                    {expense.expense_type === 'one_time' ? (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        لمرة واحدة
                      </span>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {expense.recurring_frequency}
                        </span>
                        {expense.is_active ? (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            نشط
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            غير نشط
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
                        {expense.is_active ? "إيقاف" : "تفعيل"}
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
                        النوع
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
                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {expense.expense_type === 'one_time' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              لمرة واحدة
                            </span>
                          ) : (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {expense.recurring_frequency}
                              </span>
                              {expense.is_active ? (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  نشط
                                </span>
                              ) : (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  غير نشط
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

                {/* Expense Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع المصروف *
                  </label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="one_time">لمرة واحدة</option>
                    <option value="recurring">متكرر</option>
                  </select>
                </div>

                {/* Recurring Options */}
                {expenseType === 'recurring' && (
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
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withSuspensionCheck(Expenses)
