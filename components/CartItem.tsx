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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-3 hover:border-blue-300 transition-all hover:shadow-md">
      {/* Product Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate text-sm">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {product.selling_price.toFixed(2)} TND/{product.unit_type}
          </p>
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => removeFromCart(product.id)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quantity Controls & Price */}
      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg shadow-sm">
          <button
            onClick={() => decrementQuantity(product.id)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-lg transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
          
          <button
            onClick={() => incrementQuantity(product.id)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-lg transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        {/* Total Price */}
        <div className="text-right">
          <div className="text-base font-bold text-blue-600">
            {totalPrice.toFixed(2)} <span className="text-xs">TND</span>
          </div>
        </div>
      </div>
    </div>
  )
}
