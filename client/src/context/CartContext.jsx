import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchCart, fetchServices, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart, getCartForCheckout } from '../api/stripeClient.js'

const CartContext = createContext(null)

export function CartProvider({ children, onCartChanged }) {
  const { user } = useAuth()
  const userId = user?.id
  const [cartItems, setCartItems] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)

  // Load cart and services on mount or when user changes
  const loadCart = useCallback(async () => {
    if (!userId) {
      setCartItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await fetchCart()
      setCartItems(data.items || [])
    } catch (err) {
      console.error('Failed to load cart:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadServices = useCallback(async () => {
    setServicesLoading(true)
    try {
      const data = await fetchServices()
      setServices(data.services || [])
    } catch (err) {
      console.error('Failed to load services:', err)
    } finally {
      setServicesLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) {
        loadCart()
        loadServices()
      }
    })
    return () => {
      isActive = false
    }
  }, [loadCart, loadServices])

  // Notify parent when cart changes
  useEffect(() => {
    if (onCartChanged) {
      onCartChanged(cartItems.length)
    }
  }, [cartItems, onCartChanged])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.total_price || item.quantity * item.unit_price), 0)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback(async (itemType, productId, quantity = 1) => {
    try {
      await apiAddToCart(productId, quantity, itemType)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to add to cart:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart])

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      await apiUpdateCartItem(itemId, quantity)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to update cart item:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart])

  const removeItem = useCallback(async (itemId) => {
    try {
      await apiRemoveFromCart(itemId)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to remove from cart:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart])

  const clearAllItems = useCallback(async () => {
    try {
      await apiClearCart()
      setCartItems([])
      return { success: true }
    } catch (err) {
      console.error('Failed to clear cart:', err)
      return { success: false, error: err.message }
    }
  }, [])

  const getCheckoutInfo = useCallback(async () => {
    try {
      const data = await getCartForCheckout()
      return data
    } catch (err) {
      console.error('Failed to get checkout info:', err)
      return { services: [], summary: { subtotal: 0, currency: 'kes', count: 0 } }
    }
  }, [])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        services,
        loading,
        servicesLoading,
        subtotal,
        itemCount,
        addItem,
        updateItem,
        removeItem,
        clearAllItems,
        getCheckoutInfo,
        refreshCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext