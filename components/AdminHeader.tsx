import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import Button from '@/components/ui/Button'

type AdminHeaderProps = {
  title: string
  subtitle?: string
  actionLabel?: string
  onActionClick?: () => void
  backLink?: string
  backLabel?: string
  rightContent?: ReactNode
}

export default function AdminHeader({
  title,
  subtitle,
  actionLabel,
  onActionClick,
  backLink,
  backLabel = 'Back',
  rightContent
}: AdminHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          
          <div className="flex items-center gap-3">
            {rightContent}
            
            {actionLabel && onActionClick && (
              <Button onClick={onActionClick} variant="primary">
                {actionLabel}
              </Button>
            )}
            
            {backLink && (
              <Button 
                onClick={() => router.push(backLink)} 
                variant="outline"
              >
                {backLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
