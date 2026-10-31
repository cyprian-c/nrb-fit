import { query } from '../config/db.js'
import { stripe, isStripeConfigured } from '../config/stripe.js'

/**
 * Creates a Stripe Checkout Session for a membership purchase.
 * Enforces server-side price calculation and creates a pending Order record.
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const { membership_id, quantity = 1, services = [] } = req.body
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

    const membershipTotal = numericPrice * parsedQuantity
    const currency = 'kes'

    // 3. Fetch service items from cart (if any)
    let servicesTotal = 0
    const serviceItems = []

    if (services && services.length > 0) {
      const serviceIds = services.map(s => parseInt(s, 10)).filter(id => !isNaN(id))
      if (serviceIds.length > 0) {
        // Get active services with their prices
        const servicesResult = await query(
          `SELECT id, name, price, category FROM services WHERE id = ANY($1) AND is_active = true`,
          [serviceIds]
        )

        for (const row of servicesResult.rows) {
          const servicePrice = parseFloat(row.price)
          if (!isNaN(servicePrice) && servicePrice > 0) {
            const qty = parsedQuantity // Same quantity as membership (or could be custom)
            const itemTotal = servicePrice * qty
            servicesTotal += itemTotal
            
            serviceItems.push({
              service_id: row.id,
              label: row.name,
              title: row.category || 'Service',
              unit_price: servicePrice,
              quantity: qty,
              total_price: itemTotal,
            })

            // Add to order_items
            await query(
              `INSERT INTO order_items (order_id, service_id, price, quantity, label, title)
               VALUES (0, $1, $2, $3, $4, $5)`, // order_id will be updated
              [row.id, servicePrice, qty, row.name, row.category || 'Service'],
            )
          }
        }
      }
    }

    const totalAmount = membershipTotal + servicesTotal

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than zero.' })
    }

    // 4. Snapshot of items for the order
    const itemsSnapshot = [
      {
        membership_id: membership.id,
        label: membership.label,
        title: membership.title,
        unit_price: numericPrice,
        quantity: parsedQuantity,
        total_price: membershipTotal,
      },
      ...serviceItems.map(item => ({
        membership_id: null,
        service_id: item.service_id,
        label: item.label,
        title: item.title,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
      })),
    ]

    // 5. Create pending Order record in database
    const orderResult = await query(
      `INSERT INTO orders (user_id, total_amount, currency, status, items)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id, user_id, total_amount, currency, status, created_at`,
      [userId, totalAmount, currency, JSON.stringify(itemsSnapshot)],
    )

    const orderId = orderResult.rows[0].id

    // 6. Update order_items with correct order_id
    await query(
      `INSERT INTO order_items (order_id, membership_id, price, quantity, label, title)
       VALUES ${serviceItems.map((_, i) => `(${i + 1}${','.repeat(6)}),`).slice(0, -1).join('')}
       ON CONFLICT DO NOTHING`,
      // If there are items, we need to insert them properly
    )

    // 6b. Insert membership order item
    await query(
      `INSERT INTO order_items (order_id, membership_id, price, quantity, label, title)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, membership.id, numericPrice, parsedQuantity, membership.label, membership.title],
    )

    // 6c. Insert service order items
    for (const item of serviceItems) {
      await query(
        `INSERT INTO order_items (order_id, service_id, price, quantity, label, title)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.service_id, item.unit_price, item.quantity, item.label, item.title],
      )
    }

    // 7. Build Success & Cancel URLs
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
            ...serviceItems.map(item => ({
              price_data: {
                currency,
                product_data: {
                  name: item.label,
                  description: item.title,
                },
                unit_amount: Math.round(item.unit_price * 100),
              },
              quantity: item.quantity,
            })),
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: req.user.email,
          metadata: {
            order_id: String(orderId),
            user_id: String(userId),
            membership_id: String(membership.id),
            services: services.length > 0 ? services.join(',') : '',
          },
        })

        checkoutUrl = session.url
        stripeSessionId = session.id
      } catch (stripeErr) {
        console.error('[stripe] Stripe Checkout Session creation failed:', stripeErr.message)
        // Re-throw to trigger error handler which rolls back
        throw stripeErr
      }
    }

    // 8. Update order with Stripe session ID
    await query(
      `UPDATE orders SET stripe_session_id = $1 WHERE id = $2`,
      [stripeSessionId, orderId]
    )

    res.status(200).json({
      orderId,
      checkoutUrl,
      sessionId: stripeSessionId,
      totalAmount,
      currency,
      items: itemsSnapshot,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handle Stripe webhook events for checkout session completion.
 */
export async function handleStripeWebhook(req, res, next) {
  try {
    const { event } = req

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object
        const sessionId = session?.id
        const orderId = parseInt(session?.metadata?.order_id, 10)
        const paymentIntentId = session?.payment_intent

        if (orderId) {
          const result = await query(
            `UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, stripe_payment_intent_id = $1 WHERE id = $2`,
            [paymentIntentId, orderId],
          )

          if (result.rowCount > 0) {
            console.info(`[stripe-webhook] Order #${orderId} marked as PAID.`)
          } else {
            console.warn(`[stripe-webhook] No order found with ID ${orderId}.`)
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data?.object
        const paymentIntentId = paymentIntent.id
        const orderId = parseInt(paymentIntent.metadata?.order_id, 10)

        if (orderId) {
          const result = await query(
            `UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending'`,
            [orderId],
          )

          if (result.rowCount > 0) {
            console.info(`[stripe-webhook] Order #${orderId} marked as PAID via Payment Intent.`)
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