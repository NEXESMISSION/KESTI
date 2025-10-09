import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'

interface SaleItem {
  id: number
  product_name: string
  quantity: number
  price_at_sale: number
}

interface Sale {
  id: string
  total_amount: number
  payment_method: string
  created_at: string
  sale_items: SaleItem[]
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string | null
  expense_type: 'one_time' | 'recurring'
  created_at: string
}

function History() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'sales' | 'expenses'>('all')
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, startDate, endDate, minAmount, maxAmount, paymentMethod, sortBy])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      await Promise.all([
        fetchSales(session.user.id),
        fetchExpenses(session.user.id)
      ])
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    }
  }

  const fetchSales = async (ownerId: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_method,
          created_at,
          sale_items (
            id,
            product_name,
            quantity,
            price_at_sale
          )
        `)
        .eq('owner_id', ownerId)

      // Apply time filters
      const now = new Date()
      if (timeFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        query = query.gte('created_at', today.toISOString())
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        query = query.gte('created_at', monthAgo.toISOString())
      }

      // Apply custom date range
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDateTime.toISOString())
      }

      // Apply amount filters
      if (minAmount) {
        query = query.gte('total_amount', parseFloat(minAmount))
      }
      if (maxAmount) {
        query = query.lte('total_amount', parseFloat(maxAmount))
      }

      // Apply payment method filter
      if (paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod)
      }

      // Apply sorting
      if (sortBy === 'date-desc') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'date-asc') {
        query = query.order('created_at', { ascending: true })
      } else if (sortBy === 'amount-desc') {
        query = query.order('total_amount', { ascending: false })
      } else if (sortBy === 'amount-asc') {
        query = query.order('total_amount', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error

      setSales(data || [])
    } catch (err: any) {
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async (ownerId: string) => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', ownerId)

      // Apply time filters
      const now = new Date()
      if (timeFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        query = query.gte('created_at', today.toISOString())
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        query = query.gte('created_at', monthAgo.toISOString())
      }

      // Apply custom date range
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDateTime.toISOString())
      }

      // Apply amount filters
      if (minAmount) {
        query = query.gte('amount', parseFloat(minAmount))
      }
      if (maxAmount) {
        query = query.lte('amount', parseFloat(maxAmount))
      }

      // Apply sorting
      if (sortBy === 'date-desc') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'date-asc') {
        query = query.order('created_at', { ascending: true })
      } else if (sortBy === 'amount-desc') {
        query = query.order('amount', { ascending: false })
      } else if (sortBy === 'amount-asc') {
        query = query.order('amount', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error

      setExpenses(data || [])
    } catch (err: any) {
      console.error('Error fetching expenses:', err)
    }
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId)
  }

  const clearFilters = () => {
    setTimeFilter('all')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setPaymentMethod('all')
    setSearchTerm('')
    setSortBy('date-desc')
  }

  // Filter by search term (product name in items or expense description)
  const filteredSales = searchTerm
    ? sales.filter(sale =>
        sale.sale_items.some(item =>
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : sales

  const filteredExpenses = searchTerm
    ? expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.category && expense.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : expenses

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const netAmount = totalRevenue - totalExpenses

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
                title="العودة إلى نقطة البيع"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="تسجيل الخروج"
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
            >
              🏦 <span className="hidden xs:inline">لوحة التحكم</span>
            </button>
            <button
              onClick={() => router.push('/stock')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              🏷️ <span className="hidden xs:inline">المخزون</span>
            </button>
            <button
              onClick={() => router.push('/finance')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              💰 <span className="hidden xs:inline">المالية</span>
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              📊 <span className="hidden xs:inline">المصروفات</span>
            </button>
            <button
              onClick={() => router.push('/history')}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-blue-600 text-white"
            >
              📜 <span className="hidden xs:inline">السجل</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">سجل المعاملات</h2>
          <p className="text-sm text-gray-600 mt-1">تتبع سجل المبيعات والمصروفات</p>
        </div>
        
        {/* View Mode Tabs - Simple tab strip at the top */}
        <div className="bg-white rounded-lg mb-4 sm:mb-6 p-2 flex items-center justify-center border border-gray-200 gap-1 sm:gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            كل المعاملات
          </button>
          <button
            onClick={() => setViewMode('sales')}
            className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              viewMode === 'sales'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            المبيعات فقط
          </button>
          <button
            onClick={() => setViewMode('expenses')}
            className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              viewMode === 'expenses'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            المصروفات فقط
          </button>
        </div>

        {/* Summary Stats - Horizontally Scrollable on Mobile */}
        <div className="overflow-x-auto pb-2 mb-4 sm:mb-6">
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 min-w-max sm:min-w-0">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">إجمالي المبيعات</h3>
                <span className="text-lg sm:text-xl bg-green-50 text-green-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{filteredSales.length} معاملة</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">إجمالي المصروفات</h3>
                <span className="text-lg sm:text-xl bg-red-50 text-red-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{filteredExpenses.length} مصروف</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">المبلغ الصافي</h3>
                <span className="text-lg sm:text-xl bg-blue-50 text-blue-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold ${
                netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(netAmount)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">الإيرادات - المصروفات</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 min-w-[180px] sm:min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">المعاملات</h3>
                <span className="text-lg sm:text-xl bg-gray-100 text-gray-600 p-1 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {filteredSales.length + filteredExpenses.length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">المبيعات + المصروفات</p>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-hidden">
          <div className="p-3 sm:p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في المعاملات..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Filter Options */}
        <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-hidden">
          {/* Filter Header - Tap to expand */}
          <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="font-medium text-sm sm:text-base">فلاتر متقدمة</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {/* Count how many filters are applied */}
                {(timeFilter !== 'all' ? 1 : 0) + 
                 (startDate ? 1 : 0) + 
                 (endDate ? 1 : 0) + 
                 (paymentMethod !== 'all' ? 1 : 0) + 
                 (minAmount ? 1 : 0) + 
                 (maxAmount ? 1 : 0)}
              </span>
            </div>
            
            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Filter Options - Expandable */}
          {filtersExpanded && (
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Time Period */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">فترة الزمن</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">كل الوقت</option>
                    <option value="today">اليوم</option>
                    <option value="week">الأسبوع الماضي</option>
                    <option value="month">الشهر الماضي</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">تاريخ البدء</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">تاريخ النهاية</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">كل الطرق</option>
                    <option value="cash">النقد</option>
                    <option value="card">البطاقة</option>
                    <option value="mobile">الدفع المباشر</option>
                  </select>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الحد الأدنى للمبلغ</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm pl-6 sm:pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الحد الأقصى للمبلغ</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm pl-6 sm:pl-7"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">ترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="date-desc">التاريخ (الأحدث أولا)</option>
                    <option value="date-asc">التاريخ (الأقدم أولا)</option>
                    <option value="amount-desc">المبلغ (الأعلى أولا)</option>
                    <option value="amount-asc">المبلغ (الأقل أولا)</option>
                  </select>
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm transition flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إعادة تعيين كل الفلاتر
                </button>
              </div>
            </div>
          )}
          
          {/* Results Count */}
          <div className="border-t border-gray-200 p-2 sm:p-3 text-xs sm:text-sm text-gray-600 text-center bg-gray-50">
            إظهار {filteredSales.length + filteredExpenses.length} معاملة
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold">سجل المعاملات</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {viewMode === 'all' && `إظهار ${filteredSales.length + filteredExpenses.length} معاملة`}
              {viewMode === 'sales' && `إظهار ${filteredSales.length} مبيعات`}
              {viewMode === 'expenses' && `إظهار ${filteredExpenses.length} مصروفات`}
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-500">تحميل السجل المالي...</p>
            </div>
          ) : (viewMode === 'all' && filteredSales.length === 0 && filteredExpenses.length === 0) ||
             (viewMode === 'sales' && filteredSales.length === 0) ||
             (viewMode === 'expenses' && filteredExpenses.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">لم يتم العثور على معاملات</p>
              <p className="text-sm mt-2">حاول تعديل الفلاتر!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Sales */}
              {(viewMode === 'all' || viewMode === 'sales') && filteredSales.map((sale) => (
                <div key={sale.id} className="hover:bg-gray-50 transition">
                  <div
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleSaleExpansion(sale.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(sale.created_at)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {sale.sale_items.length} {sale.sale_items.length === 1 ? 'عنصر' : 'عناصر'} • {' '}
                              <span className="capitalize">{sale.payment_method}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(sale.total_amount)}
                          </p>
                        </div>
                        
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedSale === sale.id ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSale === sale.id && (
                    <div className="px-6 pb-4 bg-gray-50">
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">عناصر البيع:</h4>
                        <div className="space-y-2">
                          {sale.sale_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-white p-3 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                <p className="text-sm text-gray-500">
                                  الكمية: {item.quantity} × {formatCurrency(item.price_at_sale)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.quantity * item.price_at_sale)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-700">Total Amount:</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(sale.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Expenses */}
              {(viewMode === 'all' || viewMode === 'expenses') && filteredExpenses.map((expense) => (
                <div key={`expense-${expense.id}`} className="hover:bg-red-50 transition">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {expense.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(expense.created_at)} • {' '}
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {expense.category || 'Uncategorized'}
                              </span>
                              {' '} • {' '}
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                expense.expense_type === 'one_time'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {expense.expense_type === 'one_time' ? 'One-Time' : 'Recurring'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Expense</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default withSuspensionCheck(History)
