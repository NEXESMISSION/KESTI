import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Redirect to new combined products page (stock view)
export default function Stock() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/products?view=stock')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )
}
