import { query } from '../config/db.js'

/**
 * GET /api/services - Get all active services for shopping
 * Public endpoint for listing services that can be added to cart
 */
export async function getServices(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, description, price, currency, duration_minutes, category, is_active, sort_order
         FROM services 
         WHERE is_active = true 
         ORDER BY category ASC, sort_order ASC, name ASC`
    )
    
    const services = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      currency: row.currency,
      duration_minutes: row.duration_minutes,
      category: row.category,
      is_active: row.is_active,
      sort_order: row.sort_order
    }))
    
    res.status(200).json({ services })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/cart - Get current user's active cart items
 */
export async function getCart(req, res, next) {
  try {
    const userId = req.user.id
    
    const result = await query(
      `SELECT ci.id, ci.quantity, ci.unit_price, ci.created_at,
              s.name AS service_name, s.description AS service_description,
              s.category AS service_category, s.duration_minutes
         FROM cart_items ci
         JOIN services s ON ci.service_id = s.id
         WHERE ci.user_id = $1 AND ci.status = 'active'
         ORDER BY ci.created_at DESC`,
      [userId]
    )
    
    const cartItems = result.rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      total_price: parseFloat(row.unit_price) * row.quantity,
      service: {
        id: row.service_id,
        name: row.service_name,
        description: row.service_description,
        category: row.service_category,
        duration_minutes: row.duration_minutes
      },
      created_at: row.created_at
    }))
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.total_price, 0)
    
    res.status(200).json({
      items: cartItems,
      summary: {
        item_count: cartItems.length,
        subtotal: subtotal,
        currency: 'kes'
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/cart - Add item to cart
 * Body: { service_id, quantity = 1 }
 */
export async function addToCart(req, res, next) {
  try {
    const userId = req.user.id
    const { service_id, quantity = 1 } = req.body
    
    const serviceId = parseInt(service_id, 10)
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1)
    
    if (isNaN(serviceId) || serviceId <= 0) {
      return res.status(400).json({ error: 'Valid service_id is required.' })
    }
    
    // Verify service exists and is active
    const serviceResult = await query(
      'SELECT id, name, price, description FROM services WHERE id = $1 AND is_active = true',
      [serviceId]
    )
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or inactive.' })
    }
    
    const service = serviceResult.rows[0]
    const unitPrice = parseFloat(service.price)
    
    // Upsert: update quantity if exists, insert if not
    const result = await query(`
      INSERT INTO cart_items (user_id, service_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, service_id) 
      WHERE (SELECT status FROM cart_items WHERE user_id = $1 AND service_id = $2) IN ('active', NULL)
      DO UPDATE SET quantity = GREATEST(cart_items.quantity + $3, 1), updated_at = CURRENT_TIMESTAMP
      RETURNING id, quantity, created_at`,
      [userId, serviceId, parsedQuantity, unitPrice]
    )
    
    res.status(201).json({
      cart_item: {
        id: result.rows[0].id,
        service_id: serviceId,
        quantity: result.rows[0].quantity,
        unit_price: unitPrice,
        total_price: unitPrice * result.rows[0].quantity
      }
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Item already in cart.' })
    }
    next(error)
  }
}

/**
 * PUT /api/cart/:id - Update cart item quantity
 * Body: { quantity }
 */
export async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.id
    const itemId = parseInt(req.params.id, 10)
    const { quantity } = req.body
    
    if (isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({ error: 'Valid item ID is required.' })
    }
    
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1)
    
    const result = await query(
      `UPDATE cart_items 
         SET quantity = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3 AND status = 'active'
         RETURNING id, quantity, unit_price`,
      [parsedQuantity, itemId, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' })
    }
    
    const item = result.rows[0]
    const unitPrice = parseFloat(item.unit_price)
    
    res.status(200).json({
      cart_item: {
        id: item.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/cart/:id - Remove item from cart
 */
export async function removeFromCart(req, res, next) {
  try {
    const userId = req.user.id
    const itemId = parseInt(req.params.id, 10)
    
    if (isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({ error: 'Valid item ID is required.' })
    }
    
    const result = await query(
      `UPDATE cart_items 
         SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2 AND status = 'active' 
         RETURNING id`,
      [itemId, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' })
    }
    
    res.status(200).json({ success: true, message: 'Item removed from cart.' })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/cart - Clear all active cart items for user
 */
export async function clearCart(req, res, next) {
  try {
    const userId = req.user.id
    
    const result = await query(
      `UPDATE cart_items 
         SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND status = 'active' 
         RETURNING COUNT(*)`,
      [userId]
    )
    
    const removedCount = parseInt(result.rows[0]?.count || '0', 10)
    
    res.status(200).json({ 
      success: true, 
      message: `Cleared ${removedCount} items from cart.` 
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/cart/checkout - Get cart items ready for checkout
 * Returns services array that can be passed to checkout session
 */
export async function getCartForCheckout(req, res, next) {
  try {
    const userId = req.user.id
    
    const result = await query(`
      SELECT ci.quantity, 
             s.id AS service_id, s.name, s.price,
             (s.price::DECIMAL * ci.quantity) AS total_price
      FROM cart_items ci
      JOIN services s ON ci.service_id = s.id
      WHERE ci.user_id = $1 AND ci.status = 'active'
      ORDER BY ci.created_at`,
      [userId]
    )
    
    const checkoutItems = result.rows.map(row => ({
      id: row.service_id,
      name: row.name,
      unit_price: parseFloat(row.price),
      quantity: row.quantity,
      total_price: parseFloat(row.total_price)
    }))
    
    const subtotal = checkoutItems.reduce((sum, item) => sum + item.total_price, 0)
    
    res.status(200).json({
      services: checkoutItems,
      summary: {
        subtotal,
        currency: 'kes',
        count: checkoutItems.length
      }
    })
  } catch (error) {
    next(error)
  }
}