import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Profile, ActiveDevice } from '@/lib/supabase'
import withSuspensionCheck from '@/components/withSuspensionCheck'

function SuperAdmin() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newBusiness, setNewBusiness] = useState({
    fullName: '',
    email: '',
    password: '',
    pin: '',
    subscriptionDays: 30,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null)
  const [suspensionMessage, setSuspensionMessage] = useState('')
  const [confirmClearHistory, setConfirmClearHistory] = useState<string | null>(null)
  const [clearingHistory, setClearingHistory] = useState(false)
  
  // Device management state
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [viewingDevicesFor, setViewingDevicesFor] = useState<Profile | null>(null)
  const [userDevices, setUserDevices] = useState<ActiveDevice[]>([])
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({})
  const [deviceLimits, setDeviceLimits] = useState<Record<string, number>>({})
  const [loadingDevices, setLoadingDevices] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
    
    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.business_user' },
        () => {
          fetchBusinesses()
        }
      )
      .subscribe()

    // Refresh businesses every 30 seconds to update countdown and check auto-clear
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing businesses for countdown update...')
      fetchBusinesses()
    }, 30000) // 30 seconds

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    if (businesses.length === 0) return

    const checkAndClear = async () => {
      console.log('🔍 Checking auto-clear for', businesses.length, 'businesses...')
      
      // Check all businesses and auto-clear if needed
      for (const business of businesses) {
        const useMinutes = business.history_auto_clear_minutes && business.history_auto_clear_minutes > 0
        const useDays = business.history_auto_clear_days && business.history_auto_clear_days > 0
        
        if (!useMinutes && !useDays) {
          console.log(`⏭️ Skipping ${business.full_name} - no auto-clear configured`)
          continue
        }
        
        const lastClear = business.last_history_clear ? new Date(business.last_history_clear) : new Date()
        const now = new Date()
        
        let nextClear: Date
        let shouldClear = false
        let timeLeft: number
        
        if (useMinutes && business.history_auto_clear_minutes) {
          nextClear = new Date(lastClear.getTime() + business.history_auto_clear_minutes * 60 * 1000)
          timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60))
          shouldClear = timeLeft <= 0
          console.log(`⏰ ${business.full_name}: ${timeLeft} minutes left (clear every ${business.history_auto_clear_minutes}min)`)
        } else if (business.history_auto_clear_days) {
          nextClear = new Date(lastClear.getTime() + business.history_auto_clear_days * 24 * 60 * 60 * 1000)
          timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          shouldClear = timeLeft <= 0
          console.log(`⏰ ${business.full_name}: ${timeLeft} days left (clear every ${business.history_auto_clear_days}d)`)
        }
        
        if (shouldClear) {
          console.log(`🗑️ AUTO-CLEARING history for ${business.full_name}`)
          try {
            const response = await fetch('/api/clear-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: business.id })
            })

            if (response.ok) {
              // Update last_history_clear timestamp
              await supabase
                .from('profiles')
                .update({ last_history_clear: new Date().toISOString() })
                .eq('id', business.id)
              
              console.log(`✅ Auto-cleared successfully for ${business.full_name}`)
              fetchBusinesses() // Refresh to show updated countdown
            } else {
              console.error(`❌ Auto-clear failed for ${business.full_name}:`, response.statusText)
            }
          } catch (error) {
            console.error(`❌ Auto-clear error for ${business.full_name}:`, error)
          }
        }
      }
    }

    // Check when businesses data changes
    checkAndClear()
  }, [businesses])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      window.location.href = '/pos'
    }
  }

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'business_user')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
      
      // Fetch device counts and limits for all users
      if (data) {
        fetchDeviceData(data.map(b => b.id))
      }
    } catch (err: any) {
      console.error('Error fetching businesses:', err)
      setError('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceData = async (userIds: string[]) => {
    try {
      // Fetch device counts
      const { data: devicesData, error: devicesError } = await supabase
        .from('active_devices')
        .select('user_id')
        .in('user_id', userIds)

      if (!devicesError && devicesData) {
        const counts: Record<string, number> = {}
        devicesData.forEach(device => {
          counts[device.user_id] = (counts[device.user_id] || 0) + 1
        })
        setDeviceCounts(counts)
      }

      // Fetch device limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('user_limits')
        .select('user_id, max_devices')
        .in('user_id', userIds)

      if (!limitsError && limitsData) {
        const limits: Record<string, number> = {}
        limitsData.forEach(limit => {
          limits[limit.user_id] = limit.max_devices
        })
        setDeviceLimits(limits)
      }
    } catch (err) {
      console.error('Error fetching device data:', err)
    }
  }

  const fetchUserDevices = async (userId: string) => {
    setLoadingDevices(true)
    try {
      const { data, error } = await supabase.rpc('get_user_devices', {
        p_user_id: userId,
      })

      if (error) throw error
      setUserDevices(data || [])
    } catch (err: any) {
      console.error('Error fetching user devices:', err)
      setError('Failed to load devices')
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleViewDevices = async (business: Profile) => {
    setViewingDevicesFor(business)
    setShowDevicesModal(true)
    await fetchUserDevices(business.id)
  }

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const { data, error } = await supabase.rpc('revoke_device', {
        p_device_id: deviceId,
      })

      if (error) throw error

      setSuccess('Device revoked successfully')
      if (viewingDevicesFor) {
        await fetchUserDevices(viewingDevicesFor.id)
        fetchDeviceData([viewingDevicesFor.id])
      }
    } catch (err: any) {
      console.error('Error revoking device:', err)
      setError('Failed to revoke device')
    }
  }

  const handleUpdateDeviceLimit = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase.rpc('update_user_device_limit', {
        p_user_id: userId,
        p_max_devices: newLimit,
      })

      if (error) throw error

      setSuccess(`Device limit updated to ${newLimit}`)
      fetchDeviceData([userId])
    } catch (err: any) {
      console.error('Error updating device limit:', err)
      setError(err.message || 'Failed to update device limit')
    }
  }

  const handleCreateBusiness = async () => {
    setError(null)
    setSuccess(null)

    if (!newBusiness.fullName || !newBusiness.email || !newBusiness.password || !newBusiness.pin) {
      setError('All fields are required')
      return
    }

    try {
      // Create the user account using Supabase admin functions
      // Note: In production, this should be done through an Edge Function for security
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + newBusiness.subscriptionDays)

      // Use our consolidated API endpoint that properly handles environment variables
      const response = await fetch('/api/create-business-consolidated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newBusiness.email,
          password: newBusiness.password,
          fullName: newBusiness.fullName,
          pin: newBusiness.pin,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API Error Response:', result)
        // Show detailed error message
        const errorMessage = result.message || result.error || 'Failed to create business'
        const errorHint = result.hint ? ` (${result.hint})` : ''
        throw new Error(errorMessage + errorHint)
      }

      setSuccess('Business account created successfully!')
      setShowCreateModal(false)
      setNewBusiness({
        fullName: '',
        email: '',
        password: '',
        pin: '',
        subscriptionDays: 30,
      })
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error creating business:', err)
      console.error('Error details:', err.message)
      setError(err.message || 'Failed to create business account')
    }
  }

  const extendSubscription = async (userId: string, currentEndsAt: string | null) => {
    try {
      const currentDate = currentEndsAt ? new Date(currentEndsAt) : new Date()
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 30)

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_ends_at: newDate.toISOString() })
        .eq('id', userId)

      if (error) throw error

      setSuccess('Subscription extended by 30 days')
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error extending subscription:', err)
      setError('Failed to extend subscription')
    }
  }

  const openSuspendModal = (userId: string) => {
    setSuspendingUserId(userId)
    setSuspensionMessage('')
    setShowSuspendModal(true)
  }

  const suspendUser = async () => {
    if (!suspendingUserId) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_message: suspensionMessage.trim() || 'Your account has been suspended by the administrator.'
        })
        .eq('id', suspendingUserId)

      if (error) throw error

      setSuccess('Account suspended successfully')
      setShowSuspendModal(false)
      setSuspendingUserId(null)
      setSuspensionMessage('')
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error suspending account:', err)
      setError('Failed to suspend account')
    }
  }

  const unsuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_message: null
        })
        .eq('id', userId)

      if (error) throw error

      setSuccess('Account unsuspended successfully')
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error unsuspending account:', err)
      setError('Failed to update account status')
    }
  }

  const handleEditBusiness = (business: Profile) => {
    setEditingBusiness(business)
    setNewPassword('') // Reset password field
    setShowEditModal(true)
  }

  const handleUpdateBusiness = async () => {
    if (!editingBusiness) return

    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editingBusiness.full_name,
          email: editingBusiness.email,
          pin_code: editingBusiness.pin_code,
          subscription_ends_at: editingBusiness.subscription_ends_at,
          history_auto_clear_days: editingBusiness.history_auto_clear_days,
          history_auto_clear_minutes: editingBusiness.history_auto_clear_minutes,
        })
        .eq('id', editingBusiness.id)

      if (profileError) throw profileError

      // Update password if provided
      if (newPassword && newPassword.trim() !== '') {
        const response = await fetch('/api/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: editingBusiness.id,
            newPassword: newPassword
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update password')
        }
      }

      setSuccess('Business account updated successfully!')
      setShowEditModal(false)
      setEditingBusiness(null)
      setNewPassword('')
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error updating business:', err)
      setError(err.message || 'Failed to update business account')
    }
  }

  const handleDeleteBusiness = async (businessId: string, businessEmail: string) => {
    try {
      // First, delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', businessId)

      if (profileError) throw profileError

      // Then delete from Supabase Auth
      // Note: This requires admin API access
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Call the delete user API endpoint
        const response = await fetch('/api/delete-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: businessId })
        })

        if (!response.ok) {
          console.warn('Failed to delete from auth, but profile deleted')
        }
      }

      setSuccess(`Business account deleted successfully!`)
      setConfirmDelete(null)
      fetchBusinesses()
    } catch (err: any) {
      console.error('Error deleting business:', err)
      setError('Failed to delete business account')
    }
  }

  const handleClearHistory = async (businessId: string) => {
    setClearingHistory(true)
    try {
      const response = await fetch('/api/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: businessId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear history')
      }

      // Update last_history_clear timestamp
      await supabase
        .from('profiles')
        .update({ last_history_clear: new Date().toISOString() })
        .eq('id', businessId)

      setSuccess('History cleared successfully! Products and saved expense templates retained.')
      setConfirmClearHistory(null)
      fetchBusinesses() // Refresh to show updated countdown
    } catch (err: any) {
      console.error('Error clearing history:', err)
      setError(err.message || 'Failed to clear history')
    } finally {
      setClearingHistory(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    window.location.href = '/login?logout=true'
  }

  const getSubscriptionStatus = (endsAt: string | null) => {
    if (!endsAt) return { text: 'No Subscription', color: 'text-gray-500' }
    const now = new Date()
    const expiryDate = new Date(endsAt)
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600' }
    if (daysLeft < 7) return { text: `${daysLeft} days left`, color: 'text-orange-600' }
    return { text: `${daysLeft} days left`, color: 'text-green-600' }
  }

  const getAutoClearStatus = (business: Profile) => {
    // Use minutes if set (for testing), otherwise use days
    const useMinutes = business.history_auto_clear_minutes && business.history_auto_clear_minutes > 0
    const useDays = business.history_auto_clear_days && business.history_auto_clear_days > 0
    
    if (!useMinutes && !useDays) return null
    
    const lastClear = business.last_history_clear ? new Date(business.last_history_clear) : new Date()
    const now = new Date()
    
    let nextClear: Date
    let timeLeft: number
    let unit: string
    
    if (useMinutes) {
      // Calculate in minutes
      nextClear = new Date(lastClear.getTime() + business.history_auto_clear_minutes! * 60 * 1000)
      timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60))
      unit = 'min'
    } else {
      // Calculate in days
      nextClear = new Date(lastClear.getTime() + business.history_auto_clear_days! * 24 * 60 * 60 * 1000)
      timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      unit = 'd'
    }

    if (timeLeft <= 0) {
      return { text: 'Clear Now!', color: 'text-red-600', shouldClear: true }
    } else if (useMinutes) {
      // For minutes, warn at 5 min
      if (timeLeft <= 5) {
        return { text: `Clear in ${timeLeft}${unit}`, color: 'text-orange-600', shouldClear: false }
      } else {
        return { text: `Clear in ${timeLeft}${unit}`, color: 'text-blue-600', shouldClear: false }
      }
    } else {
      // For days, warn at 3 days
      if (timeLeft <= 3) {
        return { text: `Clear in ${timeLeft}${unit}`, color: 'text-orange-600', shouldClear: false }
      } else {
        return { text: `Clear in ${timeLeft}${unit}`, color: 'text-blue-600', shouldClear: false }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <div className="mb-2">
                <Image src="/logo/KESTi.png" alt="KESTI" width={140} height={45} className="h-10 w-auto" priority />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all business accounts</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition text-sm sm:text-base"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Create Button */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-primary hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition text-sm sm:text-base"
          >
            + Create New Business Account
          </button>
        </div>

        {/* Businesses Table - Hidden on Mobile */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto-Clear
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No businesses found. Create your first one!
                  </td>
                </tr>
              ) : (
                businesses.map((business) => {
                  const subStatus = getSubscriptionStatus(business.subscription_ends_at)
                  const autoClearStatus = getAutoClearStatus(business)
                  return (
                    <tr key={business.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {business.full_name || 'N/A'}
                        </div>
                        {(business.history_auto_clear_days || business.history_auto_clear_minutes) && (
                          <div className="text-xs mt-1">
                            <span className="text-gray-600">Auto-clear: </span>
                            <span className="font-medium text-blue-600">
                              {business.history_auto_clear_minutes 
                                ? `${business.history_auto_clear_minutes}min` 
                                : `${business.history_auto_clear_days}d`}
                            </span>
                            {autoClearStatus && (
                              <span className={`ml-2 font-semibold ${autoClearStatus.color}`}>
                                ({autoClearStatus.text})
                              </span>
                            )}
                            {business.last_history_clear && (
                              <span className="ml-1 text-gray-400">
                                (Last: {new Date(business.last_history_clear).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{business.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${subStatus.color}`}>
                          {subStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDevices(business)}
                          className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                          📱 {deviceCounts[business.id] || 0}/{deviceLimits[business.id] || 3}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {autoClearStatus ? (
                          <span className={`text-xs font-semibold ${autoClearStatus.color}`}>
                            🗑️ {autoClearStatus.text}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Off</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            business.is_suspended
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {business.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => extendSubscription(business.id, business.subscription_ends_at)}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              +30 Days
                            </button>
                            <button
                              onClick={() => business.is_suspended ? unsuspendUser(business.id) : openSuspendModal(business.id)}
                              className={`text-xs ${
                                business.is_suspended
                                  ? 'text-blue-600 hover:text-blue-900'
                                  : 'text-red-600 hover:text-red-900'
                              }`}
                            >
                              {business.is_suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditBusiness(business)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setConfirmClearHistory(business.id)}
                              className="text-orange-600 hover:text-orange-900 text-xs"
                              title="Clear sales history (keeps products & expenses)"
                            >
                              🧹 Clear
                            </button>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setConfirmDelete(business.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Loading...
            </div>
          ) : businesses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No businesses found. Create your first one!
            </div>
          ) : (
            businesses.map((business) => {
              const subStatus = getSubscriptionStatus(business.subscription_ends_at)
              const autoClearStatus = getAutoClearStatus(business)
              return (
                <div key={business.id} className="bg-white rounded-lg shadow p-4">
                  {/* Business Info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {business.full_name || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{business.email}</p>
                    
                    {/* Device Info */}
                    <button
                      onClick={() => handleViewDevices(business)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      📱 Devices: {deviceCounts[business.id] || 0}/{deviceLimits[business.id] || 3}
                    </button>
                    
                    {/* Auto-Clear Countdown Info */}
                    {(business.history_auto_clear_days || business.history_auto_clear_minutes) && (
                      <div className={`mt-2 border-2 rounded-lg p-3 ${
                        autoClearStatus?.color === 'text-red-600' 
                          ? 'bg-red-50 border-red-300' 
                          : autoClearStatus?.color === 'text-orange-600'
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">🗑️ Auto-Clear:</span>
                            <span className="text-xs font-semibold text-gray-900">
                              Every {business.history_auto_clear_minutes 
                                ? `${business.history_auto_clear_minutes} min` 
                                : `${business.history_auto_clear_days} days`}
                            </span>
                          </div>
                          {autoClearStatus && (
                            <span className={`text-sm font-bold ${autoClearStatus.color}`}>
                              {autoClearStatus.text}
                            </span>
                          )}
                        </div>
                        {business.last_history_clear && (
                          <p className="text-xs text-gray-600">
                            Last cleared: {new Date(business.last_history_clear).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${subStatus.color}`}>
                      {subStatus.text}
                    </span>
                    {autoClearStatus && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${autoClearStatus.color} bg-gray-100`}>
                        🗑️ {autoClearStatus.text}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        business.is_suspended
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {business.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => extendSubscription(business.id, business.subscription_ends_at)}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg font-medium transition"
                      >
                        +30 Days
                      </button>
                      <button
                        onClick={() => business.is_suspended ? unsuspendUser(business.id) : openSuspendModal(business.id)}
                        className={`text-xs px-3 py-2 rounded-lg font-medium transition ${
                          business.is_suspended
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {business.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditBusiness(business)}
                        className="text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg font-medium transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setConfirmClearHistory(business.id)}
                        className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-2 rounded-lg font-medium transition"
                        title="Clear sales history"
                      >
                        🧹 Clear History
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setConfirmDelete(business.id)}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition"
                      >
                        🗑️ Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Create New Business Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={newBusiness.fullName}
                  onChange={(e) => setNewBusiness({ ...newBusiness, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newBusiness.email}
                  onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newBusiness.password}
                  onChange={(e) => setNewBusiness({ ...newBusiness, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code (4-6 digits)
                </label>
                <input
                  type="text"
                  value={newBusiness.pin}
                  onChange={(e) => setNewBusiness({ ...newBusiness, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="1234"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Days
                </label>
                <input
                  type="number"
                  value={newBusiness.subscriptionDays}
                  onChange={(e) => setNewBusiness({ ...newBusiness, subscriptionDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateBusiness}
                className="flex-1 bg-primary hover:bg-blue-700 text-white py-2 rounded-lg transition"
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setError(null)
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business Modal */}
      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Edit Business Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={editingBusiness.full_name || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingBusiness.email || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Enter new password or leave empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code (4-6 digits)
                </label>
                <input
                  type="text"
                  value={editingBusiness.pin_code || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, pin_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription End Date
                </label>
                <input
                  type="date"
                  value={editingBusiness.subscription_ends_at?.split('T')[0] || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, subscription_ends_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Clear (Days)
                  </label>
                  <input
                    type="number"
                    value={editingBusiness.history_auto_clear_days || ''}
                    onChange={(e) => setEditingBusiness({ 
                      ...editingBusiness, 
                      history_auto_clear_days: e.target.value ? parseInt(e.target.value) : null,
                      history_auto_clear_minutes: null // Clear minutes if setting days
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 30"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Clear (Minutes)
                  </label>
                  <input
                    type="number"
                    value={editingBusiness.history_auto_clear_minutes || ''}
                    onChange={(e) => setEditingBusiness({ 
                      ...editingBusiness, 
                      history_auto_clear_minutes: e.target.value ? parseInt(e.target.value) : null,
                      history_auto_clear_days: null // Clear days if setting minutes
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 5"
                    min="1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Set either days OR minutes (for testing). Minutes overrides days.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateBusiness}
                className="flex-1 bg-primary hover:bg-blue-700 text-white py-2 rounded-lg transition"
              >
                Update Account
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingBusiness(null)
                  setNewPassword('')
                  setError(null)
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this business account? This action cannot be undone.
              The account will be permanently removed from both the database and authentication system.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const business = businesses.find(b => b.id === confirmDelete)
                  if (business && business.email) {
                    handleDeleteBusiness(confirmDelete, business.email)
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-red-600">Suspend Account</h2>
            <p className="text-gray-700 mb-4">
              Enter a message that will be displayed to the user when they try to access the system.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suspension Message
              </label>
              <textarea
                value={suspensionMessage}
                onChange={(e) => setSuspensionMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary h-32"
                placeholder="Your account has been suspended due to..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={suspendUser}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
              >
                Suspend Account
              </button>
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSuspendingUserId(null)
                  setSuspensionMessage('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {confirmClearHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-orange-600">Clear History</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to clear all transaction history for this business?
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>What will be deleted:</strong> All sales and expenses from the database.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>What will be kept:</strong> Products, saved expense templates (localStorage), categories, and account settings.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleClearHistory(confirmClearHistory)}
                disabled={clearingHistory}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                {clearingHistory ? 'Clearing...' : 'Yes, Clear History'}
              </button>
              <button
                onClick={() => setConfirmClearHistory(null)}
                disabled={clearingHistory}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Management Modal */}
      {showDevicesModal && viewingDevicesFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Device Management</h2>
                <p className="text-sm text-gray-600 mt-1">{viewingDevicesFor.full_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDevicesModal(false)
                  setViewingDevicesFor(null)
                  setUserDevices([])
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Device Limit Control */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Limit for this User
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={deviceLimits[viewingDevicesFor.id] || 3}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  id={`device-limit-${viewingDevicesFor.id}`}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(`device-limit-${viewingDevicesFor.id}`) as HTMLInputElement
                    const newLimit = parseInt(input.value)
                    if (newLimit >= 1 && newLimit <= 10) {
                      handleUpdateDeviceLimit(viewingDevicesFor.id, newLimit)
                    } else {
                      setError('Device limit must be between 1 and 10')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Update Limit
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Current: {deviceCounts[viewingDevicesFor.id] || 0}/{deviceLimits[viewingDevicesFor.id] || 3} devices
              </p>
            </div>

            {/* Device List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Devices</h3>
              
              {loadingDevices ? (
                <div className="text-center py-8 text-gray-500">Loading devices...</div>
              ) : userDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No active devices</div>
              ) : (
                <div className="space-y-3">
                  {userDevices.map((device) => (
                    <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📱</span>
                            <h4 className="font-semibold text-gray-900">
                              {device.device_name || 'Unknown Device'}
                            </h4>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Last Active:</span>{' '}
                              {new Date(device.last_active_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p>
                              <span className="font-medium">Registered:</span>{' '}
                              {new Date(device.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {device.user_agent && (
                              <p className="text-xs text-gray-500 truncate" title={device.user_agent}>
                                <span className="font-medium">Browser:</span> {device.user_agent}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this device? The user will be logged out.')) {
                              handleRevokeDevice(device.id)
                            }
                          }}
                          className="ml-4 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDevicesModal(false)
                  setViewingDevicesFor(null)
                  setUserDevices([])
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(SuperAdmin)
