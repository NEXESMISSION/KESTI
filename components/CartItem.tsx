import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CartItem as CartItemType } from '@/contexts/CartContext'
import { useCart } from '@/contexts/CartContext'

type CartItemProps = {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { product, quantity, unitQuantity } = item
  const [quantityInput, setQuantityInput] = useState<string>(quantity.toString())
  const [unitQuantityInput, setUnitQuantityInput] = useState<string>(
    (unitQuantity || 1).toString()
  )
  
  // Sync quantityInput with actual cart quantity when it changes from buttons
  useEffect(() => {
    setQuantityInput(quantity.toString())
  }, [quantity])
  
  // Sync unitQuantityInput with actual cart unitQuantity
  useEffect(() => {
    setUnitQuantityInput((unitQuantity || 1).toString())
  }, [unitQuantity])

  const { 
    removeFromCart, 
    updateQuantity, 
    incrementQuantity, 
    decrementQuantity, 
    getFormattedUnitLabel 
  } = useCart()

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuantityInput(newValue)

    const parsedValue = parseInt(newValue, 10)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      updateQuantity(product.id, parsedValue, parseFloat(unitQuantityInput))
    }
  }

  const handleUnitQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setUnitQuantityInput(newValue)

    const parsedValue = parseFloat(newValue)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      updateQuantity(product.id, quantity, parsedValue)
    }
  }

  const handleRemoveItem = () => {
    removeFromCart(product.id)
  }

  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)} TND`
  }

  const unitLabel = getFormattedUnitLabel(product.unit_type, quantity)
  const showUnitQuantity = product.unit_type !== 'item'
  const itemPrice = product.selling_price
  const totalPrice = item.totalPrice

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      {/* Product Header with Image */}
      <div className="flex gap-3 mb-3">
        {/* Product Image */}
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500">
            {formatPrice(itemPrice)} / {product.unit_type}
          </p>
          {showUnitQuantity && (
            <p className="text-xs text-gray-400 mt-1">
              {quantity} orders × {unitQuantity} {product.unit_type}
            </p>
          )}
        </div>

        {/* Total Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-blue-600">
            {formatPrice(totalPrice)}
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-3">
        {/* Quantity Buttons */}
        <div className="flex items-center bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => decrementQuantity(product.id)}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-lg active:bg-gray-300 transition text-xl font-bold"
            aria-label="Decrease quantity"
          >
            −
          </button>
          
          <input
            type="text"
            value={quantityInput}
            onChange={handleQuantityChange}
            className="w-12 h-10 bg-transparent text-center font-semibold border-0 focus:ring-0 text-gray-900"
            aria-label="Quantity"
          />
          
          <button
            type="button"
            onClick={() => incrementQuantity(product.id)}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-lg active:bg-gray-300 transition text-xl font-bold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        
        <span className="text-sm text-gray-600">
          {unitLabel}
        </span>

        {/* Unit Quantity Input (for weight/volume) */}
        {showUnitQuantity && (
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="number"
              value={unitQuantityInput}
              onChange={handleUnitQuantityChange}
              className="w-20 h-10 text-center font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.1"
              min="0.01"
              aria-label={`Amount in ${product.unit_type}`}
            />
            <span className="text-sm text-gray-600">
              {product.unit_type}
            </span>
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={handleRemoveItem}
          className="ml-auto bg-red-50 hover:bg-red-100 text-red-600 px-3 h-10 rounded-lg font-medium transition active:bg-red-200"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
