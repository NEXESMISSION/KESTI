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
            <Image src="/logo/logo no bg low qulity.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
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
            <button onClick={() => window.location.href = '/credits'} className="py-2 rounded-lg text-center bg-orange-600 text-white">
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
        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">💳</p>
            <p className="text-lg sm:text-xl font-black text-orange-600">{totalCredit.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">إجمالي</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">✅</p>
            <p className="text-lg sm:text-xl font-black text-green-600">{totalPaid.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">مدفوع</p>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <p className="text-xl mb-1">⚠️</p>
            <p className="text-lg sm:text-xl font-black text-red-600">{totalUnpaid.toFixed(0)}</p>
            <p className="text-[9px] text-gray-500">متبقي</p>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'unpaid', label: 'غير مدفوع', color: 'orange' },
            { key: 'paid', label: 'مدفوع', color: 'green' },
            { key: 'all', label: 'الكل', color: 'gray' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                timeFilter === f.key
                  ? f.color === 'orange' ? 'bg-orange-600 text-white' : f.color === 'green' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
          
          {/* Customer Filter */}
          {customers.length > 0 && (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-2 rounded-full text-sm border border-gray-200 bg-white"
            >
              <option value="">كل العملاء</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Credit Sales List */}
        {creditSales.length === 0 ? (
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

