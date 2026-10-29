import { query } from '../config/db.js'

/**
 * Get order by session_id (query param) or user's recent orders.
 * GET /api/orders?session_id=cs_xxx
 */
export async function getOrders(req, res, next) {
  try {
    const { session_id } = req.query
    const userId = req.user.id
    const isAdmin = req.user.role === 'admin'

    if (session_id) {
      const orderQuery = isAdmin
        ? 'SELECT * FROM orders WHERE stripe_session_id = $1'
        : 'SELECT * FROM orders WHERE stripe_session_id = $1 AND user_id = $2'
      const params = isAdmin ? [session_id] : [session_id, userId]

      const result = await query(orderQuery, params)

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' })
      }

      const orderRow = result.rows[0]
      const order = formatOrderRow(orderRow)

      return res.status(200).json({
        order,
        status: order.status,
      })
    }

    // If no session_id provided, return authenticated user's order history
    const historyQuery = isAdmin
      ? 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50'
    const historyParams = isAdmin ? [] : [userId]

    const result = await query(historyQuery, historyParams)
    const orders = result.rows.map(formatOrderRow)

    return res.status(200).json({ orders })
  } catch (error) {
    next(error)
  }
}

/**
 * Get single order by order ID.
 * GET /api/orders/:id
 */
export async function getOrderById(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10)
    const userId = req.user.id
    const isAdmin = req.user.role === 'admin'

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Valid order id is required.' })
    }

    const orderQuery = isAdmin
      ? 'SELECT * FROM orders WHERE id = $1'
      : 'SELECT * FROM orders WHERE id = $1 AND user_id = $2'
    const params = isAdmin ? [orderId] : [orderId, userId]

    const result = await query(orderQuery, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    const orderRow = result.rows[0]
    const order = formatOrderRow(orderRow)

    // Optionally retrieve order_items breakdown
    const itemsResult = await query(
      'SELECT id, membership_id, price, quantity, label, title, created_at FROM order_items WHERE order_id = $1',
      [order.id],
    )

    if (itemsResult.rows.length > 0) {
      order.order_items = itemsResult.rows.map((row) => ({
        ...row,
        price: parseFloat(row.price),
      }))
    }

    return res.status(200).json({
      order,
      status: order.status,
    })
  } catch (error) {
    next(error)
  }
}

function formatOrderRow(row) {
  let parsedItems = []
  if (row.items) {
    parsedItems = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
  }

  return {
    id: row.id,
    user_id: row.user_id,
    total_amount: parseFloat(row.total_amount),
    currency: row.currency,
    status: row.status,
    stripe_session_id: row.stripe_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    items: parsedItems,
    created_at: row.created_at,
    paid_at: row.paid_at,
  }
}
