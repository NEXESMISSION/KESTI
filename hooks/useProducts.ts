import { useState, useEffect } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'

/**
 * Hook for product management functionality
 */
export default function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch products for the current user
  const fetchProducts = async (refresh: boolean = false) => {
    if (loading && !refresh) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
      
      if (error) throw error
      
      setProducts(data || [])
      return data
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(getErrorMessage(err))
      return []
    } finally {
      setLoading(false)
    }
  }
  
  // Create a new product
  const createProduct = async (product: Omit<Product, 'id' | 'owner_id' | 'created_at'>) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          owner_id: session.user.id,
        })
        .select()
      
      if (error) throw error
      
      setSuccess('Product created successfully')
      await fetchProducts(true)
      return { success: true, data: data?.[0] }
    } catch (err) {
      console.error('Error creating product:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Update an existing product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess('Product updated successfully')
      await fetchProducts(true)
      return { success: true }
    } catch (err) {
      console.error('Error updating product:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Delete a product
  const deleteProduct = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess('Product deleted successfully')
      await fetchProducts(true)
      return { success: true }
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Get a single product by ID
  const getProduct = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      return { success: true, data }
    } catch (err) {
      console.error('Error getting product:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  return {
    products,
    loading,
    error,
    success,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    setError,
    setSuccess,
  }
}
