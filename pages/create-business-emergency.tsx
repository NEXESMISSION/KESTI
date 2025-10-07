import { useState } from 'react'
import Head from 'next/head'

export default function CreateBusinessEmergency() {
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
      
      // Calculate subscription end date
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + form.subscriptionDays)
      
      // Send request to emergency API endpoint
      const response = await fetch('/api/create-business-emergency', {
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
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred')
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
        <title>Emergency Business Creation</title>
      </Head>
      
      <div className="min-h-screen bg-red-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-red-600">Emergency Business Creation</h1>
              <p className="text-red-700 mt-2">
                This page bypasses environment variables using hardcoded credentials.
                Use only when standard methods fail.
              </p>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
                <strong>Success:</strong> {success}
                {result && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
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
                className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Business Account (Emergency)'}
              </button>
            </form>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => window.location.href = '/navigation'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md"
            >
              Back to Navigation
            </button>
            
            <button
              onClick={() => window.location.href = '/create-business-direct'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Try Standard Method
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
