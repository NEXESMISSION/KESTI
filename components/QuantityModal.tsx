import { useState, useEffect } from 'react'
import { Product } from '@/lib/supabase'

type QuantityModalProps = {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onAdd: (quantity: number, unitQuantity?: number) => void
}

export default function QuantityModal({ isOpen, product, onClose, onAdd }: QuantityModalProps) {
  const [quantity, setQuantity] = useState('1')
  
  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
    }
  }, [isOpen])

  // Add keyboard listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault()
        handleAdd()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, quantity])

  if (!isOpen || !product) return null

  const handleAdd = () => {
    const qty = parseFloat(quantity)
    
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity')
      return
    }
    
    // For weight/volume products, quantity represents the weight/volume
    onAdd(qty)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  const showUnitQuantity = product.unit_type !== 'item'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold truncate pr-2">{product.name}</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-blue-100 mt-1">
            {product.selling_price.toFixed(2)} TND/{product.unit_type}
          </p>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Quantity Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => {
                const currentQty = parseFloat(quantity || '1')
                const step = product.unit_type === 'item' ? 1 : 0.5
                setQuantity(String(Math.max(step, currentQty - step)))
              }}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            </button>
            
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={handleKeyPress}
              step={product.unit_type === 'item' ? '1' : '0.1'}
              className="w-20 text-center text-3xl font-bold border-0 bg-transparent focus:outline-none text-gray-900"
              min="0.1"
            />
            
            <button
              onClick={() => {
                const currentQty = parseFloat(quantity || '1')
                const step = product.unit_type === 'item' ? 1 : 0.5
                setQuantity(String(currentQty + step))
              }}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Total Price */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">الإجمالي</p>
            <p className="text-3xl font-bold text-blue-600">
              {(product.selling_price * parseFloat(quantity || '1')).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">TND</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/30"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
