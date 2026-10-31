import { apiFetch } from './client.js'

/**
 * Creates a Stripe Checkout Session for the selected membership plan.
 * Returns { checkoutUrl, sessionId, orderId }
 */
export async function createCheckoutSession(membershipId, quantity = 1, services = []) {
  return apiFetch('/checkout/create', {
    method: 'POST',
    body: { membership_id: membershipId, quantity, services },
  })
}

/**
 * Creates a Stripe Checkout Session for cart items (memberships + services)
 * Returns { checkoutUrl, sessionId, orderId }
 */
export async function createCartCheckoutSession() {
  return apiFetch('/checkout/cart', {
    method: 'POST',
  })
}

/**
 * Look up order status by Stripe Session ID or Order ID
 */
export async function fetchOrder(params = {}) {
  const queryParam = typeof params === 'object'
    ? '?' + new URLSearchParams(params).toString()
    : `/${params}`
  return apiFetch(`/orders${queryParam}`)
}

/**
 * Get all available services (CAT - Custom Add-ons)
 * Public endpoint
 */
export async function fetchServices() {
  return apiFetch('/cart/services')
}

/**
 * Get current user's cart
 */
export async function fetchCart() {
  return apiFetch('/cart')
}

/**
 * Add item to cart
 */
export async function addToCart(productId, quantity = 1, itemType = 'service') {
  return apiFetch('/cart', {
    method: 'POST',
    body: {
      [itemType === 'membership' ? 'membership_id' : 'service_id']: productId,
      quantity,
    },
  })
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(itemId, quantity) {
  return apiFetch(`/cart/${itemId}`, {
    method: 'PUT',
    body: { quantity },
  })
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId) {
  return apiFetch(`/cart/${itemId}`, {
    method: 'DELETE',
  })
}

/**
 * Clear all cart items
 */
export async function clearCart() {
  return apiFetch('/cart', {
    method: 'DELETE',
  })
}

/**
 * Get cart ready for checkout (services to include)
 */
export async function getCartForCheckout() {
  return apiFetch('/cart/checkout')
}