import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, Profile } from '@/lib/supabase'
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

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
    
    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.business_user' },
        (payload) => {
          console.log('Real-time update:', payload)
          // Refresh the businesses list when any change occurs
          fetchBusinesses()
        }
      )
      .subscribe()
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
    } catch (err: any) {
      console.error('Error fetching businesses:', err)
      setError('Failed to load businesses')
    } finally {
      setLoading(false)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage all business accounts</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
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
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + Create New Business Account
          </button>
        </div>

        {/* Businesses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No businesses found. Create your first one!
                  </td>
                </tr>
              ) : (
                businesses.map((business) => {
                  const subStatus = getSubscriptionStatus(business.subscription_ends_at)
                  return (
                    <tr key={business.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {business.full_name || 'N/A'}
                        </div>
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
      </main>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Business Account</h2>
            
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit Business Account</h2>
            
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Delete</h2>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Suspend Account</h2>
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
    </div>
  )
}

// Export the wrapped component
export default withSuspensionCheck(SuperAdmin)
