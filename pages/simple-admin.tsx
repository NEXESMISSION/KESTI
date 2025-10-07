import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleAdmin() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])

  useEffect(() => {
    const getSession = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session)
        
        if (!session) {
          setError('No session found. Please login first.')
          setLoading(false)
          return
        }
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('Profile error:', profileError)
          setError(`Error fetching profile: ${profileError.message}`)
          setLoading(false)
          return
        }
        
        console.log('Profile:', profile)
        setUser(profile)
        
        // Check if super admin
        if (!profile || profile.role?.toString() !== 'super_admin') {
          setError('You are not authorized to view this page')
          setLoading(false)
          return
        }
        
        // Get businesses
        const { data: businessData, error: businessError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'business_user')
          
        if (businessError) {
          console.error('Business fetch error:', businessError)
          setError(`Error fetching businesses: ${businessError.message}`)
          setLoading(false)
          return
        }
        
        console.log('Businesses:', businessData)
        setBusinesses(businessData || [])
        setLoading(false)
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(`Unexpected error: ${err.message}`)
        setLoading(false)
      }
    }
    
    getSession()
  }, [])
  
  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-300 p-4 rounded mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back to Login
        </button>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Admin Dashboard</h1>
      
      <div className="bg-green-50 border border-green-300 p-4 rounded mb-6">
        <p className="text-green-700">✅ You&apos;re successfully logged in as a super admin!</p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
        <div className="bg-gray-50 border p-4 rounded">
          <pre className="whitespace-pre-wrap overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Business Accounts ({businesses.length})</h2>
        {businesses.length === 0 ? (
          <p>No business accounts found.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Email</th>
                <th className="border border-gray-300 p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id}>
                  <td className="border border-gray-300 p-2">
                    {business.full_name || 'No Name'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {business.email || 'No Email'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {business.is_suspended ? 
                      <span className="text-red-600">Suspended</span> : 
                      <span className="text-green-600">Active</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={() => window.location.href = '/super-admin'}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Go to Full Admin Dashboard
        </button>
        
        <button
          onClick={() => window.location.href = '/direct-access'}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Direct Access
        </button>
        
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
