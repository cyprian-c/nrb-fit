# Stripe Checkout & Webhook Integration Guide

This guide details the architecture, setup instructions, test-versus-production differences, and deployment configuration for NRBFIT's Stripe e-commerce checkout integration.

---

## 1. Environment Keys: Test vs Production

Stripe provides two environments with distinct API keys:

| Environment | Secret Key Prefix | Publishable Key Prefix | Webhook Secret Prefix | Purpose |
|---|---|---|---|---|
| **Test Mode** | `sk_test_...` | `pk_test_...` | `whsec_...` | Development, CI/CD, and staging with dummy cards |
| **Live / Production** | `sk_live_...` | `pk_live_...` | `whsec_...` | Live member charges and real currency (KES) |

### Key Differences
- **Card Testing**: In test mode, use Stripe's test card `4242 4242 4242 4242` with any future expiry date and 3-digit CVC. In live mode, real Visa/MasterCard payments are processed.
- **Webhook Secrets**: Each webhook endpoint registered in the Stripe Dashboard generates a unique signing secret starting with `whsec_`. The webhook secret used for local CLI testing is different from the production Dashboard webhook secret.
- **Data Isolation**: Test mode transactions, sessions, and payment intents never touch live banking rails or affect production financial reports.

---

## 2. Server Configuration Variables

Add the following variables to `.env` (or environment configuration in production hosting / Phusion Passenger):

```env
# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend Origin (Used for Success and Cancel redirects)
CLIENT_URL=https://nrbfit.cyprian.services
```

---

## 3. Webhook Deployment Configuration

### Production Webhook Registration
1. Sign in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Navigate to **Developers > Webhooks**.
3. Click **Add endpoint**.
4. Set Endpoint URL to:
   ```
   https://nrbfit.cyprian.services/api/checkout/webhook
   ```
5. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
6. Click **Add endpoint** and copy the **Signing secret** (`whsec_...`).
7. Paste this secret into your production `STRIPE_WEBHOOK_SECRET` environment variable.

---

## 4. Local Development & Webhook Forwarding

To test webhooks locally using the Stripe CLI:

```bash
# 1. Start your local server
npm run dev

# 2. In another terminal, forward Stripe events to your local API
stripe listen --forward-to localhost:5000/api/checkout/webhook

# 3. Trigger a test event or run the automated test suite
npm --workspace=server run test:webhook
```

---

## 5. End-to-End Transaction Flow

1. **User Action**: The member clicks **"Buy Now"** on any membership pricing card (e.g. 5-class pack for KES 8,500).
2. **Authentication Gate**: If unauthenticated, the modal prompts the user to sign in or register.
3. **Session Creation**: The frontend sends `POST /api/checkout/create` with `{ membership_id, quantity }`. The server verifies pricing directly in the database, inserts an `orders` record (`status: pending`) and `order_items` record, and requests a Stripe Checkout Session.
4. **Checkout**: The member is redirected to Stripe Checkout hosted page.
5. **Payment**: Member completes payment with test card `4242 4242 4242 4242`.
6. **Webhook Fulfillment**: Stripe dispatches `checkout.session.completed` to `/api/checkout/webhook`. The server validates the cryptographic HMAC signature, sets order `status: 'paid'`, and records `paid_at`.
7. **Confirmation**: Member is redirected to `/success?session_id=cs_...`. The frontend polls `GET /api/orders?session_id=cs_...` and displays the confirmed receipt.
