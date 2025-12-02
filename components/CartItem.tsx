import { CartItem as CartItemType } from '@/contexts/CartContext'
import { useCart } from '@/contexts/CartContext'

type CartItemProps = {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { product, quantity } = item
  const { removeFromCart, incrementQuantity, decrementQuantity } = useCart()
  
  const totalPrice = item.totalPrice

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Quantity Controls - Left Side */}
        <div className="flex flex-col items-center bg-gray-50 rounded-lg overflow-hidden">
          <button
            onClick={() => incrementQuantity(product.id)}
            className="w-8 h-7 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="w-8 h-7 flex items-center justify-center font-bold text-sm bg-white border-y border-gray-100">{quantity}</span>
          <button
            onClick={() => decrementQuantity(product.id)}
            className="w-8 h-7 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Product Info - Middle */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{product.selling_price.toFixed(2)} × {quantity}</p>
        </div>

        {/* Price & Remove - Right Side */}
        <div className="flex flex-col items-end gap-1">
          <span className="font-bold text-blue-600 text-sm">{totalPrice.toFixed(2)}</span>
          <button
            onClick={() => removeFromCart(product.id)}
            className="text-gray-300 hover:text-red-500 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
