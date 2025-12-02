import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, CreditSale, CreditCustomer } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'
import AutoClearWarning from '@/components/AutoClearWarning'

function Credits() {
  const router = useRouter()
  const [creditSales, setCreditSales] = useState<CreditSale[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'unpaid' | 'paid' | 'today' | 'week' | 'month'>('unpaid')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customers, setCustomers] = useState<CreditCustomer[]>([])
  const [paymentModal, setPaymentModal] = useState<{ show: boolean, saleId: string, amount: number }>({ show: false, saleId: '', amount: 0 })
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    checkAuthAndFetch()
    document.title = 'KESTI - الديون'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, startDate, endDate, selectedCustomerId])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      await Promise.all([
        fetchCreditSales(session.user.id),
        fetchCustomers(session.user.id)
      ])
    } catch (err) {
      console.error('Error:', err)
      router.push('/login')
    }
  }

  const fetchCustomers = async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_customers')
        .select('id, owner_id, name, phone, created_at')
        .eq('owner_id', ownerId)
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (err: any) {
      console.error('Error fetching customers:', err)
    }
  }

  const fetchCreditSales = async (ownerId: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('credit_sales')
        .select(`
          id,
          owner_id,
          customer_id,
          total_amount,
          paid_amount,
          remaining_amount,
          is_paid,
          created_at,
          paid_at,
          customer:customer_id (id, owner_id, name, phone, created_at)
        `)
        .eq('owner_id', ownerId)

      // Apply filters
      if (timeFilter === 'unpaid') {
        query = query.eq('is_paid', false)
      } else if (timeFilter === 'paid') {
        query = query.eq('is_paid', true)
      } else if (timeFilter === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('created_at', today.toISOString())
      } else if (timeFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (timeFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('created_at', monthAgo.toISOString())
      }

      // Custom date range
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }

      // Filter by customer
      if (selectedCustomerId) {
        query = query.eq('customer_id', selectedCustomerId)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setCreditSales((data as unknown as CreditSale[]) || [])
    } catch (err: any) {
      console.error('Error fetching credit sales:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (saleId: string, fullPayment: boolean = false) => {
    try {
      const sale = creditSales.find(s => s.id === saleId)
      if (!sale) return

      let newPaidAmount = sale.paid_amount
      let newRemainingAmount = sale.remaining_amount

      if (fullPayment) {
        newPaidAmount = sale.total_amount
        newRemainingAmount = 0
      } else {
        const payment = parseFloat(paymentAmount)
        if (isNaN(payment) || payment <= 0) {
          alert('يرجى إدخال مبلغ صحيح')
          return
        }
        if (payment > sale.remaining_amount) {
          alert('المبلغ المدخل أكبر من المبلغ المتبقي')
          return
        }
        newPaidAmount = sale.paid_amount + payment
        newRemainingAmount = sale.remaining_amount - payment
      }

      const isPaid = newRemainingAmount === 0

      // Update credit sale payment status
      const { error } = await supabase
        .from('credit_sales')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null
        })
        .eq('id', saleId)

      if (error) throw error

      // If fully paid, add to regular sales for finance tracking
      if (isPaid) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Create a regular sale record
          const { data: regularSale, error: saleError } = await supabase
            .from('sales')
            .insert([{
              owner_id: session.user.id,
              total_amount: sale.total_amount,
              created_at: new Date().toISOString()
            }])
            .select()
            .single()

          if (saleError) throw saleError

          // Get credit sale items
          const { data: creditItems, error: itemsError } = await supabase
            .from('credit_sale_items')
            .select('*')
            .eq('credit_sale_id', saleId)

          if (itemsError) throw itemsError

          // Copy items to regular sale_items
          if (creditItems && creditItems.length > 0) {
            const saleItems = creditItems.map(item => ({
              sale_id: regularSale.id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price_at_sale: item.price_at_sale,
              cost_price_at_sale: item.cost_price_at_sale
            }))

            const { error: insertError } = await supabase
              .from('sale_items')
              .insert(saleItems)

            if (insertError) throw insertError
          }
        }
      }

      setPaymentModal({ show: false, saleId: '', amount: 0 })
      setPaymentAmount('')

      // Refresh data
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchCreditSales(session.user.id)
      }
    } catch (err: any) {
      console.error('Error updating payment:', err)
      alert('فشل في تحديث الدفع')
    }
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
    return `${amount.toFixed(2)} دينار`
  }

  const totalUnpaid = creditSales.filter(s => !s.is_paid).reduce((sum, s) => sum + s.remaining_amount, 0)
  const totalCredit = creditSales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalPaid = creditSales.reduce((sum, s) => sum + s.paid_amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoClearWarning />
      
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTi.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => window.location.href = '/pos'}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                title="العودة إلى نقطة البيع"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
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
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-orange-600 text-white"
              title="الديون"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-lg">💳</span>
                <span className="text-[10px] sm:text-xs">الديون</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/expenses'}
              className="px-2 sm:px-4 md:px-6 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
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
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💳 إدارة الديون (البيع بالأجل)</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">متابعة وإدارة المبيعات بالأجل والديون</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">إجمالي الديون</h3>
            <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(totalCredit)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">المبالغ المدفوعة</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">المبالغ المتبقية</h3>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalUnpaid)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">
          <div className="p-3 sm:p-4 flex justify-between items-center cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="font-medium text-sm sm:text-base">الفلاتر والبحث</h3>
            </div>
            
            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {filtersExpanded && (
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">حالة الدفع</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="all">الكل</option>
                    <option value="unpaid">غير مدفوع</option>
                    <option value="paid">مدفوع</option>
                    <option value="today">اليوم</option>
                    <option value="week">آخر 7 أيام</option>
                    <option value="month">آخر 30 يوم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">العميل</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">جميع العملاء</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  setTimeFilter('unpaid')
                  setSelectedCustomerId('')
                  setStartDate('')
                  setEndDate('')
                }}
                className="mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          )}
        </div>

        {/* Credit Sales List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : creditSales.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد ديون</h3>
            <p className="text-gray-500">لم يتم تسجيل أي مبيعات بالأجل بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {creditSales.map((sale) => (
              <div key={sale.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${sale.is_paid ? 'border-green-500' : 'border-orange-500'}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">{sale.customer?.name || 'عميل غير معروف'}</span>
                      {sale.is_paid && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ مدفوع</span>
                      )}
                      {!sale.is_paid && sale.paid_amount > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">جزئي</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">المبلغ الإجمالي:</span>
                        <span className="font-semibold mr-2">{formatCurrency(sale.total_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">المدفوع:</span>
                        <span className="font-semibold mr-2 text-green-600">{formatCurrency(sale.paid_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">المتبقي:</span>
                        <span className="font-semibold mr-2 text-red-600">{formatCurrency(sale.remaining_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">التاريخ:</span>
                        <span className="font-semibold mr-2">{new Date(sale.created_at).toLocaleDateString('ar-TN')}</span>
                      </div>
                    </div>
                  </div>

                  {!sale.is_paid && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentModal({ show: true, saleId: sale.id, amount: sale.remaining_amount })}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
                      >
                        دفع جزئي
                      </button>
                      <button
                        onClick={() => handleMarkAsPaid(sale.id, true)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm whitespace-nowrap"
                      >
                        ✓ دفع كامل
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {paymentModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setPaymentModal({ show: false, saleId: '', amount: 0 })}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">دفع جزئي</h3>
            <p className="text-gray-600 mb-4">المبلغ المتبقي: {formatCurrency(paymentModal.amount)}</p>
            
            <input
              type="number"
              step="0.01"
              placeholder="أدخل المبلغ المدفوع"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => handleMarkAsPaid(paymentModal.saleId, false)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                تأكيد الدفع
              </button>
              <button
                onClick={() => {
                  setPaymentModal({ show: false, saleId: '', amount: 0 })
                  setPaymentAmount('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withSuspensionCheck(Credits)
