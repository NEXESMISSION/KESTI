import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, CreditSale, Profile } from '@/lib/supabase'
import { useLoading } from '@/contexts/LoadingContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import { getSubscriptionDaysLeft } from '@/lib/auth'
import * as XLSX from 'xlsx'

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
  const { showLoading, hideLoading } = useLoading()
  const [sales, setSales] = useState<Sale[]>([])
  const [creditSales, setCreditSales] = useState<CreditSaleWithItems[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'sales' | 'expenses' | 'credits'>('all')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string, period: string} | null>(null)
  
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
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      await Promise.all([
        fetchSales(session.user.id),
        fetchCreditSales(session.user.id),
        fetchExpenses(session.user.id)
      ])
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
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

      // Create workbook
      const wb = XLSX.utils.book_new()

      // === معلومات الحساب ===
      const accountData = [
        ['معلومات الحساب'],
        [''],
        ['اسم العمل', profile?.full_name || 'غير متوفر'],
        ['البريد الإلكتروني', profile?.email || 'غير متوفر'],
        ['تاريخ انتهاء الاشتراك', profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString('ar-TN') : 'غير متوفر'],
        ['تاريخ إنشاء الحساب', profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-TN') : 'غير متوفر'],
      ]

      // === سجل المبيعات ===
      const salesData = [
        [''],
        ['سجل المبيعات'],
        [''],
        ['التاريخ', 'الوقت', 'المبلغ الإجمالي', 'طريقة الدفع']
      ]
      
      filteredSales.forEach(sale => {
        const date = new Date(sale.created_at)
        salesData.push([
          date.toLocaleDateString('ar-TN'),
          date.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' }),
          sale.total_amount + ' د.ت',
          sale.payment_method === 'cash' ? 'نقدي' : sale.payment_method === 'card' ? 'بطاقة' : 'آجل'
        ])
      })
      salesData.push([''])
      salesData.push(['إجمالي الإيرادات', '', totalRevenue.toFixed(2) + ' د.ت', ''])

      // === سجل المصروفات ===
      const expensesData = [
        [''],
        ['سجل المصروفات'],
        [''],
        ['التاريخ', 'الوقت', 'الوصف', 'الفئة', 'المبلغ']
      ]
      
      filteredExpenses.forEach(expense => {
        const date = new Date(expense.created_at)
        expensesData.push([
          date.toLocaleDateString('ar-TN'),
          date.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' }),
          expense.description,
          expense.category || 'غير محدد',
          expense.amount + ' د.ت'
        ])
      })
      expensesData.push([''])
      expensesData.push(['إجمالي المصروفات', '', '', '', totalExpenses.toFixed(2) + ' د.ت'])

      // === الملخص المالي ===
      const summaryData = [
        [''],
        ['الملخص المالي'],
        [''],
        ['عدد المبيعات', filteredSales.length],
        ['إجمالي الإيرادات', totalRevenue.toFixed(2) + ' د.ت'],
        ['إجمالي المصروفات', totalExpenses.toFixed(2) + ' د.ت'],
        ['صافي الربح', netAmount.toFixed(2) + ' د.ت'],
      ]

      // Combine all data
      const allData = [...accountData, ...salesData, ...expensesData, ...summaryData]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(allData)

      // Set column widths
      ws['!cols'] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
      ]

      // Style header rows (RTL support)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) continue
          
          // Style headers
          if (R === 0 || R === 7 || R === 7 + salesData.length || R === 7 + salesData.length + expensesData.length) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 14 },
              alignment: { horizontal: 'right', vertical: 'center' },
              fill: { fgColor: { rgb: 'D3D3D3' } }
            }
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'تقرير KESTI')

      // Generate file and download
      XLSX.writeFile(wb, `KESTI_تقرير_${new Date().toISOString().split('T')[0]}.xlsx`, {
        bookType: 'xlsx',
        type: 'binary'
      })
    } catch (error) {
      console.error('Error downloading data:', error)
      alert('فشل تحميل البيانات')
    }
  }

  const paymentInfo = {
    rib: '24031168005251110132',
    bankName: 'BTE Bank',
    d17: '58415520',
    flouci: '58415520',
    phone: '+21653518337',
    email: 'support@kestipro.com',
    whatsapp: '21653518337',
    instagram: 'https://www.instagram.com/kesti_tn',
    d17Logo: 'https://play-lh.googleusercontent.com/lOgvUGpz6YUSXJG48kbzGrTEohIC8FDr_WkP6rwgaELR0g5o6OQu5-VPGexKoB8F0C-_',
    flouciLogo: 'https://play-lh.googleusercontent.com/CK9-8mnJO0rlqQf8-D44yX_J1iEXqZ7RqpXJnTkIlrpqBgiBIT5TQXtORU55vDG-vXU'
  }

  const openPaymentModal = (planName: string, price: string, period: string) => {
    setSelectedPlan({ name: planName, price, period })
    setShowPaymentModal(true)
    // Scroll to payment methods after a short delay
    setTimeout(() => {
      const paymentSection = document.getElementById('payment-methods')
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
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
              {/* Subscription Days Left (Business Admin Only) */}
              {profile && profile.role === 'business_user' && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition flex items-center gap-2"
                  title="الاشتراك"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {getSubscriptionDaysLeft(profile)} يوم متبقي
                  </span>
                </button>
              )}
              
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
        {/* Show loading spinner until data is loaded */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">جاري تحميل السجل...</p>
            </div>
          </div>
        ) : (
          <>
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
          
          {(viewMode === 'all' && filteredSales.length === 0 && creditSales.length === 0 && filteredExpenses.length === 0) ||
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
          </>
        )}
      </main>

      {/* Subscription Modal */}
      {showSubscriptionModal && profile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubscriptionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()} dir="rtl">
            <button 
              onClick={() => setShowSubscriptionModal(false)} 
              className="absolute top-3 left-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">معلومات الاشتراك</h3>
              <div className="text-5xl font-black my-4">{getSubscriptionDaysLeft(profile)}</div>
              <p className="text-indigo-100 text-lg">يوم متبقي في اشتراكك</p>
              {profile.subscription_ends_at && (
                <p className="text-indigo-200 text-sm mt-2">
                  ينتهي في: {new Date(profile.subscription_ends_at).toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            
            <div className="p-6">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false)
                  setShowPaymentModal(true)
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition"
              >
                تجديد الاشتراك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Pricing Plans */}
            <div className="p-6">
              <h2 className="text-3xl font-bold text-center mb-2">اختر خطتك</h2>
              <p className="text-center text-gray-600 mb-6">جميع الباقات تشمل كل المميزات</p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Monthly */}
                <div className={`bg-white border-2 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer ${selectedPlan?.name === 'شهري' ? 'border-indigo-600 shadow-lg' : 'border-gray-200'}`} onClick={() => openPaymentModal('شهري', '19', 'شهر')}>
                  <h3 className="text-xl font-bold mb-1">شهري</h3>
                  <p className="text-gray-500 text-sm mb-4">مرونة كاملة</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">19</span>
                    <span className="text-gray-500 mr-1">د.ت/شهر</span>
                  </div>
                  <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                    اشترك الآن
                  </button>
                </div>

                {/* 3 Months - Popular */}
                <div className={`bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 relative hover:scale-105 transition shadow-xl ${selectedPlan?.name === '3 أشهر' ? 'ring-4 ring-indigo-400' : ''}`} onClick={() => openPaymentModal('3 أشهر', '51', '3 أشهر')}>
                  <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs px-4 py-1 rounded-full font-bold">الأكثر طلبا</div>
                  <h3 className="text-xl font-bold mb-1">3 أشهر</h3>
                  <p className="text-gray-400 text-sm mb-4">وفر 10%</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">17</span>
                    <span className="text-gray-400 mr-1">د.ت/شهر</span>
                    <p className="text-sm text-gray-400 mt-1">51 د.ت اجمالي</p>
                  </div>
                  <button className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-100 transition">
                    اشترك الآن
                  </button>
                </div>

                {/* Yearly */}
                <div className={`bg-white border-2 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer ${selectedPlan?.name === 'سنوي' ? 'border-indigo-600 shadow-lg' : 'border-gray-200'}`} onClick={() => openPaymentModal('سنوي', '180', 'سنة')}>
                  <h3 className="text-xl font-bold mb-1">سنوي</h3>
                  <p className="text-gray-500 text-sm mb-4">وفر 21%</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">15</span>
                    <span className="text-gray-500 mr-1">د.ت/شهر</span>
                    <p className="text-sm text-gray-500 mt-1">180 د.ت اجمالي</p>
                  </div>
                  <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                    اشترك الآن
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              {selectedPlan && (
                <div className="border-t pt-6" id="payment-methods">
                  <h3 className="text-xl font-bold text-center mb-4">طرق الدفع</h3>
                  <div className="bg-gray-900 text-white p-4 rounded-xl mb-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">باقة {selectedPlan.name}</p>
                    <div className="text-3xl font-bold">{selectedPlan.price} <span className="text-lg">د.ت</span></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <img src={paymentInfo.d17Logo} alt="D17" className="w-10 h-10 rounded-lg" />
                      <span className="font-medium flex-1">D17</span>
                      <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.d17}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <img src={paymentInfo.flouciLogo} alt="Flouci" className="w-10 h-10 rounded-lg" />
                      <span className="font-medium flex-1">Flouci</span>
                      <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.flouci}</span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <span className="font-medium">{paymentInfo.bankName}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="font-mono text-sm text-center">{paymentInfo.rib}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-center mb-3">بعد الدفع، أرسل صورة الوصل مع إيميل حسابك:</p>
                      <div className="flex gap-3 justify-center">
                        <a href={`https://wa.me/${paymentInfo.whatsapp}?text=اشتراك%20باقة%20${selectedPlan.name}%20بمبلغ%20${selectedPlan.price}%20دينار`} target="_blank" className="flex items-center gap-2 bg-[#25D366] text-white py-2.5 px-4 rounded-lg font-medium">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          واتساب
                        </a>
                        <a href={paymentInfo.instagram} target="_blank" className="flex items-center gap-2 bg-gray-900 text-white py-2.5 px-4 rounded-lg font-medium">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          انستغرام
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withSuspensionCheck(History)
