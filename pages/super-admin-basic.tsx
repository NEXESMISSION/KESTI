import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SuperAdminBasic() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBusiness, setNewBusiness] = useState({
    fullName: '',
    email: '',
    password: '',
    pin: '',
    subscriptionDays: 30
  })

  // Load businesses on mount
  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'business_user')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setBusinesses(data || [])
    } catch (err: any) {
      console.error('Error fetching businesses:', err)
      setError('Failed to load businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBusiness = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate inputs
      if (!newBusiness.email || !newBusiness.password || !newBusiness.fullName || !newBusiness.pin) {
        setError('All fields are required')
        setLoading(false)
        return
      }
      
      // Create business through the most robust API endpoint
      const response = await fetch('/api/create-business-robust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newBusiness.email,
          password: newBusiness.password,
          fullName: newBusiness.fullName,
          pin: newBusiness.pin,
          subscriptionEndsAt: new Date(Date.now() + newBusiness.subscriptionDays * 24 * 60 * 60 * 1000).toISOString()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create business')
      }
      
      // Reset form and close modal
      setNewBusiness({
        fullName: '',
        email: '',
        password: '',
        pin: '',
        subscriptionDays: 30
      })
      setShowAddModal(false)
      
      // Refresh businesses
      await fetchBusinesses()
    } catch (err: any) {
      console.error('Error creating business:', err)
      setError(err.message || 'Failed to create business account')
    } finally {
      setLoading(false)
    }
  }

  const extendSubscription = async (userId: string, currentDate: string | null) => {
    try {
      const now = new Date()
      const currentEndDate = currentDate ? new Date(currentDate) : now
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + 30)
      
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_ends_at: newEndDate.toISOString() })
        .eq('id', userId)
      
      if (error) throw error
      
      await fetchBusinesses()
    } catch (err: any) {
      console.error('Error extending subscription:', err)
      setError('Failed to extend subscription')
    }
  }

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', userId)
      
      if (error) throw error
      
      await fetchBusinesses()
    } catch (err: any) {
      console.error('Error toggling suspension:', err)
      setError('Failed to update account status')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Basic Super Admin Dashboard</h1>
          <button
            onClick={() => document.location.href = '/login'}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600">Manage all business accounts</p>
      </header>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          + Create New Business Account
        </button>
      </div>
      
      {/* Businesses table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No businesses found</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {businesses.map(business => (
                <tr key={business.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {business.full_name || 'No Name'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {business.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {business.subscription_ends_at ? (
                      <span className={
                        new Date(business.subscription_ends_at) < new Date() 
                          ? 'text-red-600'
                          : 'text-green-600'
                      }>
                        {new Date(business.subscription_ends_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">No subscription</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      business.is_suspended 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {business.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button 
                      onClick={() => extendSubscription(business.id, business.subscription_ends_at)}
                      className="text-green-600 hover:text-green-900"
                    >
                      +30 Days
                    </button>
                    <button
                      onClick={() => toggleSuspension(business.id, business.is_suspended)}
                      className={business.is_suspended 
                        ? 'text-blue-600 hover:text-blue-900' 
                        : 'text-red-600 hover:text-red-900'
                      }
                    >
                      {business.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Business Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={newBusiness.fullName}
                  onChange={(e) => setNewBusiness({...newBusiness, fullName: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newBusiness.email}
                  onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newBusiness.password}
                  onChange={(e) => setNewBusiness({...newBusiness, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code (4-6 digits)</label>
                <input
                  type="text"
                  value={newBusiness.pin}
                  onChange={(e) => setNewBusiness({...newBusiness, pin: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Days</label>
                <input
                  type="number"
                  value={newBusiness.subscriptionDays}
                  onChange={(e) => setNewBusiness({...newBusiness, subscriptionDays: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateBusiness}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => document.location.href = '/super-admin'}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Go to Full Admin
          </button>
          <button
            onClick={() => document.location.href = '/direct-access'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go to Direct Access
          </button>
          <button
            onClick={() => document.location.href = '/simple-admin'}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Go to Simple Admin
          </button>
        </div>
      </div>
    </div>
  )
}
