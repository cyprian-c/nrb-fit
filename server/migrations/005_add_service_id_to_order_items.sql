-- Migration: 005_add_service_id_to_order_items.sql
-- Add service_id column to order_items for tracking custom add-ons

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id);

-- Also update the index to include service_id
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);