import { useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'

/**
 * Hook for business account management (super admin)
 */
export default function useBusinesses() {
  const [businesses, setBusinesses] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch all business accounts
  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'business_user')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setBusinesses(data || [])
      return data
    } catch (err) {
      console.error('Error fetching businesses:', err)
      setError(getErrorMessage(err))
      return []
    } finally {
      setLoading(false)
    }
  }
  
  // Create a new business account
  const createBusiness = async (
    email: string, 
    password: string, 
    fullName: string, 
    pin: string, 
    subscriptionDays: number = 30
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      // Calculate subscription end date
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + subscriptionDays)
      
      // Create business via API route
      const response = await fetch('/api/create-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          pin,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create business')
      }
      
      setSuccess('Business account created successfully')
      await fetchBusinesses()
      return { success: true, userId: result.userId }
    } catch (err) {
      console.error('Error creating business:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Extend a business subscription
  const extendSubscription = async (userId: string, daysToAdd: number = 30) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current subscription
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_ends_at')
        .eq('id', userId)
        .single()
      
      if (profileError) throw profileError
      
      // Calculate new date
      const currentDate = profile.subscription_ends_at 
        ? new Date(profile.subscription_ends_at) 
        : new Date()
      
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + daysToAdd)
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_ends_at: newDate.toISOString() 
        })
        .eq('id', userId)
      
      if (error) throw error
      
      setSuccess(`Subscription extended by ${daysToAdd} days`)
      await fetchBusinesses()
      return { success: true }
    } catch (err) {
      console.error('Error extending subscription:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle business account suspension
  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: !currentStatus 
        })
        .eq('id', userId)
      
      if (error) throw error
      
      const action = !currentStatus ? 'suspended' : 'unsuspended'
      setSuccess(`Account ${action} successfully`)
      await fetchBusinesses()
      return { success: true }
    } catch (err) {
      console.error('Error toggling suspension:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Get a single business account
  const getBusiness = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      return { success: true, data }
    } catch (err) {
      console.error('Error getting business:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  return {
    businesses,
    loading,
    error,
    success,
    fetchBusinesses,
    createBusiness,
    extendSubscription,
    toggleSuspension,
    getBusiness,
    setError,
    setSuccess,
  }
}
