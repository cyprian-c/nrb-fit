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

    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Stripe checkout is not configured on this server.' })
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

    // 6. Persist the membership and add-on rows against the newly created order.
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
    const clientBaseUrl = (
      process.env.CLIENT_URL ||
      (req.headers.origin && req.headers.origin !== 'null'
        ? req.headers.origin
        : 'http://localhost:5173')
    ).split(',')[0].trim().replace(/\/+$/, '')

    const successUrl = `${clientBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${clientBaseUrl}/#memberships`

    let checkoutUrl = ''
    let stripeSessionId = ''

    if (isStripeConfigured) {
      try {
        const session = await stripe.checkout.sessions.create({
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
          payment_intent_data: {
            metadata: {
              order_id: String(orderId),
              user_id: String(userId),
            },
          },
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
        await query(
          `UPDATE orders SET status = 'failed' WHERE id = $1 AND status = 'pending'`,
          [orderId],
        )
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
 * Creates a Stripe Checkout Session from the authenticated user's saved cart.
 * Product names and prices are read from the database, never from the browser.
 */
export async function createCartCheckoutSession(req, res, next) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Stripe checkout is not configured on this server.' })
    }

    const cartResult = await query(
      `SELECT ci.id AS cart_item_id, ci.service_id, ci.membership_id, ci.quantity,
              CASE WHEN ci.membership_id IS NOT NULL THEN m.label ELSE s.name END AS label,
              CASE WHEN ci.membership_id IS NOT NULL THEN m.title ELSE s.category END AS title,
              CASE WHEN ci.membership_id IS NOT NULL THEN m.price ELSE s.price END AS price
       FROM cart_items ci
       LEFT JOIN memberships m ON ci.membership_id = m.id
       LEFT JOIN services s ON ci.service_id = s.id AND s.is_active = true
       WHERE ci.user_id = $1 AND ci.status = 'active'
       ORDER BY ci.created_at ASC`,
      [userId],
    )

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' })
    }

    const items = cartResult.rows.map((row) => {
      const unitPrice = Number.parseFloat(String(row.price).replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new Error(`The price for ${row.label || 'a cart item'} is not configured correctly.`)
      }
      return {
        cart_item_id: row.cart_item_id,
        membership_id: row.membership_id,
        service_id: row.service_id,
        label: row.label,
        title: row.title || '',
        unit_price: unitPrice,
        quantity: row.quantity,
        total_price: unitPrice * row.quantity,
      }
    })
    const totalAmount = items.reduce((total, item) => total + item.total_price, 0)
    const currency = 'kes'
    const itemsSnapshot = items.map(({ cart_item_id, ...item }) => item)

    const orderResult = await query(
      `INSERT INTO orders (user_id, total_amount, currency, status, items)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id`,
      [userId, totalAmount, currency, JSON.stringify(items)],
    )
    const orderId = orderResult.rows[0].id

    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, membership_id, service_id, price, quantity, label, title)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.membership_id, item.service_id, item.unit_price, item.quantity, item.label, item.title],
      )
    }

    const clientBaseUrl = (
      process.env.CLIENT_URL ||
      (req.headers.origin && req.headers.origin !== 'null' ? req.headers.origin : 'http://localhost:5173')
    ).split(',')[0].trim().replace(/\/+$/, '')
    let session
    try {
      session = await stripe.checkout.sessions.create({
        line_items: items.map((item) => ({
          price_data: {
            currency,
            product_data: {
              name: item.label,
              description: item.title || undefined,
            },
            unit_amount: Math.round(item.unit_price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${clientBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientBaseUrl}/#memberships`,
        customer_email: req.user.email,
        payment_intent_data: {
          metadata: { order_id: String(orderId), user_id: String(userId) },
        },
        metadata: { order_id: String(orderId), user_id: String(userId), cart_checkout: 'true' },
      })
    } catch (stripeErr) {
      console.error('[stripe] Cart Checkout Session creation failed:', stripeErr.message)
      await query(
        `UPDATE orders SET status = 'failed' WHERE id = $1 AND status = 'pending'`,
        [orderId],
      )
      throw stripeErr
    }

    await query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [session.id, orderId])

    return res.status(200).json({
      orderId,
      checkoutUrl: session.url,
      sessionId: session.id,
      totalAmount,
      currency,
      items: itemsSnapshot,
    })
  } catch (error) {
    next(error)
  }
}

async function fulfillPaidCheckoutSession(session) {
  const orderId = Number.parseInt(session?.metadata?.order_id, 10)
  if (!orderId || session.payment_status !== 'paid') return null

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null

  const result = await query(
    `WITH paid_order AS (
       UPDATE orders
       SET status = 'paid', paid_at = CURRENT_TIMESTAMP, stripe_session_id = $3,
           stripe_payment_intent_id = $1
       WHERE id = $2 AND (stripe_session_id = $3 OR stripe_session_id IS NULL)
         AND status = 'pending'
         AND LOWER(currency) = LOWER($4)
         AND ROUND(total_amount * 100)::BIGINT = $5
       RETURNING id, user_id, items
     ), checked_out_cart AS (
       UPDATE cart_items ci
       SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP
       FROM paid_order po
       WHERE ci.user_id = po.user_id AND ci.status = 'active'
         AND ci.id IN (
           SELECT (line_item.item->>'cart_item_id')::INTEGER
           FROM jsonb_array_elements(po.items) AS line_item(item)
           WHERE line_item.item ? 'cart_item_id'
         )
       RETURNING ci.id
     )
     SELECT po.id, COUNT(checked_out_cart.id)::INTEGER AS checked_out_count
     FROM paid_order po
     LEFT JOIN checked_out_cart ON TRUE
     GROUP BY po.id`,
    [paymentIntentId, orderId, session.id, session.currency || '', session.amount_total],
  )

  return result.rows[0] || null
}

/** Fulfill Checkout Sessions only after Stripe confirms payment. */
export async function handleStripeWebhook(req, res, next) {
  try {
    const event = req.stripeEvent
    if (!event?.type) {
      return res.status(400).json({ error: 'A valid Stripe event is required.' })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object
        if (session?.payment_status !== 'paid') {
          console.info(`[stripe-webhook] Checkout Session ${session?.id || '(unknown)'} is not paid yet.`)
          break
        }

        const fulfilledOrder = await fulfillPaidCheckoutSession(session)
        if (fulfilledOrder) {
          console.info(`[stripe-webhook] Order #${fulfilledOrder.id} marked as PAID.`)
          break
        }

        const orderId = Number.parseInt(session?.metadata?.order_id, 10)
        const existingOrder = orderId
          ? await query('SELECT status, stripe_session_id FROM orders WHERE id = $1', [orderId])
          : { rows: [] }
        const existing = existingOrder.rows[0]

        if (existing?.status === 'paid' && existing.stripe_session_id === session.id) {
          console.info(`[stripe-webhook] Duplicate paid event for order #${orderId}.`)
          break
        }

        console.error(`[stripe-webhook] Could not reconcile paid Checkout Session ${session?.id || '(unknown)'}.`)
        return res.status(500).json({ error: 'Paid Checkout Session could not be reconciled with an order.' })
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data?.object
        if (session?.payment_status === 'paid') {
          const fulfilledOrder = await fulfillPaidCheckoutSession(session)
          if (fulfilledOrder) {
            console.info(`[stripe-webhook] Order #${fulfilledOrder.id} marked as PAID after delayed payment.`)
            break
          }

          const orderId = Number.parseInt(session?.metadata?.order_id, 10)
          const existingOrder = orderId
            ? await query('SELECT status, stripe_session_id FROM orders WHERE id = $1', [orderId])
            : { rows: [] }
          const existing = existingOrder.rows[0]
          if (existing?.status === 'paid' && existing.stripe_session_id === session.id) break

          return res.status(500).json({ error: 'Paid Checkout Session could not be reconciled with an order.' })
        }
        break
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data?.object
        const orderId = Number.parseInt(session?.metadata?.order_id, 10)
        if (orderId && session?.id) {
          await query(
            `UPDATE orders
             SET status = $1
             WHERE id = $2 AND stripe_session_id = $3 AND status = 'pending'`,
            [event.type.endsWith('.expired') ? 'cancelled' : 'failed', orderId, session.id],
          )
        }
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