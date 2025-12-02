import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import AutoClearWarning from '@/components/AutoClearWarning'
import AdminAlert from '@/components/AdminAlert'

interface SaleItem {
  quantity: number
  price_at_sale: number
  cost_price_at_sale: number
  created_at: string
}

interface Expense {
  id: string
  amount: number
  description: string
  category: string | null
  expense_type: 'one_time' | 'recurring'
  created_at: string
}

interface FinancialMetrics {
  totalRevenue: number
  totalCosts: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  totalSales: number
  todayRevenue: number
  todayCosts: number
  todayExpenses: number
  todayNetProfit: number
  weekRevenue: number
  weekCosts: number
  weekExpenses: number
  weekNetProfit: number
  monthRevenue: number
  monthCosts: number
  monthExpenses: number
  monthNetProfit: number
}

function Finance() {
  const router = useRouter()
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalCosts: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    todayRevenue: 0,
    todayCosts: 0,
    todayExpenses: 0,
    todayNetProfit: 0,
    weekRevenue: 0,
    weekCosts: 0,
    weekExpenses: 0,
    weekNetProfit: 0,
    monthRevenue: 0,
    monthCosts: 0,
    monthExpenses: 0,
    monthNetProfit: 0,
  })
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [chartFilter, setChartFilter] = useState<'week' | 'year' | 'custom'>('week')
  const [chartStartDate, setChartStartDate] = useState('')
  const [chartEndDate, setChartEndDate] = useState('')

  useEffect(() => {
    checkAuthAndFetch()
    triggerAutoClearCheck()
    document.title = 'KESTI - المالية'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, startDate, endDate])

  const triggerAutoClearCheck = async () => {
    try {
      // Trigger the auto-clear check in background
      await fetch('/api/check-and-auto-clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Auto-clear check failed:', error)
    }
  }

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
      
      await Promise.all([
        fetchSaleItems(session.user.id),
        fetchExpenses(session.user.id)
      ])
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    }
  }

  const fetchSaleItems = async (ownerId: string) => {
    setLoading(true)
    try {
      // Get ALL sales for this owner (no filters - we filter in calculateMetrics)
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('owner_id', ownerId)

      if (salesError) throw salesError

      // If no sales, set empty array
      if (!sales || sales.length === 0) {
        setSaleItems([])
        setLoading(false)
        return
      }

      // Get sale IDs
      const saleIds = sales.map(sale => sale.id)

      // Get ALL sale items for these sales
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          price_at_sale,
          cost_price_at_sale,
          created_at
        `)
        .in('sale_id', saleIds)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      setSaleItems(items || [])
    } catch (err: any) {
      console.error('Error fetching sale items:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async (ownerId: string) => {
    try {
      // Get ALL expenses for this owner (no filters - we filter in calculateMetrics)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setExpenses(data || [])
    } catch (err: any) {
      console.error('Error fetching expenses:', err)
    }
  }

  const calculateMetrics = (allItems: SaleItem[], allExpenses: Expense[]) => {
    const now = new Date()
    
    // Apply user's selected filters for main metrics
    let filteredItems = allItems
    let filteredExpenses = allExpenses

    if (timeFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filteredItems = allItems.filter(item => new Date(item.created_at) >= today)
      filteredExpenses = allExpenses.filter(exp => new Date(exp.created_at) >= today)
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredItems = allItems.filter(item => new Date(item.created_at) >= weekAgo)
      filteredExpenses = allExpenses.filter(exp => new Date(exp.created_at) >= weekAgo)
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      filteredItems = allItems.filter(item => new Date(item.created_at) >= monthAgo)
      filteredExpenses = allExpenses.filter(exp => new Date(exp.created_at) >= monthAgo)
    }

    // Apply custom date range
    if (startDate) {
      const start = new Date(startDate)
      filteredItems = filteredItems.filter(item => new Date(item.created_at) >= start)
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.created_at) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filteredItems = filteredItems.filter(item => new Date(item.created_at) <= end)
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.created_at) <= end)
    }
    
    // Calculate totals for FILTERED period (respects user's filter selection)
    const totalRevenue = filteredItems.reduce((sum, item) => 
      sum + (item.price_at_sale * item.quantity), 0)
    const totalCosts = filteredItems.reduce((sum, item) => 
      sum + (item.cost_price_at_sale * item.quantity), 0)
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const grossProfit = totalRevenue - totalCosts
    const netProfit = grossProfit - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Calculate today's metrics (ALWAYS from all data, ignoring filters)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayItems = allItems.filter(item => new Date(item.created_at) >= today)
    const todayExpensesList = allExpenses.filter(exp => new Date(exp.created_at) >= today)
    
    const todayRevenue = todayItems.reduce((sum, item) => 
      sum + (item.price_at_sale * item.quantity), 0)
    const todayCosts = todayItems.reduce((sum, item) => 
      sum + (item.cost_price_at_sale * item.quantity), 0)
    const todayExpenses = todayExpensesList.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const todayNetProfit = (todayRevenue - todayCosts) - todayExpenses

    // Calculate week metrics (ALWAYS from all data, ignoring filters)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekItems = allItems.filter(item => new Date(item.created_at) >= weekAgo)
    const weekExpensesList = allExpenses.filter(exp => new Date(exp.created_at) >= weekAgo)
    
    const weekRevenue = weekItems.reduce((sum, item) => 
      sum + (item.price_at_sale * item.quantity), 0)
    const weekCosts = weekItems.reduce((sum, item) => 
      sum + (item.cost_price_at_sale * item.quantity), 0)
    const weekExpenses = weekExpensesList.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const weekNetProfit = (weekRevenue - weekCosts) - weekExpenses

    // Calculate month metrics (ALWAYS from all data, ignoring filters)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const monthItems = allItems.filter(item => new Date(item.created_at) >= monthAgo)
    const monthExpensesList = allExpenses.filter(exp => new Date(exp.created_at) >= monthAgo)
    
    const monthRevenue = monthItems.reduce((sum, item) => 
      sum + (item.price_at_sale * item.quantity), 0)
    const monthCosts = monthItems.reduce((sum, item) => 
      sum + (item.cost_price_at_sale * item.quantity), 0)
    const monthExpenses = monthExpensesList.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const monthNetProfit = (monthRevenue - monthCosts) - monthExpenses

    setMetrics({
      totalRevenue,
      totalCosts,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      totalSales: filteredItems.length,
      todayRevenue,
      todayCosts,
      todayExpenses,
      todayNetProfit,
      weekRevenue,
      weekCosts,
      weekExpenses,
      weekNetProfit,
      monthRevenue,
      monthCosts,
      monthExpenses,
      monthNetProfit,
    })
  }

  useEffect(() => {
    if (saleItems.length >= 0 && expenses.length >= 0) {
      calculateMetrics(saleItems, expenses)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleItems, expenses, timeFilter, startDate, endDate])

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} دينار`
  }

  // Calculate chart data based on selected filter
  const getChartData = () => {
    const now = new Date()
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    
    if (chartFilter === 'week') {
      // Last 7 days - one bar per day
      const data = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
        
        const dayRevenue = saleItems
          .filter(item => {
            const itemDate = new Date(item.created_at)
            return itemDate >= dayStart && itemDate <= dayEnd
          })
          .reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0)
        
        data.push({
          label: dayNames[date.getDay()],
          value: dayRevenue,
          date: date.toLocaleDateString('ar-TN', { day: 'numeric', month: 'short' })
        })
      }
      return data
    } else if (chartFilter === 'year') {
      // Last 12 months - one bar per month
      const data = []
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        
        const monthRevenue = saleItems
          .filter(item => {
            const itemDate = new Date(item.created_at)
            return itemDate >= monthDate && itemDate <= monthEnd
          })
          .reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0)
        
        data.push({
          label: monthNames[monthDate.getMonth()].substring(0, 3),
          value: monthRevenue,
          date: monthNames[monthDate.getMonth()]
        })
      }
      return data
    } else {
      // Custom date range
      if (!chartStartDate || !chartEndDate) {
        return [{ label: 'اختر التواريخ', value: 0, date: '' }]
      }
      
      const start = new Date(chartStartDate)
      const end = new Date(chartEndDate)
      end.setHours(23, 59, 59, 999)
      
      // Calculate number of days between dates
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      const data = []
      
      if (diffDays <= 14) {
        // Show daily if 14 days or less
        for (let i = 0; i < diffDays; i++) {
          const date = new Date(start)
          date.setDate(date.getDate() + i)
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          
          const dayRevenue = saleItems
            .filter(item => {
              const itemDate = new Date(item.created_at)
              return itemDate >= dayStart && itemDate <= dayEnd
            })
            .reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0)
          
          data.push({
            label: `${date.getDate()}/${date.getMonth() + 1}`,
            value: dayRevenue,
            date: date.toLocaleDateString('ar-TN', { day: 'numeric', month: 'short' })
          })
        }
      } else {
        // Show weekly for longer periods
        const numWeeks = Math.ceil(diffDays / 7)
        for (let i = 0; i < Math.min(numWeeks, 12); i++) {
          const weekStart = new Date(start)
          weekStart.setDate(weekStart.getDate() + (i * 7))
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          if (weekEnd > end) weekEnd.setTime(end.getTime())
          
          const weekRevenue = saleItems
            .filter(item => {
              const itemDate = new Date(item.created_at)
              return itemDate >= weekStart && itemDate <= weekEnd
            })
            .reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0)
          
          data.push({
            label: `أسبوع ${i + 1}`,
            value: weekRevenue,
            date: `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
          })
        }
      }
      
      return data.length > 0 ? data : [{ label: 'لا بيانات', value: 0, date: '' }]
    }
  }

  const chartData = getChartData()
  const maxValue = Math.max(...chartData.map(d => d.value), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Alert (shows once when super-admin sends a message) */}
      <AdminAlert userId={userId} />
      
      {/* Auto-Clear Warning Alert */}
      <AutoClearWarning />
      
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to POS */}
              <button
                onClick={() => window.location.href = '/pos'}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="العودة إلى نقطة البيع"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-2 py-3">
            <button
              onClick={() => window.location.href = '/products'}
              className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المنتجات والمخزون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📦</span>
                <span className="text-[10px] sm:text-xs">المنتجات</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/finance'}
              className="py-2 rounded-lg text-center bg-blue-600 text-white"
              title="المالية"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💰</span>
                <span className="text-[10px] sm:text-xs">المالية</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/credits'}
              className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="الديون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💳</span>
                <span className="text-[10px] sm:text-xs">الديون</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/expenses'}
              className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="المصروفات"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/history'}
              className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
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
        {/* Page Title */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">لوحة المالية</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">عرض وتحليل الأداء المالي لنشاطك التجاري</p>
        </div>

        {/* Collapsible Filter Options */}
        <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">
          {/* Filter Header - Tap to expand */}
          <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="font-medium text-sm sm:text-base">الفلاتر والفترة الزمنية</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {timeFilter !== 'all' ? '1' : '0'}
              </span>
            </div>
            
            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Filter Options - Expandable */}
          {filtersExpanded && (
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Time Period Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الفترة الزمنية</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">كل الوقت</option>
                    <option value="today">اليوم</option>
                    <option value="week">آخر 7 أيام</option>
                    <option value="month">آخر 30 يوم</option>
                    <option value="custom">فترة مخصصة</option>
                  </select>
                </div>

                {/* Date Range - Hidden for all/today/week/month */}
                {timeFilter === 'custom' && (
                  <>
                    {/* Start Date */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">تاريخ البداية</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">تاريخ النهاية</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </>
                )}
                
                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTimeFilter('all')
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    إعادة تعيين الفلاتر
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Profit Card - Clean & Simple */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
            <div className="text-center">
              <p className="text-sm sm:text-base opacity-90 mb-2">💰 صافي الربح</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">{formatCurrency(metrics.netProfit)}</p>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <span className="text-xs sm:text-sm">من {metrics.totalSales} عملية بيع</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats - Simple 3 Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">الإيرادات</p>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl mb-2">💸</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalCosts + metrics.totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">المصروفات</p>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl mb-2">📈</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.profitMargin.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-1">هامش الربح</p>
          </div>
        </div>

        {/* Revenue Statistics Chart - Mobile Optimized */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          {/* Header - Compact on Mobile */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">إحصائيات الإيرادات</h3>
                  <p className="text-xs sm:text-sm text-blue-100">تتبع المبيعات</p>
                </div>
              </div>
            </div>
            
            {/* Filter Tabs - Full Width on Mobile */}
            <div className="mt-4 grid grid-cols-3 gap-2 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setChartFilter('week')}
                className={`py-2.5 px-2 rounded-lg text-sm font-bold transition-all ${
                  chartFilter === 'week'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                أسبوع
              </button>
              <button
                onClick={() => setChartFilter('year')}
                className={`py-2.5 px-2 rounded-lg text-sm font-bold transition-all ${
                  chartFilter === 'year'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                سنة
              </button>
              <button
                onClick={() => setChartFilter('custom')}
                className={`py-2.5 px-2 rounded-lg text-sm font-bold transition-all ${
                  chartFilter === 'custom'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                مخصص
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {chartFilter === 'custom' && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">من</label>
                  <input
                    type="date"
                    value={chartStartDate}
                    onChange={(e) => setChartStartDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">إلى</label>
                  <input
                    type="date"
                    value={chartEndDate}
                    onChange={(e) => setChartEndDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              {chartStartDate && chartEndDate && (
                <button
                  onClick={() => { setChartStartDate(''); setChartEndDate(''); }}
                  className="mt-2 w-full py-2 bg-gray-200 rounded-lg text-sm font-medium"
                >
                  مسح التواريخ
                </button>
              )}
            </div>
          )}

          {/* Stats Summary - Above Chart on Mobile */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 bg-gray-50 border-b">
            <div className="p-3 text-center">
              <p className="text-[10px] text-gray-500 font-medium">الإجمالي</p>
              <p className="text-sm sm:text-lg font-black text-blue-600">
                {chartData.reduce((sum, d) => sum + d.value, 0) >= 1000 
                  ? `${(chartData.reduce((sum, d) => sum + d.value, 0)/1000).toFixed(1)}k`
                  : chartData.reduce((sum, d) => sum + d.value, 0).toFixed(0)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-gray-500 font-medium">المتوسط</p>
              <p className="text-sm sm:text-lg font-black text-green-600">
                {(chartData.reduce((sum, d) => sum + d.value, 0) / Math.max(chartData.length, 1)).toFixed(0)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-gray-500 font-medium">الأعلى</p>
              <p className="text-sm sm:text-lg font-black text-purple-600">
                {Math.max(...chartData.map(d => d.value), 0).toFixed(0)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-gray-500 font-medium">الأدنى</p>
              <p className="text-sm sm:text-lg font-black text-orange-600">
                {Math.min(...chartData.map(d => d.value)).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Chart Area - Optimized for Mobile */}
          <div className="p-3 sm:p-5">
            <div className="h-52 sm:h-64 flex items-end gap-1 sm:gap-2">
              {chartData.map((item, index) => {
                const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                const barColor = chartFilter === 'week' 
                  ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                  : chartFilter === 'year'
                  ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                  : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full">
                    {/* Value Label - Always visible on mobile */}
                    <div className="mb-1 text-center">
                      <span className={`text-[9px] sm:text-xs font-bold ${
                        chartFilter === 'week' ? 'text-blue-600' :
                        chartFilter === 'year' ? 'text-purple-600' : 'text-emerald-600'
                      }`}>
                        {item.value >= 1000 ? `${(item.value/1000).toFixed(1)}k` : item.value > 0 ? item.value.toFixed(0) : ''}
                      </span>
                    </div>
                    
                    {/* Bar Container */}
                    <div className="flex-1 w-full flex items-end justify-center">
                      <div
                        className={`w-full max-w-8 sm:max-w-12 rounded-t-lg transition-all duration-500 ${barColor} ${
                          item.value === 0 ? 'bg-gray-200' : ''
                        }`}
                        style={{
                          height: `${Math.max(heightPercent, item.value > 0 ? 5 : 2)}%`,
                          minHeight: item.value > 0 ? '8px' : '2px'
                        }}
                      />
                    </div>
                    
                    {/* X-Axis Label */}
                    <div className="mt-2 h-8 flex items-center justify-center">
                      <span className="text-[9px] sm:text-xs text-gray-500 font-medium text-center leading-tight">
                        {item.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Total Summary Bar */}
          <div className={`p-4 text-center ${
            chartFilter === 'week' ? 'bg-blue-50' :
            chartFilter === 'year' ? 'bg-purple-50' : 'bg-emerald-50'
          }`}>
            <span className="text-sm text-gray-600">إجمالي الفترة: </span>
            <span className={`text-lg font-black ${
              chartFilter === 'week' ? 'text-blue-700' :
              chartFilter === 'year' ? 'text-purple-700' : 'text-emerald-700'
            }`}>
              {chartData.reduce((sum, d) => sum + d.value, 0).toFixed(2)} دينار
            </span>
          </div>
        </div>

        {/* Credit Sales Summary - Info Only (Not included in calculations) */}
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="font-medium text-gray-700">البيع بالأجل (الديون)</h3>
                <p className="text-xs text-gray-500">هذه المبالغ غير محسوبة في الأرباح أعلاه</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/credits')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              عرض التفاصيل
            </button>
          </div>
        </div>

        {/* Time Period Comparison - Simple */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 مقارنة الفترات</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">اليوم</span>
              <span className={`text-lg font-bold ${metrics.todayNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.todayNetProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">آخر 7 أيام</span>
              <span className={`text-lg font-bold ${metrics.weekNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.weekNetProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">آخر 30 يوم</span>
              <span className={`text-lg font-bold ${metrics.monthNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.monthNetProfit)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withSuspensionCheck(Finance)
