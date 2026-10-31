-- Migration: 004_create_cart_items_table.sql
-- Shopping cart items for users to select services before checkout

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, removed, checked_out
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cart_items_user_status ON cart_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cart_items_service ON cart_items(service_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

-- Ensure user can only have one active item per service
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_active_per_user 
ON cart_items(user_id, service_id) 
WHERE status = 'active';