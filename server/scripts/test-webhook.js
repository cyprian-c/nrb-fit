#!/usr/bin/env node

/**
 * Stripe Webhook Local Test Runner
 *
 * Simulates Stripe CLI webhook delivery:
 * 1. Creates a pending order in PostgreSQL
 * 2. Generates a signed checkout.session.completed event (with HMAC-SHA256 signature)
 * 3. Sends the event to /api/checkout/webhook
 * 4. Verifies the order status is updated to 'paid'
 */

import crypto from 'node:crypto'
import { app } from '../index.js'
import { query, pool } from '../config/db.js'

async function runWebhookTest() {
  const port = 5096
  const server = app.listen(port)

  try {
    console.log('[test-webhook] 1. Creating pending test order in database...')
    const orderRes = await query(
      `INSERT INTO orders (user_id, total_amount, currency, status, stripe_session_id)
       VALUES (1, 8500.00, 'kes', 'pending', 'cs_test_cli_runner_${Date.now()}')
       RETURNING id, stripe_session_id`
    )
    const testOrder = orderRes.rows[0]
    console.log(`[test-webhook] Created test order #${testOrder.id} (${testOrder.stripe_session_id})`)

    console.log('[test-webhook] 2. Constructing checkout.session.completed event...')
    const payload = JSON.stringify({
      id: `evt_cli_${Date.now()}`,
      object: 'event',
      api_version: '2024-12-18.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: testOrder.stripe_session_id,
          object: 'checkout.session',
          amount_total: 850000,
          currency: 'kes',
          payment_status: 'paid',
          payment_intent: `pi_test_${Date.now()}`,
          metadata: {
            order_id: String(testOrder.id),
          },
        },
      },
    })

    const timestamp = Math.floor(Date.now() / 1000)
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'
    const signedPayload = `${timestamp}.${payload}`
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    const header = `t=${timestamp},v1=${signature}`

    console.log('[test-webhook] 3. Sending webhook to http://localhost:' + port + '/api/checkout/webhook ...')
    const response = await fetch(`http://localhost:${port}/api/checkout/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': header,
      },
      body: payload,
    })

    console.log(`[test-webhook] Response status: ${response.status}`)
    const json = await response.json()
    console.log('[test-webhook] Response body:', json)

    console.log('[test-webhook] 4. Verifying order status in database...')
    const verifyRes = await query(
      `SELECT id, status, stripe_payment_intent_id, paid_at FROM orders WHERE id = $1`,
      [testOrder.id]
    )

    const updatedOrder = verifyRes.rows[0]
    console.log('[test-webhook] Updated order in DB:', updatedOrder)

    if (updatedOrder.status !== 'paid') {
      throw new Error(`Expected order status to be 'paid', received '${updatedOrder.status}'`)
    }

    console.log('[test-webhook] 5. Cleaning up test order...')
    await query(`DELETE FROM orders WHERE id = $1`, [testOrder.id])

    console.log('✅ Webhook test completed successfully. Order status updated from pending to paid.')
  } catch (error) {
    console.error('❌ Webhook test failed:', error)
    process.exitCode = 1
  } finally {
    if (pool) await pool.end()
    server.close()
  }
}

runWebhookTest()
