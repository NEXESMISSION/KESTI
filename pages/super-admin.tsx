import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { supabase, Profile, ActiveDevice } from '@/lib/supabase'
import { useLoading } from '@/contexts/LoadingContext'
import withSuspensionCheck from '@/components/withSuspensionCheck'

function SuperAdmin() {
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const [businesses, setBusinesses] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newBusiness, setNewBusiness] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
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
  
  // Device management state
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [viewingDevicesFor, setViewingDevicesFor] = useState<Profile | null>(null)
  const [userDevices, setUserDevices] = useState<ActiveDevice[]>([])
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({})
  const [deviceLimits, setDeviceLimits] = useState<Record<string, number>>({})
  const [loadingDevices, setLoadingDevices] = useState(false)
  
  // Alert system state
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertUserId, setAlertUserId] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState('')
  
  // Analytics state
  const [activeTab, setActiveTab] = useState<'businesses' | 'analytics' | 'user-analytics'>('businesses')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  
  // Enhanced user analytics state
  const [userAnalytics, setUserAnalytics] = useState<any[]>([])
  const [userAnalyticsLoading, setUserAnalyticsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [detailedUserAnalytics, setDetailedUserAnalytics] = useState<any>(null)

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
      // Auto-refreshing businesses for countdown update
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
      // Checking auto-clear
      
      // Check all businesses and auto-clear if needed
      for (const business of businesses) {
        const useMinutes = business.history_auto_clear_minutes && business.history_auto_clear_minutes > 0
        const useDays = business.history_auto_clear_days && business.history_auto_clear_days > 0
        
        if (!useMinutes && !useDays) {
          // Skipping - no auto-clear configured
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
          // Auto-clear check
        } else if (business.history_auto_clear_days) {
          nextClear = new Date(lastClear.getTime() + business.history_auto_clear_days * 24 * 60 * 60 * 1000)
          timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          shouldClear = timeLeft <= 0
          // Auto-clear check
        }
        
        if (shouldClear) {
          // Auto-clearing history
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
              
              // Auto-cleared successfully
              fetchBusinesses() // Refresh to show updated countdown
            } else {
              // Auto-clear failed
            }
          } catch (error) {
            // Auto-clear error
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
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      router.push('/pos')
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
      // Error fetching businesses
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
      // Error fetching device data
    }
  }

  const fetchUserDevices = async (userId: string) => {
    setLoadingDevices(true)
    try {
      const { data, error } = await supabase
        .from('active_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })

      if (error) throw error
      setUserDevices(data || [])
    } catch (err: any) {
      // Error fetching user devices
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
    showLoading('جاري إلغاء الجهاز...')
    try {
      const { error } = await supabase
        .from('active_devices')
        .delete()
        .eq('id', deviceId)

      if (error) throw error

      setSuccess('Device revoked successfully')
      if (viewingDevicesFor) {
        await fetchUserDevices(viewingDevicesFor.id)
        fetchDeviceData([viewingDevicesFor.id])
      }
    } catch (err: any) {
      // Error revoking device
      setError('Failed to revoke device')
    } finally {
      hideLoading()
    }
  }

  const handleUpdateDeviceLimit = async (userId: string, newLimit: number) => {
    showLoading('جاري تحديث حد الأجهزة...')
    try {
      const { error } = await supabase
        .from('user_limits')
        .upsert({
          user_id: userId,
          max_devices: newLimit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setSuccess(`Device limit updated to ${newLimit}`)
      fetchDeviceData([userId])
    } catch (err: any) {
      // Error updating device limit
      setError('Failed to update device limit')
    } finally {
      hideLoading()
    }
  }

  const handleCreateBusiness = async () => {
    setError(null)
    setSuccess(null)
    showLoading('جاري إنشاء الحساب...')
    try {
      // Get the current session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Create the user account using Supabase admin functions
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + newBusiness.subscriptionDays)

      // Use our consolidated API endpoint with auth token
      const response = await fetch('/api/create-business-consolidated', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newBusiness.email,
          password: newBusiness.password,
          fullName: newBusiness.fullName,
          phoneNumber: newBusiness.phoneNumber,
          pin: newBusiness.pin,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // API Error Response
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
        phoneNumber: '',
        password: '',
        pin: '',
        subscriptionDays: 30,
      })
      fetchBusinesses()
    } catch (err: any) {
      // Error creating business
      setError(err.message || 'Failed to create business account')
    } finally {
      hideLoading()
    }
  }

  const extendSubscription = async (userId: string, currentEndsAt: string | null) => {
    // Check if trying to extend subscription for a super admin
    const targetUser = businesses.find(b => b.id === userId)
    if (targetUser && targetUser.role === 'super_admin') {
      setError('Super admin accounts do not have subscription limits')
      return
    }
    
    showLoading('جاري تمديد الاشتراك...')
    try {
      const currentDate = currentEndsAt ? new Date(currentEndsAt) : new Date()
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 30)

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_ends_at: newDate.toISOString() })
        .eq('id', userId)
        .neq('role', 'super_admin') // Extra safety: Don't update super admins

      if (error) throw error

      setSuccess('Subscription extended by 30 days!')
      fetchBusinesses()
    } catch (error: any) {
      // Error extending subscription
      setError('Failed to extend subscription')
    } finally {
      hideLoading()
    }
  }

  const openSuspendModal = (userId: string) => {
    setSuspendingUserId(userId)
    setSuspensionMessage('')
    setShowSuspendModal(true)
  }

  const suspendUser = async () => {
    if (!suspendingUserId) return
    
    // Check if trying to suspend a super admin
    const targetUser = businesses.find(b => b.id === suspendingUserId)
    if (targetUser && targetUser.role === 'super_admin') {
      setError('Cannot suspend super admin accounts')
      setShowSuspendModal(false)
      setSuspendingUserId(null)
      return
    }
    
    showLoading('جاري تعليق الحساب...')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true,
          suspension_message: suspensionMessage.trim() || 'Your account has been suspended.'
        })
        .eq('id', suspendingUserId)
        .neq('role', 'super_admin') // Extra safety: Don't update super admins

      if (error) throw error

      setSuccess('User suspended successfully!')
      setShowSuspendModal(false)
      setSuspendingUserId(null)
      setSuspensionMessage('')
      fetchBusinesses()
    } catch (error: any) {
      // Error suspending user
      setError('Failed to suspend user')
    } finally {
      hideLoading()
    }
  }

  const unsuspendUser = async (userId: string) => {
    // Check if trying to unsuspend a super admin
    const targetUser = businesses.find(b => b.id === userId)
    if (targetUser && targetUser.role === 'super_admin') {
      setError('Super admin accounts cannot be suspended')
      return
    }
    
    showLoading('جاري إلغاء التعليق...')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: false,
          suspension_message: null
        })
        .eq('id', userId)
        .neq('role', 'super_admin') // Extra safety: Don't update super admins

      if (error) throw error

      setSuccess('User unsuspended successfully!')
      fetchBusinesses()
    } catch (error: any) {
      // Error unsuspending user
      setError('Failed to unsuspend user')
    } finally {
      hideLoading()
    }
  }

  const openAlertModal = (userId: string) => {
    setAlertUserId(userId)
    setAlertMessage('')
    setShowAlertModal(true)
  }

  const handleSendAlert = async () => {
    if (!alertUserId || !alertMessage.trim()) {
      setError('Please enter an alert message')
      return
    }

    showLoading('جاري إرسال التنبيه...')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pending_alert_message: alertMessage.trim() })
        .eq('id', alertUserId)

      if (error) throw error

      setSuccess('Alert sent successfully! It will show when the business owner enters the admin dashboard.')
      setShowAlertModal(false)
      setAlertUserId(null)
      setAlertMessage('')
    } catch (err: any) {
      // Error sending alert
      setError('Failed to send alert')
    } finally {
      hideLoading()
    }
  }

  const handleEditBusiness = (business: Profile) => {
    setEditingBusiness(business)
    setShowEditModal(true)
    setNewPassword('')
  }

  const handleUpdateBusiness = async () => {
    if (!editingBusiness) return

    showLoading('جاري تحديث البيانات...')
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editingBusiness.full_name,
          email: editingBusiness.email,
          phone_number: (editingBusiness as any).phone_number,
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
      // Error updating business
      setError(err.message || 'Failed to update business account')
    } finally {
      hideLoading()
    }
  }

  const handleDeleteBusiness = async (businessId: string, businessEmail: string) => {
    showLoading('جاري حذف الحساب...')
    try {
      // Get the current session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Call the delete user API endpoint with auth token
      const response = await fetch('/api/delete-business', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: businessId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete business')
      }

      setSuccess(`Business account deleted successfully!`)
      setConfirmDelete(null)
      fetchBusinesses()
    } catch (err: any) {
      setError(err.message || 'Failed to delete business account')
    } finally {
      hideLoading()
    }
  }

  // Clear history function removed

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_analytics_dashboard', {
        days_back: analyticsDays
      })

      if (error) {
        console.error('Analytics error:', error)
        setError('Failed to load analytics data')
        return
      }

      setAnalyticsData(data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics()
    } else if (activeTab === 'user-analytics') {
      fetchUserAnalytics()
    }
  }, [activeTab, analyticsDays])

  // Fetch enhanced user analytics
  const fetchUserAnalytics = async () => {
    setUserAnalyticsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_all_users_analytics', {
        p_days: analyticsDays
      })

      if (error) {
        console.error('User analytics error:', error)
        
        // Show detailed error message
        const errorMsg = error.message || 'Unknown error'
        const errorCode = error.code || 'N/A'
        const errorDetails = error.details || 'No details'
        
        console.log('Error Code:', errorCode)
        console.log('Error Message:', errorMsg)
        console.log('Error Details:', errorDetails)
        
        // Check if it's a missing function/column error
        if (error.code === '42703' || error.code === '42883') {
          setError(`⚠️ Database Function Missing! Run FIX_ANALYTICS_NOW.sql
          
Error: ${errorMsg}
Code: ${errorCode}`)
        } else {
          setError(`Analytics Error: ${errorMsg} (Code: ${errorCode})
          
Check browser console for full details.`)
        }
        return
      }

      setUserAnalytics(data || [])
    } catch (err) {
      console.error('User analytics fetch error:', err)
      setError('Failed to load user analytics')
    } finally {
      setUserAnalyticsLoading(false)
    }
  }

  // Fetch detailed analytics for a specific user
  const fetchDetailedUserAnalytics = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_analytics', {
        p_user_id: userId,
        p_days: analyticsDays
      })

      if (error) {
        console.error('Detailed user analytics error:', error)
        return
      }

      setDetailedUserAnalytics(data)
      setSelectedUser(userId)
    } catch (err) {
      console.error('Detailed user analytics fetch error:', err)
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
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login?logout=true')
    }
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src="/logo/KESTI.png" alt="KESTI" className="h-8 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
                <p className="text-xs text-gray-500">Manage business accounts</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('businesses')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'businesses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Business Accounts ({businesses.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics & Conversions
            </button>
            <button
              onClick={() => setActiveTab('user-analytics')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'user-analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👤 User Performance
            </button>
          </nav>
        </div>

        {/* Businesses Tab Content */}
        {activeTab === 'businesses' && (
          <>
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
                  Contact
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{business.email}</div>
                        <div className="text-sm text-gray-500">{(business as any).phone_number || 'No phone'}</div>
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
                        {business.role === 'super_admin' ? (
                          <div className="text-xs text-gray-500 italic">
                            Super Admin - No Actions
                          </div>
                        ) : (
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
                                onClick={() => openAlertModal(business.id)}
                                className="text-purple-600 hover:text-purple-900 text-xs"
                                title="Send alert message"
                              >
                                📢 Alert
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
                        )}
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
                    <p className="text-sm text-gray-900 mt-1">{business.email}</p>
                    <p className="text-sm text-gray-500">{(business as any).phone_number || 'No phone'}</p>
                    
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
                    {business.role === 'super_admin' ? (
                      <div className="text-center text-xs text-gray-500 italic py-2">
                        Super Admin - No Actions Available
                      </div>
                    ) : (
                      <>
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
                            onClick={() => openAlertModal(business.id)}
                            className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium transition"
                            title="Send alert message"
                          >
                            📢 Alert
                          </button>
                        </div>
                        <div>
                          <button
                            onClick={() => setConfirmDelete(business.id)}
                            className="w-full text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
          </>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">📊 Analytics Dashboard</h2>
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>

            {analyticsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics data...</p>
              </div>
            ) : !analyticsData ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Analytics Data Yet</h3>
                <p className="text-gray-600 mb-4">
                  Analytics data will appear here once users start interacting with your landing page.
                </p>
                <p className="text-sm text-gray-500">
                  Make sure you've run the SQL setup from <code className="bg-gray-100 px-2 py-1 rounded">ANALYTICS_SETUP.sql</code>
                </p>
              </div>
            ) : (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-100">Total Sessions</span>
                      <span className="text-3xl">👥</span>
                    </div>
                    <div className="text-3xl font-bold">{analyticsData.total_sessions || 0}</div>
                    <div className="text-blue-100 text-sm mt-2">Unique visitors</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-100">Page Views</span>
                      <span className="text-3xl">📄</span>
                    </div>
                    <div className="text-3xl font-bold">{analyticsData.total_page_views || 0}</div>
                    <div className="text-green-100 text-sm mt-2">Total page views</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-100">Signup Attempts</span>
                      <span className="text-3xl">✍️</span>
                    </div>
                    <div className="text-3xl font-bold">{analyticsData.signup_attempts || 0}</div>
                    <div className="text-purple-100 text-sm mt-2">Started signup process</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-orange-100">Conversions</span>
                      <span className="text-3xl">🎯</span>
                    </div>
                    <div className="text-3xl font-bold">{analyticsData.signups_completed || 0}</div>
                    <div className="text-orange-100 text-sm mt-2">Completed signups</div>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Conversion Rate</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="#10b981"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - (analyticsData.conversion_rate || 0) / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-4xl font-bold text-gray-900">
                          {analyticsData.conversion_rate || 0}%
                        </span>
                        <span className="text-sm text-gray-500">conversion</span>
                      </div>
                    </div>
                    <div className="ml-8 flex-1">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Sessions</span>
                            <span className="font-bold">{analyticsData.total_sessions || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Signup Attempts</span>
                            <span className="font-bold">{analyticsData.signup_attempts || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ 
                                width: `${analyticsData.total_sessions > 0 ? (analyticsData.signup_attempts / analyticsData.total_sessions * 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Completed</span>
                            <span className="font-bold text-green-600">{analyticsData.signups_completed || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${analyticsData.conversion_rate || 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top UTM Sources */}
                {analyticsData.top_utm_sources && analyticsData.top_utm_sources.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Top Traffic Sources (Facebook Ads)</h3>
                    <div className="space-y-3">
                      {analyticsData.top_utm_sources.map((source: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{source.utm_source || 'Direct'}</div>
                              <div className="text-sm text-gray-500">{source.sessions} sessions</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{source.sessions}</div>
                            <div className="text-xs text-gray-500">visitors</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Breakdown */}
                {analyticsData.device_breakdown && analyticsData.device_breakdown.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📱 Device Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analyticsData.device_breakdown.map((device: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <div className="text-center mb-2">
                            <span className="text-4xl">
                              {device.device_type === 'mobile' ? '📱' : device.device_type === 'tablet' ? '📋' : '💻'}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{device.sessions}</div>
                            <div className="text-sm text-gray-600 capitalize">{device.device_type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Trend */}
                {analyticsData.daily_trend && analyticsData.daily_trend.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Daily Trend</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Sessions</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Conversions</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.daily_trend.slice(0, 10).map((day: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-3 text-sm text-gray-900">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-3 px-3 text-sm text-right font-medium">{day.sessions}</td>
                              <td className="py-3 px-3 text-sm text-right font-medium text-green-600">{day.conversions}</td>
                              <td className="py-3 px-3 text-sm text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {day.sessions > 0 ? ((day.conversions / day.sessions) * 100).toFixed(1) : 0}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Refresh Button */}
                <div className="text-center">
                  <button
                    onClick={fetchAnalytics}
                    className="bg-primary hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* User Performance Analytics Tab */}
        {activeTab === 'user-analytics' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">👤 User Performance Analytics</h2>
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last Year</option>
              </select>
            </div>

            {userAnalyticsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user analytics...</p>
              </div>
            ) : userAnalytics.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No User Data Available</h3>
                <p className="text-gray-600 mb-4">User performance data will appear here once users start using the system.</p>
                <p className="text-sm text-gray-500">
                  Make sure you've run <code className="bg-gray-100 px-2 py-1 rounded">ENHANCED_ANALYTICS.sql</code>
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-blue-100 text-sm mb-2">Total Users</div>
                    <div className="text-3xl font-bold">{userAnalytics.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-green-100 text-sm mb-2">Total Sales</div>
                    <div className="text-3xl font-bold">
                      {userAnalytics.reduce((sum, u) => sum + (u.total_sales || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-purple-100 text-sm mb-2">Total Transactions</div>
                    <div className="text-3xl font-bold">
                      {userAnalytics.reduce((sum, u) => sum + (u.total_transactions || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-orange-100 text-sm mb-2">Active Users</div>
                    <div className="text-3xl font-bold">
                      {userAnalytics.filter(u => (u.total_logins || 0) > 0).length}
                    </div>
                  </div>
                </div>

                {/* User Performance Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">📊 Detailed User Metrics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Logins</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userAnalytics.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).map((user) => (
                          <tr key={user.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                                {user.last_login && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Last login: {new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-bold text-green-600">
                                {(user.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} DT
                              </div>
                              {user.outstanding_credit > 0 && (
                                <div className="text-xs text-orange-600">
                                  {(user.outstanding_credit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} DT credit
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-gray-900">{user.total_transactions || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-gray-700">{user.total_products || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-gray-700">{user.total_customers || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-blue-600 font-medium">{user.total_logins || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-purple-600">📱 {user.active_devices || 0}/3</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                                user.subscription_status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                                user.subscription_status === 'expired' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscription_status === 'active' ? '✓ Active' :
                                 user.subscription_status === 'expiring_soon' ? '⚠️ Expiring' :
                                 user.subscription_status === 'expired' ? '✗ Expired' :
                                 'No Sub'}
                              </span>
                              {user.is_suspended && (
                                <div className="mt-1">
                                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Suspended</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => fetchDetailedUserAnalytics(user.user_id)}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🥇 Top by Sales</h3>
                    <div className="space-y-3">
                      {userAnalytics
                        .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
                        .slice(0, 5)
                        .map((user, idx) => (
                          <div key={user.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</span>
                              <div>
                                <div className="text-sm font-medium">{user.full_name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{user.total_transactions || 0} transactions</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-green-600">
                              {(user.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} DT
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Most Active</h3>
                    <div className="space-y-3">
                      {userAnalytics
                        .sort((a, b) => (b.total_logins || 0) - (a.total_logins || 0))
                        .slice(0, 5)
                        .map((user, idx) => (
                          <div key={user.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</span>
                              <div>
                                <div className="text-sm font-medium">{user.full_name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-blue-600">
                              {user.total_logins || 0} logins
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Most Products</h3>
                    <div className="space-y-3">
                      {userAnalytics
                        .sort((a, b) => (b.total_products || 0) - (a.total_products || 0))
                        .slice(0, 5)
                        .map((user, idx) => (
                          <div key={user.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</span>
                              <div>
                                <div className="text-sm font-medium">{user.full_name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{user.total_customers || 0} customers</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-purple-600">
                              {user.total_products || 0} items
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
                <div className="text-center">
                  <button
                    onClick={fetchUserAnalytics}
                    className="bg-primary hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </>
            )}
          </div>
        )}
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newBusiness.phoneNumber}
                  onChange={(e) => setNewBusiness({ ...newBusiness, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="+216 12 345 678"
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={(editingBusiness as any).phone_number || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, phone_number: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="+216 12 345 678"
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


      {/* Device Management Modal */}
      {showDevicesModal && viewingDevicesFor && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
                    <p className="text-sm text-gray-500">{viewingDevicesFor.full_name}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDevicesModal(false)
                  setViewingDevicesFor(null)
                  setUserDevices([])
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Device Limit Control */}
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Device Limit Configuration
                </label>
                <span className="text-xs font-medium px-3 py-1 bg-white rounded-full text-blue-600 shadow-sm">
                  {deviceCounts[viewingDevicesFor.id] || 0}/{deviceLimits[viewingDevicesFor.id] || 3} Active
                </span>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={deviceLimits[viewingDevicesFor.id] || 3}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-semibold text-gray-900"
                    id={`device-limit-${viewingDevicesFor.id}`}
                  />
                  <div className="absolute right-3 top-3 text-xs text-gray-500 font-medium">devices</div>
                </div>
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
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Limit
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Maximum 10 devices allowed per user
              </p>
            </div>

            {/* Device List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  Active Devices
                </h3>
                {!loadingDevices && userDevices.length > 0 && (
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {userDevices.length} {userDevices.length === 1 ? 'device' : 'devices'}
                  </span>
                )}
              </div>
              
              {loadingDevices ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-500 font-medium">Loading devices...</p>
                </div>
              ) : userDevices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No active devices</p>
                  <p className="text-xs text-gray-400 mt-1">This user hasn't logged in from any device yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDevices.map((device, index) => (
                    <div key={device.id} className="group border-2 border-gray-100 hover:border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Device Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-xl">📱</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-base truncate">
                                {device.device_name || 'Unknown Device'}
                              </h4>
                              <p className="text-xs text-gray-500 font-medium">Device #{index + 1}</p>
                            </div>
                          </div>
                          
                          {/* Device Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Last Active</p>
                                <p className="text-sm text-gray-900 font-semibold truncate">
                                  {new Date(device.last_active_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Registered</p>
                                <p className="text-sm text-gray-900 font-semibold truncate">
                                  {new Date(device.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            {/* IP Address */}
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">IP Address</p>
                                <p className="text-sm text-gray-900 font-semibold truncate font-mono">
                                  {device.ip_address || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Device Identifier */}
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Device ID</p>
                                <p className="text-xs text-gray-900 font-semibold truncate font-mono">
                                  {device.device_identifier.substring(0, 16)}...
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* User Agent */}
                          {device.user_agent && (
                            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium mb-1">Browser Information</p>
                                <p className="text-xs text-gray-600 break-all leading-relaxed">
                                  {device.user_agent}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Revoke Button */}
                        <button
                          onClick={() => {
                            if (confirm('⚠️ Are you sure you want to revoke this device?\n\nThe user will be immediately logged out from this device.')) {
                              handleRevokeDevice(device.id)
                            }
                          }}
                          className="flex-shrink-0 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all text-sm font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2 border border-red-200 hover:border-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDevicesModal(false)
                  setViewingDevicesFor(null)
                  setUserDevices([])
                }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📢</span>
              Send Alert to Business
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              This message will appear as a popup when the business owner enters the admin dashboard (after PIN verification). It will only show once.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Message (Arabic recommended)
              </label>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="أدخل رسالتك هنا..."
                dir="rtl"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSendAlert}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition font-medium"
              >
                📢 Send Alert
              </button>
              <button
                onClick={() => {
                  setShowAlertModal(false)
                  setAlertUserId(null)
                  setAlertMessage('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancel
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

