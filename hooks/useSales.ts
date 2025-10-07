import { useState } from 'react'
import { supabase, Sale, SaleItem } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { CartItem } from '@/contexts/CartContext'

/**
 * Hook for sales functionality
 */
export default function useSales() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create a new sale
  const createSale = async (cartItems: CartItem[]) => {
    try {
      setLoading(true)
      setError(null)
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty')
      }
      
      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.selling_price * item.quantity), 
        0
      )
      
      // Format sale items for the RPC function
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        priceAtSale: item.product.selling_price,
      }))
      
      // Create sale using RPC function
      const { data, error } = await supabase.rpc('create_sale', {
        sale_total: totalAmount,
        items: items,
      })
      
      if (error) throw error
      
      setSuccess('Sale completed successfully')
      return { success: true, saleId: data }
    } catch (err) {
      console.error('Error creating sale:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Get recent sales
  const getRecentSales = async (limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return { success: true, data }
    } catch (err) {
      console.error('Error getting sales:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err), data: [] }
    } finally {
      setLoading(false)
    }
  }
  
  // Get a single sale with items
  const getSale = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single()
      
      if (saleError) throw saleError
      
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('sale_id', id)
      
      if (itemsError) throw itemsError
      
      return { 
        success: true, 
        data: { 
          ...sale, 
          items: items || [] 
        } 
      }
    } catch (err) {
      console.error('Error getting sale:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Get sales for date range
  const getSalesForDateRange = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { success: true, data }
    } catch (err) {
      console.error('Error getting sales by date range:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err), data: [] }
    } finally {
      setLoading(false)
    }
  }
  
  // Get sales statistics for today
  const getTodayStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get start and end of today
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      
      // Get sales for today
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
      
      if (error) throw error
      
      // Calculate statistics
      const totalSales = data?.length || 0
      const totalRevenue = data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
      const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0
      
      return { 
        success: true, 
        data: {
          totalSales,
          totalRevenue,
          averageSale,
        } 
      }
    } catch (err) {
      console.error('Error getting today stats:', err)
      setError(getErrorMessage(err))
      return { 
        success: false, 
        error: getErrorMessage(err),
        data: { totalSales: 0, totalRevenue: 0, averageSale: 0 } 
      }
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    error,
    success,
    createSale,
    getRecentSales,
    getSale,
    getSalesForDateRange,
    getTodayStats,
    setError,
    setSuccess,
  }
}
