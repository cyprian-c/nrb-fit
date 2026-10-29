import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe.js'

/**
 * Middleware to verify incoming Stripe webhook signatures.
 * Requires the raw body Buffer stored on req.rawBody or raw payload.
 */
export function verifyStripeWebhook(req, res, next) {
  const signature = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe-Signature header.' })
  }

  const rawPayload = req.rawBody || req.body

  if (!webhookSecret) {
    console.warn('[stripe] STRIPE_WEBHOOK_SECRET is not configured.')
    return res.status(500).json({ error: 'Stripe webhook secret is not configured on the server.' })
  }

  try {
    const event = stripe.webhooks.constructEvent(rawPayload, signature, webhookSecret)
    req.stripeEvent = event
    next()
  } catch (err) {
    console.error('[stripe] Webhook signature verification error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }
}
