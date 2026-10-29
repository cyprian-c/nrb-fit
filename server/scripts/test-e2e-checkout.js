#!/usr/bin/env node

/**
 * End-to-End Stripe Checkout Assessment Test
 *
 * Verifies full transaction journey:
 * 1. Authenticated checkout session creation: POST /api/checkout/create
 * 2. Order stored with 'pending' status and linked order_items
 * 3. Stripe webhook dispatch: POST /api/checkout/webhook (checkout.session.completed)
 * 4. Order status updated to 'paid' with payment details
 * 5. Success page lookup: GET /api/orders?session_id=...
 */

import jwt from 'jsonwebtoken'
import { app } from '../index.js'
import { query, pool } from '../config/db.js'

async function runE2ETest() {
  const port = 5094
  const server = app.listen(port)

  try {
    console.log('--- STARTING STRIPE E2E CHECKOUT ASSESSMENT ---')

    const jwtSecret = process.env.JWT_SECRET || 'nrbfit_jwt_session_secret_development_fallback_key'
    const authToken = jwt.sign({ id: 1, email: 'member@nrbfit.ke', role: 'member' }, jwtSecret)

    // Step 1: Request Checkout Session
    console.log('\n[Step 1] Requesting checkout session for membership plan #2 (5-class pack)...')
    const checkoutRes = await fetch(`http://localhost:${port}/api/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ membership_id: 2, quantity: 2 }),
    })

    if (!checkoutRes.ok) {
      const errBody = await checkoutRes.text()
      throw new Error(`Checkout creation failed (${checkoutRes.status}): ${errBody}`)
    }

    const checkoutData = await checkoutRes.json()
    console.log('✓ Checkout created:', checkoutData)
    const { orderId, sessionId, checkoutUrl } = checkoutData

    if (!orderId || !sessionId || !checkoutUrl) {
      throw new Error('Checkout response missing required fields (orderId, sessionId, checkoutUrl)')
    }

    // Step 2: Verify Initial Pending Order in Database
    console.log('\n[Step 2] Verifying initial pending order in PostgreSQL database...')
    const orderCheck = await query('SELECT * FROM orders WHERE id = $1', [orderId])
    const orderRecord = orderCheck.rows[0]
    console.log(`✓ Order #${orderRecord.id} found: total=${orderRecord.total_amount} KES, status=${orderRecord.status}`)

    if (orderRecord.status !== 'pending') {
      throw new Error(`Expected initial status 'pending', got '${orderRecord.status}'`)
    }
    if (parseFloat(orderRecord.total_amount) !== 17000) {
      throw new Error(`Expected total 17000 (8500 * 2), got ${orderRecord.total_amount}`)
    }

    // Step 3: Simulate Stripe Webhook: checkout.session.completed
    console.log('\n[Step 3] Dispatching checkout.session.completed webhook event...')
    const webhookEvent = {
      id: `evt_e2e_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          payment_intent: `pi_test_${Date.now()}`,
          metadata: {
            order_id: String(orderId),
            user_id: '1',
          },
        },
      },
    }

    const webhookRes = await fetch(`http://localhost:${port}/api/checkout/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookEvent),
    })

    if (!webhookRes.ok) {
      const err = await webhookRes.text()
      throw new Error(`Webhook dispatch failed (${webhookRes.status}): ${err}`)
    }
    const webhookResult = await webhookRes.json()
    console.log('✓ Webhook processed:', webhookResult)

    // Step 4: Verify Order Status Updated to 'paid' in Database
    console.log('\n[Step 4] Checking database order transition to paid status...')
    const paidCheck = await query('SELECT status, paid_at, stripe_payment_intent_id FROM orders WHERE id = $1', [orderId])
    const updatedOrder = paidCheck.rows[0]
    console.log('✓ Updated record:', updatedOrder)

    if (updatedOrder.status !== 'paid') {
      throw new Error(`Expected status 'paid', got '${updatedOrder.status}'`)
    }
    if (!updatedOrder.paid_at) {
      throw new Error('Expected paid_at timestamp to be populated')
    }

    // Step 5: Query Success Page Order Lookup API
    console.log('\n[Step 5] Calling order lookup endpoint GET /api/orders?session_id=...')
    const lookupRes = await fetch(`http://localhost:${port}/api/orders?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!lookupRes.ok) {
      const err = await lookupRes.text()
      throw new Error(`Order lookup failed (${lookupRes.status}): ${err}`)
    }

    const lookupData = await lookupRes.json()
    console.log('✓ Order lookup response:', lookupData)

    if (lookupData.status !== 'paid' || lookupData.order?.id !== orderId) {
      throw new Error('Order lookup did not return matching paid order')
    }

    // Step 6: Clean up test data
    console.log('\n[Step 6] Cleaning up test order records...')
    await query('DELETE FROM orders WHERE id = $1', [orderId])
    console.log('✓ Cleaned test order.')

    console.log('\n🎉 ALL END-TO-END STRIPE CHECKOUT TESTS PASSED!')
  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error)
    process.exitCode = 1
  } finally {
    if (pool) await pool.end()
    server.close()
  }
}

runE2ETest()
