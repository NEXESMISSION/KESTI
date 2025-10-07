import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function ForceLogin() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to the force-redirect login page
    window.location.href = '/login-force-redirect'
  }, [])

  return (
    <>
      <Head>
        <title>Redirecting...</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
          <p className="text-gray-600">Redirecting to login page...</p>
        </div>
      </div>
    </>
  )
}
