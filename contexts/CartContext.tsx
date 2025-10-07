import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Product } from '@/lib/supabase'

export type CartItem = {
  product: Product
  quantity: number
  totalPrice: number
  unitQuantity?: number // For weight/volume based items (kg, l, etc.)
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number, unitQuantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number, unitQuantity?: number) => void
  incrementQuantity: (productId: string) => void
  decrementQuantity: (productId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getItemTotalPrice: (productId: string) => number
  getTotalItems: () => number
  getFormattedUnitLabel: (unitType: string, quantity: number) => string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  // Calculate total price for an item based on quantity and unit type
  const calculateItemTotalPrice = (product: Product, quantity: number, unitQuantity?: number): number => {
    // For unit-based items (each, item), the total is simply price * quantity
    if (product.unit_type === 'item' || !unitQuantity) {
      return product.selling_price * quantity
    } 
    // For weight/volume items, calculate based on unit quantity
    else {
      return product.selling_price * quantity * unitQuantity
    }
  }

  const addToCart = (product: Product, quantity: number = 1, unitQuantity?: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      
      // Default unit quantity to 1 if not provided
      const actualUnitQuantity = unitQuantity || 1
      
      // Calculate the total price for this item
      const totalPrice = calculateItemTotalPrice(product, quantity, actualUnitQuantity)
      
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                unitQuantity: actualUnitQuantity, 
                totalPrice: existingItem.totalPrice + totalPrice 
              }
            : item
        )
      }
      return [...prevCart, { 
        product, 
        quantity, 
        unitQuantity: actualUnitQuantity, 
        totalPrice 
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number, unitQuantity?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const actualUnitQuantity = unitQuantity !== undefined ? unitQuantity : (item.unitQuantity || 1)
          const totalPrice = calculateItemTotalPrice(item.product, quantity, actualUnitQuantity)
          
          return { 
            ...item, 
            quantity,
            unitQuantity: actualUnitQuantity,
            totalPrice 
          }
        }
        return item
      })
    })
  }
  
  const incrementQuantity = (productId: string) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + 1
          const totalPrice = calculateItemTotalPrice(
            item.product, 
            newQuantity, 
            item.unitQuantity
          )
          
          return { 
            ...item, 
            quantity: newQuantity,
            totalPrice 
          }
        }
        return item
      })
    })
  }
  
  const decrementQuantity = (productId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find(item => item.product.id === productId)
      
      if (item && item.quantity <= 1) {
        return prevCart.filter(item => item.product.id !== productId)
      }
      
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity - 1)
          const totalPrice = calculateItemTotalPrice(
            item.product, 
            newQuantity, 
            item.unitQuantity
          )
          
          return { 
            ...item, 
            quantity: newQuantity,
            totalPrice 
          }
        }
        return item
      })
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0)
  }
  
  const getItemTotalPrice = (productId: string): number => {
    const item = cart.find(item => item.product.id === productId)
    return item ? item.totalPrice : 0
  }
  
  // Format unit label based on unit type and quantity
  const getFormattedUnitLabel = (unitType: string, quantity: number): string => {
    switch (unitType) {
      case 'kg':
        return quantity === 1 ? 'kg' : 'kgs'
      case 'g':
        return 'g'
      case 'l':
        return quantity === 1 ? 'liter' : 'liters'
      case 'ml':
        return 'ml'
      case 'item':
      default:
        return quantity === 1 ? 'item' : 'items'
    }
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        getTotalPrice,
        getItemTotalPrice,
        getTotalItems,
        getFormattedUnitLabel,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
