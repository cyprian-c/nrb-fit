-- Migration: 001_create_orders_table.sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'kes',
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, cancelled
  stripe_session_id VARCHAR(255), -- Stripe Checkout Session ID
  stripe_payment_intent_id VARCHAR(255), -- Stripe Payment Intent ID
  items JSONB, -- Cached item snapshot for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
