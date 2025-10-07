import { useState } from 'react'
import Head from 'next/head'

export default function DirectBusiness() {
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
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)
    setDebugInfo(null)
    
    try {
      // Basic validation
      if (!form.email || !form.password || !form.fullName || !form.pin) {
        throw new Error('All fields are required')
      }
      
      // Calculate subscription end date
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + form.subscriptionDays)
      
      // Send request to direct API endpoint
      const response = await fetch('/api/create-business-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          pin: form.pin,
          subscriptionEndsAt: subscriptionEndsAt.toISOString()
        })
      })
      
      // Get response as text first for debugging
      const responseText = await response.text()
      let data
      
      try {
        data = JSON.parse(responseText)
      } catch (err) {
        setDebugInfo({
          responseStatus: response.status,
          responseText
        })
        throw new Error(`Invalid JSON response (status ${response.status})`)
      }
      
      setDebugInfo({
        responseStatus: response.status,
        data
      })
      
      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`)
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
        <title>Direct Business Creation</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-blue-600">Direct Business Creation</h1>
              <p className="text-gray-600 mt-2">
                Create business accounts directly with REST API calls.
                This bypasses all client libraries and environment variables.
              </p>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {/* Success message */}
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Days</label>
                <input
                  type="number"
                  value={form.subscriptionDays}
                  onChange={(e) => setForm({...form, subscriptionDays: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded-md"
                  min={1}
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
          
          {/* Debug Info */}
          {(result || debugInfo) && (
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-2">Debug Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-60">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(debugInfo || result, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => window.location.href = '/navigation'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md"
            >
              Back to Navigation
            </button>
            
            <button
              onClick={() => window.location.href = '/create-business-emergency'}
              className="px-4 py-2 bg-red-600 text-white rounded-md"
            >
              Try Emergency Method
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
