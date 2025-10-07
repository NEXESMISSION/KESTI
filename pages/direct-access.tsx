import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DirectAccess() {
  const [section, setSection] = useState('loading')
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setSection('login')
          return
        }

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (profileError) {
          throw new Error(`Profile error: ${profileError.message}`)
        }

        setProfile(userProfile)
        
        if (userProfile.role.toString() === 'super_admin') {
          // Load businesses for super admin
          const { data: businessData, error: businessError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'business_user')
            .order('created_at', { ascending: false })
          
          if (businessError) {
            throw new Error(`Business data error: ${businessError.message}`)
          }
          
          setBusinesses(businessData || [])
          setSection('super_admin')
        } else {
          // Load products for business user
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('owner_id', session.user.id)
            .order('name')
          
          if (productError) {
            throw new Error(`Product data error: ${productError.message}`)
          }
          
          setProducts(productData || [])
          setSection('business')
        }
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message || 'Failed to load data')
        setSection('error')
      }
    }

    loadData()
  }, [])

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      setSection('loading')
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Reload page to get fresh data
      window.location.reload()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
      setSection('login')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Render appropriate section
  const renderContent = () => {
    switch (section) {
      case 'loading':
        return <div className="text-center py-20">Loading...</div>
        
      case 'login':
        return (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Login Required</h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  id="quick-email"
                  type="email"
                  className="w-full p-2 border rounded"
                  autoComplete="username email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  id="quick-password"
                  type="password"
                  className="w-full p-2 border rounded"
                  autoComplete="current-password"
                />
              </div>
              <button
                onClick={() => {
                  const email = (document.getElementById('quick-email') as HTMLInputElement)?.value
                  const password = (document.getElementById('quick-password') as HTMLInputElement)?.value
                  handleLogin(email, password)
                }}
                className="w-full bg-blue-500 text-white py-2 rounded"
              >
                Login
              </button>
            </div>
          </div>
        )
        
      case 'super_admin':
        return (
          <div>
            <div className="bg-white p-6 rounded shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Super Admin Panel</h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Logout
                </button>
              </div>
              <div className="mb-4">
                <p><strong>Your Profile:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-bold mb-4">Business Accounts</h2>
              {businesses.length === 0 ? (
                <p>No business accounts found.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id} className="border-b">
                        <td className="px-4 py-2">{business.full_name}</td>
                        <td className="px-4 py-2">{business.email}</td>
                        <td className="px-4 py-2">
                          {business.is_suspended ? (
                            <span className="text-red-500">Suspended</span>
                          ) : (
                            <span className="text-green-500">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
        
      case 'business':
        return (
          <div>
            <div className="bg-white p-6 rounded shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Business Panel</h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Logout
                </button>
              </div>
              <div className="mb-4">
                <p><strong>Your Profile:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-bold mb-4">Your Products</h2>
              {products.length === 0 ? (
                <p>No products found.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Unit Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="px-4 py-2">{product.name}</td>
                        <td className="px-4 py-2">${product.price.toFixed(2)}</td>
                        <td className="px-4 py-2">{product.unit_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
        
      case 'error':
        return (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Return to Login
            </button>
          </div>
        )
        
      default:
        return <div>Unknown state</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Kesti POS - Direct Access Page</h1>
          <p className="text-gray-600">This page bypasses normal navigation to provide direct access to content.</p>
        </header>
        
        {renderContent()}
      </div>
    </div>
  )
}
