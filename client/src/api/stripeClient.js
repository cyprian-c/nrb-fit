import { apiFetch } from './client.js'

/**
 * Creates a Stripe Checkout Session for the selected membership plan.
 * Returns { checkoutUrl, sessionId, orderId }
 */
export async function createCheckoutSession(membershipId, quantity = 1) {
  return apiFetch('/checkout/create', {
    method: 'POST',
    body: { membership_id: membershipId, quantity },
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
