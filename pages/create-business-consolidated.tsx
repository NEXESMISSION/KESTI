import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function ConsolidatedBusinessCreation() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    pin: '',
    subscriptionDays: 30
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)
    
    try {
      // Basic validation
      if (!form.email || !form.password || !form.fullName || !form.pin) {
        throw new Error('All fields are required')
      }
      
      // Validate PIN format
      if (!/^\d{4,6}$/.test(form.pin)) {
        throw new Error('PIN must be 4-6 digits')
      }
      
      // Send request to consolidated API endpoint
      const response = await fetch('/api/create-business-consolidated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          pin: form.pin,
          subscriptionDays: form.subscriptionDays
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error (${response.status})`)
      }
      
      setResult(data)
      setSuccess(`Business account created successfully! User ID: ${data.userId}`)
      
      // Reset form
      setForm({
        email: '',
        password: '',
        fullName: '',
        pin: '',
        subscriptionDays: 30
      })
    } catch (err: any) {
      console.error('Error creating business account:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Business Account Creation - Kesti POS</title>
        <meta name="description" content="Create a new business account for Kesti POS" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Create Business Account</h1>
                <p className="text-gray-600 mt-2">
                  Create new business accounts for Kesti POS.
                </p>
              </div>
              <Link href="/navigation" className="text-sm text-blue-500 hover:underline">
                Back to Navigation
              </Link>
            </div>
            
            {/* Status messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <strong>Success:</strong> {success}
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter business name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="email@example.com"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter password"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">PIN Code</label>
                <input
                  type="text"
                  value={form.pin}
                  onChange={(e) => setForm({...form, pin: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter PIN code (4-6 digits)"
                  maxLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PIN must be 4-6 digits. This will be used for login.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subscription Days <span className="text-gray-500 text-xs">(Default: 30)</span>
                </label>
                <input
                  type="number"
                  value={form.subscriptionDays}
                  onChange={(e) => setForm({...form, subscriptionDays: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded-md"
                  min={1}
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Business Account'}
              </button>
            </form>
          </div>
          
          {/* Result */}
          {result && (
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-lg font-bold mb-2">Account Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
                <div className="mb-2">
                  <strong className="text-gray-700">User ID:</strong>
                  <span className="ml-2 text-gray-900 break-all">{result.userId}</span>
                </div>
                <div className="mb-2">
                  <strong className="text-gray-700">Subscription ends:</strong>
                  <span className="ml-2 text-gray-900">
                    {new Date(result.subscriptionEndDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  href="/login" 
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 inline-block text-center"
                >
                  Go to Login Page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
