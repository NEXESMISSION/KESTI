import { useState, useEffect } from 'react'

export default function CreateBusinessDirect() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    pin: '',
    subscriptionDays: 30
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [envCheck, setEnvCheck] = useState<{url?: boolean; key?: boolean; service?: boolean}>({})

  useEffect(() => {
    // Check if .env.local exists by trying to fetch config
    const checkEnv = async () => {
      try {
        const response = await fetch('/api/check-env')
        const data = await response.json()
        setEnvCheck(data)
      } catch (err) {
        console.error('Error checking environment:', err)
      }
    }
    
    checkEnv()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Validate inputs
      if (!form.email || !form.password || !form.fullName || !form.pin) {
        throw new Error('All fields are required')
      }
      
      // Send request to our most robust API endpoint
      const response = await fetch('/api/create-business-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          pin: form.pin,
          subscriptionEndsAt: new Date(Date.now() + form.subscriptionDays * 24 * 60 * 60 * 1000).toISOString()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred')
      }
      
      setResult(data)
      setForm({
        email: '',
        password: '',
        fullName: '',
        pin: '',
        subscriptionDays: 30
      })
    } catch (err: any) {
      console.error('Error creating business:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Direct Business Creation</h1>
          <p className="text-gray-600 mb-4">This page bypasses normal flows to ensure business creation works.</p>
          
          {/* Environment Check */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Environment Check</h2>
            <ul className="space-y-1">
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-2 ${envCheck.url ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Supabase URL: {envCheck.url ? 'Available' : 'Missing'}
              </li>
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-2 ${envCheck.key ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Anon Key: {envCheck.key ? 'Available' : 'Missing'}
              </li>
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-2 ${envCheck.service ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Service Role Key: {envCheck.service ? 'Available' : 'Missing'}
              </li>
            </ul>
            
            {(!envCheck.url || !envCheck.key || !envCheck.service) && (
              <div className="mt-3 text-red-600 text-sm">
                <p>Environment variables are missing. Please run the <code>setup-env.bat</code> script and restart the server.</p>
              </div>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Success Display */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <h3 className="font-bold mb-1">Business Created Successfully!</h3>
              <p>User ID: {result.userId}</p>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({...form, fullName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter business name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="email@example.com"
                autoComplete="username email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter password"
                autoComplete="new-password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code (4-6 digits)</label>
              <input
                type="text"
                value={form.pin}
                onChange={(e) => setForm({...form, pin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. 1234"
                maxLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Days</label>
              <input
                type="number"
                value={form.subscriptionDays}
                onChange={(e) => setForm({...form, subscriptionDays: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min={1}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !envCheck.service}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Business Account'}
            </button>
          </form>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => window.location.href = '/navigation'}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Back to Navigation
          </button>
          
          <button
            onClick={() => window.location.href = '/super-admin-basic'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
