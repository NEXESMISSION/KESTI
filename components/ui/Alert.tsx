import { ReactNode } from 'react'

type AlertProps = {
  variant: 'success' | 'error' | 'warning' | 'info'
  children: ReactNode
  onClose?: () => void
  className?: string
}

const variants = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

export default function Alert({ variant, children, onClose, className }: AlertProps) {
  return (
    <div className={`mb-4 border px-4 py-3 rounded-lg ${variants[variant]} ${className || ''}`}>
      {children}
      {onClose && (
        <button onClick={onClose} className="float-right font-bold">
          ×
        </button>
      )}
    </div>
  )
}
