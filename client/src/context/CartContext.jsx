import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchCart, fetchServices, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart, getCartForCheckout } from '../api/stripeClient.js'

const CartContext = createContext(null)
const guestCartStorageKey = 'nrbfit_guest_cart'

function readGuestCart() {
  try {
    const storedItems = JSON.parse(window.localStorage.getItem(guestCartStorageKey) || '[]')
    return Array.isArray(storedItems) ? storedItems : []
  } catch {
    return []
  }
}

function saveGuestCart(items) {
  try {
    window.localStorage.setItem(guestCartStorageKey, JSON.stringify(items))
  } catch {
    // Keep the in-memory basket usable if browser storage is unavailable.
  }
}

function getLocalPrice(product) {
  const price = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
  return Number.isFinite(price) ? price : 0
}

export function CartProvider({ children, onCartChanged }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id
  const [cartItems, setCartItems] = useState(readGuestCart)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(true)

  // Load cart and services on mount or when user changes
  const loadCart = useCallback(async () => {
    if (!userId) {
      setCartItems(readGuestCart())
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
      if (!isActive || authLoading) return

      if (!userId) {
        setCartItems(readGuestCart())
        setLoading(false)
        return
      }

      async function loadMemberCart() {
        setLoading(true)
        const guestItems = readGuestCart()
        try {
          for (let index = 0; index < guestItems.length; index += 1) {
            const guestItem = guestItems[index]
            await apiAddToCart(guestItem.product_id, guestItem.quantity, guestItem.item_type)
            saveGuestCart(guestItems.slice(index + 1))
          }

          const data = await fetchCart()
          if (isActive) setCartItems(data.items || [])
        } catch (err) {
          console.error('Failed to sync guest cart:', err)
          if (isActive) setCartItems(readGuestCart())
        } finally {
          if (isActive) setLoading(false)
        }
      }

      loadMemberCart()
    })
    return () => {
      isActive = false
    }
  }, [authLoading, userId])

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) loadServices()
    })
    return () => {
      isActive = false
    }
  }, [loadServices])

  // Notify parent when cart changes
  useEffect(() => {
    if (onCartChanged) {
      onCartChanged(cartItems.length)
    }
  }, [cartItems, onCartChanged])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.total_price || item.quantity * item.unit_price), 0)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback(async (itemType, productId, quantity = 1, product = null) => {
    if (!userId) {
      const currentItems = readGuestCart()
      const existingItem = currentItems.find((item) => item.item_type === itemType && item.product_id === productId)

      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, 99)
      } else {
        const unitPrice = getLocalPrice(product || {})
        currentItems.push({
          id: `guest:${itemType}:${productId}`,
          item_type: itemType,
          product_id: productId,
          name: product?.label || product?.name || product?.title || 'Studio item',
          description: product?.description || '',
          category: product?.category || product?.suffix || '',
          unit_price: unitPrice,
          quantity: Math.min(quantity, 99),
          total_price: unitPrice * Math.min(quantity, 99),
        })
      }

      const updatedItems = currentItems.map((item) => ({
        ...item,
        total_price: item.unit_price * item.quantity,
      }))
      saveGuestCart(updatedItems)
      setCartItems(updatedItems)
      return { success: true }
    }

    try {
      await apiAddToCart(productId, quantity, itemType)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to add to cart:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart, userId])

  const updateItem = useCallback(async (itemId, quantity) => {
    if (!userId) {
      const updatedItems = readGuestCart()
        .map((item) => item.id === itemId
          ? { ...item, quantity, total_price: item.unit_price * quantity }
          : item)
        .filter((item) => item.quantity > 0)
      saveGuestCart(updatedItems)
      setCartItems(updatedItems)
      return { success: true }
    }

    try {
      await apiUpdateCartItem(itemId, quantity)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to update cart item:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart, userId])

  const removeItem = useCallback(async (itemId) => {
    if (!userId) {
      const updatedItems = readGuestCart().filter((item) => item.id !== itemId)
      saveGuestCart(updatedItems)
      setCartItems(updatedItems)
      return { success: true }
    }

    try {
      await apiRemoveFromCart(itemId)
      await loadCart()
      return { success: true }
    } catch (err) {
      console.error('Failed to remove from cart:', err)
      return { success: false, error: err.message }
    }
  }, [loadCart, userId])

  const clearAllItems = useCallback(async () => {
    if (!userId) {
      saveGuestCart([])
      setCartItems([])
      return { success: true }
    }

    try {
      await apiClearCart()
      setCartItems([])
      return { success: true }
    } catch (err) {
      console.error('Failed to clear cart:', err)
      return { success: false, error: err.message }
    }
  }, [userId])

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