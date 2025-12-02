import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OwnerDashboardRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/products')
  }, [router])
  
  return null
}
