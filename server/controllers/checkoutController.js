import { query } from '../config/db.js'
import { stripe, isStripeConfigured } from '../config/stripe.js'

/**
 * Creates a Stripe Checkout Session for a membership purchase.
 * Enforces server-side price calculation and creates a pending Order record.
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const { membership_id, quantity = 1 } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const membershipId = parseInt(membership_id, 10)
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1)

    if (isNaN(membershipId) || membershipId <= 0) {
      return res.status(400).json({ error: 'Valid membership_id is required.' })
    }

    // 1. Fetch official membership plan directly from database (never trust client prices)
    const membershipResult = await query(
      'SELECT id, label, title, price, suffix FROM memberships WHERE id = $1',
      [membershipId],
    )

    if (membershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Selected membership plan not found.' })
    }

    const membership = membershipResult.rows[0]

    // 2. Parse numeric amount from stored format (e.g., 'KES 8,500' -> 8500)
    const numericPrice = parseFloat(membership.price.replace(/[^0-9.]/g, ''))
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'Invalid membership plan price configuration.' })
    }

    const totalAmount = numericPrice * parsedQuantity
    const currency = 'kes'

    // Snapshot of items for the order
    const itemsSnapshot = [
      {
        membership_id: membership.id,
        label: membership.label,
        title: membership.title,
        unit_price: numericPrice,
        quantity: parsedQuantity,
        total_price: totalAmount,
      },
    ]

    // 3. Create pending Order record in database
    const orderResult = await query(
      `INSERT INTO orders (user_id, total_amount, currency, status, items)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id, user_id, total_amount, currency, status, created_at`,
      [userId, totalAmount, currency, JSON.stringify(itemsSnapshot)],
    )

    const orderId = orderResult.rows[0].id

    // 4. Create Order Item record
    await query(
      `INSERT INTO order_items (order_id, membership_id, price, quantity, label, title)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, membership.id, numericPrice, parsedQuantity, membership.label, membership.title],
    )

    // 5. Build Success & Cancel URLs
    const clientBaseUrl =
      process.env.CLIENT_URL ||
      (req.headers.origin && req.headers.origin !== 'null'
        ? req.headers.origin
        : 'http://localhost:5173')

    const successUrl = `${clientBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${clientBaseUrl}/#memberships`

    let checkoutUrl = ''
    let stripeSessionId = ''

    if (isStripeConfigured) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency,
                product_data: {
                  name: membership.label,
                  description: membership.title || undefined,
                },
                unit_amount: Math.round(numericPrice * 100),
              },
              quantity: parsedQuantity,
            },
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: req.user.email,
          metadata: {
            order_id: String(orderId),
            user_id: String(userId),
            membership_id: String(membership.id),
          },
        })

        checkoutUrl = session.url
        stripeSessionId = session.id
      } catch (stripeErr) {
        console.error('[stripe] Stripe Checkout Session creation failed:', stripeErr.message)
        // If Stripe API key rejected or network error in non-production, provide dev fallback
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[stripe] Operating in development mock fallback mode for checkout session.')
          stripeSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
          checkoutUrl = `${clientBaseUrl}/success?session_id=${stripeSessionId}`
        } else {
          throw stripeErr
        }
      }
    } else {
      // In development when STRIPE_SECRET_KEY is still placeholder
      console.warn('[stripe] STRIPE_SECRET_KEY is not set to live/test key. Using development test session.')
      stripeSessionId = `cs_test_dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      checkoutUrl = `${clientBaseUrl}/success?session_id=${stripeSessionId}`
    }

    // 6. Update order with stripe_session_id
    if (stripeSessionId) {
      await query(
        `UPDATE orders SET stripe_session_id = $1 WHERE id = $2`,
        [stripeSessionId, orderId],
      )
    }

    return res.status(200).json({
      checkoutUrl,
      sessionId: stripeSessionId,
      orderId,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles incoming Stripe Webhook events.
 * Updates order status to 'paid' or 'failed' based on Stripe lifecycle events.
 */
export async function handleStripeWebhook(req, res, next) {
  try {
    const event = req.stripeEvent || req.body

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload.' })
    }

    console.info(`[stripe-webhook] Processing event: ${event.type} (id: ${event.id || 'n/a'})`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object
        if (!session) break

        const sessionId = session.id
        const orderId = session.metadata?.order_id
        const paymentIntentId = session.payment_intent || null

        // Mark order paid by order_id or stripe_session_id
        let updateQuery = ''
        let params = []

        if (orderId) {
          updateQuery = `
            UPDATE orders
            SET status = 'paid',
                stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                stripe_session_id = COALESCE($2, stripe_session_id),
                paid_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, status, paid_at;
          `
          params = [paymentIntentId, sessionId, parseInt(orderId, 10)]
        } else if (sessionId) {
          updateQuery = `
            UPDATE orders
            SET status = 'paid',
                stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                paid_at = CURRENT_TIMESTAMP
            WHERE stripe_session_id = $2
            RETURNING id, status, paid_at;
          `
          params = [paymentIntentId, sessionId]
        }

        if (updateQuery) {
          const result = await query(updateQuery, params)
          if (result.rowCount > 0) {
            console.info(`[stripe-webhook] Order #${result.rows[0].id} marked as PAID.`)
          } else {
            console.warn(`[stripe-webhook] No matching order found for session ${sessionId} / order ${orderId}.`)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data?.object
        if (!paymentIntent) break

        const paymentIntentId = paymentIntent.id
        const orderId = paymentIntent.metadata?.order_id

        if (orderId) {
          await query(
            `UPDATE orders SET status = 'failed' WHERE id = $1 AND status = 'pending'`,
            [parseInt(orderId, 10)],
          )
        } else if (paymentIntentId) {
          await query(
            `UPDATE orders SET status = 'failed' WHERE stripe_payment_intent_id = $1 AND status = 'pending'`,
            [paymentIntentId],
          )
        }
        console.warn(`[stripe-webhook] Payment failed for intent ${paymentIntentId}.`)
        break
      }

      default:
        console.info(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    next(error)
  }
}
