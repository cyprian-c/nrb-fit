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
            `SELECT ci.id, ci.service_id, ci.membership_id, ci.quantity, ci.unit_price, ci.created_at,
              COALESCE(s.name, m.label) AS item_name,
              COALESCE(s.description, m.description) AS item_description,
              COALESCE(s.category, m.suffix) AS item_category,
              s.duration_minutes
         FROM cart_items ci
         LEFT JOIN services s ON ci.service_id = s.id
         LEFT JOIN memberships m ON ci.membership_id = m.id
         WHERE ci.user_id = $1 AND ci.status = 'active'
         ORDER BY ci.created_at DESC`,
      [userId]
    )
    
    const cartItems = result.rows.map(row => ({
      id: row.id,
      item_type: row.membership_id ? 'membership' : 'service',
      product_id: row.membership_id || row.service_id,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      total_price: parseFloat(row.unit_price) * row.quantity,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      duration_minutes: row.duration_minutes,
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
    const { service_id, membership_id, quantity = 1 } = req.body
    const hasService = service_id !== undefined
    const hasMembership = membership_id !== undefined
    const productId = Number.parseInt(hasMembership ? membership_id : service_id, 10)
    const parsedQuantity = Number.parseInt(quantity, 10)

    if (hasService === hasMembership || !Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Provide exactly one valid service_id or membership_id.' })
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 99) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 99.' })
    }

    const productColumn = hasMembership ? 'membership_id' : 'service_id'
    const conflictPredicate = hasMembership
      ? "status = 'active' AND membership_id IS NOT NULL"
      : "status = 'active'"
    const productResult = await query(
      hasMembership
        ? 'SELECT id, label AS name, description, price FROM memberships WHERE id = $1'
        : 'SELECT id, name, description, price FROM services WHERE id = $1 AND is_active = true',
      [productId],
    )

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or inactive.' })
    }

    const product = productResult.rows[0]
    const unitPrice = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ error: 'Product price is not configured correctly.' })
    }

    const result = await query(
      `INSERT INTO cart_items (user_id, ${productColumn}, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, ${productColumn}) WHERE ${conflictPredicate}
       DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
                     unit_price = EXCLUDED.unit_price,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING id, quantity, created_at`,
      [userId, productId, parsedQuantity, unitPrice],
    )

    res.status(201).json({
      cart_item: {
        id: result.rows[0].id,
        item_type: hasMembership ? 'membership' : 'service',
        product_id: productId,
        name: product.name,
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
    
    const parsedQuantity = Number.parseInt(quantity, 10)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 99) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 99.' })
    }
    
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
         RETURNING id`,
      [userId]
    )
    
    const removedCount = result.rowCount
    
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
              ci.service_id, ci.membership_id,
              COALESCE(s.id, m.id) AS product_id,
              CASE WHEN ci.membership_id IS NOT NULL THEN 'membership' ELSE 'service' END AS item_type,
              COALESCE(s.name, m.label) AS name,
              ci.unit_price AS price,
              (ci.unit_price * ci.quantity) AS total_price
      FROM cart_items ci
            LEFT JOIN services s ON ci.service_id = s.id
            LEFT JOIN memberships m ON ci.membership_id = m.id
      WHERE ci.user_id = $1 AND ci.status = 'active'
      ORDER BY ci.created_at`,
      [userId]
    )
    
    const checkoutItems = result.rows.map(row => ({
      id: row.product_id,
      item_type: row.item_type,
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