import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, CreditSale } from '@/lib/supabase'
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

interface CreditSaleItem {
  id: string
  product_name: string
  quantity: number
  price_at_sale: number
}

interface CreditSaleWithItems extends CreditSale {
  credit_sale_items: CreditSaleItem[]
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
  const [creditSales, setCreditSales] = useState<CreditSaleWithItems[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'sales' | 'expenses' | 'credits'>('all')
  
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
    document.title = 'KESTI - السجل'
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
        fetchCreditSales(session.user.id),
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

  const fetchCreditSales = async (ownerId: string) => {
    try {
      let query = supabase
        .from('credit_sales')
        .select(`
          *,
          customer:customer_id (id, name, phone),
          credit_sale_items (
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

      setCreditSales(data || [])
    } catch (err: any) {
      console.error('Error fetching credit sales:', err)
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

  const downloadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Get all products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', session.user.id)

      // Prepare CSV content
      let csvContent = "data:text/csv;charset=utf-8,"
      
      // Account Info Section
      csvContent += "=== ACCOUNT INFORMATION ===\n"
      csvContent += `Business Name,${profile?.full_name || 'N/A'}\n`
      csvContent += `Email,${profile?.email || 'N/A'}\n`
      csvContent += `Subscription Ends,${profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString() : 'N/A'}\n`
      csvContent += `Account Created,${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}\n`
      csvContent += "\n"

      // Sales Section
      csvContent += "=== SALES HISTORY ===\n"
      csvContent += "Date,Time,Total Amount,Payment Method,Items,Quantities\n"
      filteredSales.forEach(sale => {
        const date = new Date(sale.created_at)
        const items = sale.sale_items.map(item => item.product_name).join('; ')
        const quantities = sale.sale_items.map(item => `${item.quantity}`).join('; ')
        csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${sale.total_amount},${sale.payment_method},"${items}","${quantities}"\n`
      })
      csvContent += `\nTotal Revenue,${totalRevenue}\n`
      csvContent += "\n"

      // Expenses Section
      csvContent += "=== EXPENSES HISTORY ===\n"
      csvContent += "Date,Time,Description,Category,Amount,Type\n"
      filteredExpenses.forEach(expense => {
        const date = new Date(expense.created_at)
        csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},"${expense.description}",${expense.category || 'N/A'},${expense.amount},${expense.expense_type}\n`
      })
      csvContent += `\nTotal Expenses,${totalExpenses}\n`
      csvContent += "\n"

      // Products Section
      csvContent += "=== PRODUCTS ===\n"
      csvContent += "Name,Selling Price,Cost Price,Unit Type,Stock Quantity\n"
      products?.forEach(product => {
        csvContent += `"${product.name}",${product.selling_price},${product.cost_price},${product.unit_type},${product.stock_quantity || 'N/A'}\n`
      })
      csvContent += "\n"

      // Summary Section
      csvContent += "=== FINANCIAL SUMMARY ===\n"
      csvContent += `Total Sales,${filteredSales.length}\n`
      csvContent += `Total Revenue,${totalRevenue.toFixed(2)}\n`
      csvContent += `Total Expenses,${totalExpenses.toFixed(2)}\n`
      csvContent += `Net Profit,${netAmount.toFixed(2)}\n`
      csvContent += `Total Products,${products?.length || 0}\n`

      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `KESTI_Data_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading data:', error)
      alert('Failed to download data')
    }
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
              {/* Download Data */}
              <button
                onClick={downloadData}
                className="bg-green-600 hover:bg-green-700 text-white p-2 sm:p-2.5 rounded-lg transition flex items-center gap-1 sm:gap-2"
                title="Download All Data"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline text-sm">Download</span>
              </button>
              
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
            <button onClick={() => window.location.href = '/expenses'} className="py-2 rounded-lg text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📊</span>
                <span className="text-[10px] sm:text-xs">المصروفات</span>
              </div>
            </button>
            <button onClick={() => window.location.href = '/history'} className="py-2 rounded-lg text-center bg-indigo-600 text-white">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📜</span>
                <span className="text-[10px] sm:text-xs">السجل</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">💵</p>
            <p className="text-lg sm:text-xl font-black text-green-600">{totalRevenue.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">الإيرادات</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">💸</p>
            <p className="text-lg sm:text-xl font-black text-red-600">{totalExpenses.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">المصروفات</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">📊</p>
            <p className={`text-lg sm:text-xl font-black ${netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{netAmount.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">الصافي</p>
          </div>
        </div>
        
        {/* View Mode Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'الكل', color: 'indigo' },
            { key: 'sales', label: 'مبيعات', color: 'green' },
            { key: 'credits', label: 'ديون', color: 'orange' },
            { key: 'expenses', label: 'مصروفات', color: 'red' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                viewMode === v.key
                  ? v.color === 'indigo' ? 'bg-indigo-600 text-white' 
                    : v.color === 'green' ? 'bg-green-600 text-white'
                    : v.color === 'orange' ? 'bg-orange-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Time Filter Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'كل الوقت' },
            { key: 'today', label: 'اليوم' },
            { key: 'week', label: 'أسبوع' },
            { key: 'month', label: 'شهر' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                timeFilter === f.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          
          {/* Download Button */}
          <button
            onClick={downloadData}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 بحث..."
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">✕</button>
          )}
        </div>

        {/* Results Count */}
        <p className="text-xs text-gray-500 mb-3">
          إظهار {viewMode === 'all' ? filteredSales.length + creditSales.length + filteredExpenses.length : viewMode === 'sales' ? filteredSales.length : viewMode === 'credits' ? creditSales.length : filteredExpenses.length} معاملة
        </p>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold">سجل المعاملات</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {viewMode === 'all' && `إظهار ${filteredSales.length + creditSales.length + filteredExpenses.length} معاملة`}
              {viewMode === 'sales' && `إظهار ${filteredSales.length} مبيعات`}
              {viewMode === 'credits' && `إظهار ${creditSales.length} ديون`}
              {viewMode === 'expenses' && `إظهار ${filteredExpenses.length} مصروفات`}
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-500">تحميل السجل المالي...</p>
            </div>
          ) : (viewMode === 'all' && filteredSales.length === 0 && creditSales.length === 0 && filteredExpenses.length === 0) ||
             (viewMode === 'sales' && filteredSales.length === 0) ||
             (viewMode === 'credits' && creditSales.length === 0) ||
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
              
              {/* Credit Sales */}
              {(viewMode === 'all' || viewMode === 'credits') && creditSales.map((credit) => (
                <div key={`credit-${credit.id}`} className="hover:bg-orange-50 transition">
                  <div
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleSaleExpansion(`credit-${credit.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="font-semibold text-gray-900">{credit.customer?.name || 'عميل'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(credit.created_at).toLocaleDateString('ar-TN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left mr-4">
                        <p className="text-lg font-bold text-orange-600">{credit.total_amount.toFixed(2)} دينار</p>
                        {credit.is_paid ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mt-1">
                            ✓ مدفوع
                          </span>
                        ) : (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full mt-1">
                            متبقي: {credit.remaining_amount.toFixed(2)} د
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Items */}
                  {expandedSale === `credit-${credit.id}` && credit.credit_sale_items && (
                    <div className="px-6 pb-4 bg-orange-50/30">
                      <div className="border-t border-orange-200 pt-3">
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">المنتجات:</h4>
                        <div className="space-y-2">
                          {credit.credit_sale_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm bg-white p-2 rounded">
                              <span className="text-gray-700">{item.product_name}</span>
                              <div className="text-left">
                                <span className="text-gray-600 mr-2">x{item.quantity}</span>
                                <span className="font-semibold text-gray-900">{(item.price_at_sale * item.quantity).toFixed(2)} د</span>
                              </div>
                            </div>
                          ))}
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
