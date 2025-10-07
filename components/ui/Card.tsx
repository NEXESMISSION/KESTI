import { ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export default function Card({ title, description, children, footer, className }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className || ''}`}>
      {(title || description) && (
        <div className="p-6 border-b">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      
      <div className="p-6">{children}</div>
      
      {footer && <div className="bg-gray-50 px-6 py-3 border-t">{footer}</div>}
    </div>
  )
}
