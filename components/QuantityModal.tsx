import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/supabase'

type QuantityModalProps = {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onAdd: (quantity: number, unitQuantity?: number) => void
}

export default function QuantityModal({ isOpen, product, onClose, onAdd }: QuantityModalProps) {
  const [quantity, setQuantity] = useState('1')
  const [unitQuantity, setUnitQuantity] = useState('1')
  
  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
      setUnitQuantity('1')
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const handleAdd = () => {
    const qty = parseInt(quantity, 10)
    
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity')
      return
    }
    
    // Each item is 1 unit (simplified - no separate unit quantity)
    onAdd(qty, 1)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  const showUnitQuantity = product.unit_type !== 'item'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {product.selling_price.toFixed(2)} TND per {product.unit_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Product Image */}
        {product.image_url && (
          <div className="mb-3 sm:mb-4 relative w-full h-24 sm:h-32">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {/* Quantity Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              الكمية
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setQuantity(String(Math.max(1, parseInt(quantity || '1') - 1)))}
                className="bg-gray-200 hover:bg-gray-300 w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-lg sm:text-xl font-bold active:scale-95 transition"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg h-10 sm:h-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              <button
                onClick={() => setQuantity(String(parseInt(quantity || '1') + 1))}
                className="bg-gray-200 hover:bg-gray-300 w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-lg sm:text-xl font-bold active:scale-95 transition"
              >
                +
              </button>
            </div>
            {showUnitQuantity && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                كل عنصر يساوي 1 {product.unit_type}
              </p>
            )}
          </div>

          {/* Total Price Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-700">السعر الإجمالي:</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                {(
                  product.selling_price *
                  parseInt(quantity || '1')
                ).toFixed(2)} TND
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 text-center">
              {quantity} × {product.selling_price.toFixed(2)} دينار لكل {product.unit_type}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base font-medium transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base font-medium transition"
          >
            إضافة إلى السلة
          </button>
        </div>
      </div>
    </div>
  )
}
