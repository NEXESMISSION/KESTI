import { useState } from 'react'
import Head from 'next/head'

export default function TestKey() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testKey = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-service-key')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Test Service Key</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">Service Key Test</h1>
            
            <p className="text-gray-700 mb-6">
              This will test if your Supabase SERVICE_ROLE_KEY is working correctly.
              Click the button below to test.
            </p>

            <button
              onClick={testKey}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mb-6"
            >
              {loading ? 'Testing...' : 'Test Service Key'}
            </button>

            {result && (
              <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                <h2 className={`text-xl font-bold mb-4 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <strong>Message:</strong>
                    <p className="ml-4">{result.message}</p>
                  </div>

                  {result.success && result.userCount !== undefined && (
                    <div>
                      <strong>Users in database:</strong>
                      <p className="ml-4">{result.userCount}</p>
                    </div>
                  )}

                  {!result.success && (
                    <>
                      {result.status && (
                        <div>
                          <strong>HTTP Status:</strong>
                          <p className="ml-4">{result.status} - {result.statusText}</p>
                        </div>
                      )}
                      
                      {result.details && (
                        <div>
                          <strong>Error Details:</strong>
                          <pre className="ml-4 mt-2 p-3 bg-gray-800 text-white rounded text-sm overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                        <p className="font-bold text-yellow-800">What This Means:</p>
                        <p className="text-yellow-700 mt-2">
                          Your SERVICE_ROLE_KEY is not working. This could be because:
                        </p>
                        <ul className="list-disc ml-6 mt-2 text-yellow-700">
                          <li>The key has been regenerated in Supabase</li>
                          <li>The key has expired</li>
                          <li>The key doesn&apos;t have the correct permissions</li>
                          <li>There&apos;s a typo in the key</li>
                        </ul>
                        <p className="text-yellow-700 mt-3 font-bold">
                          Solution: Go to your Supabase Dashboard → Settings → API and copy the fresh service_role key.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If the test fails, you need to update your SERVICE_ROLE_KEY.
                Go to: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a> → Your Project → Settings → API
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
