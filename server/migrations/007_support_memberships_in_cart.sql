-- Allow a cart row to represent either a membership plan or a service add-on.
ALTER TABLE cart_items
  ALTER COLUMN service_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS membership_id INTEGER REFERENCES memberships(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cart_items_one_product_check'
      AND conrelid = 'cart_items'::regclass
  ) THEN
    ALTER TABLE cart_items
      ADD CONSTRAINT cart_items_one_product_check
      CHECK ((service_id IS NOT NULL) <> (membership_id IS NOT NULL));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_active_membership_per_user
  ON cart_items(user_id, membership_id)
  WHERE status = 'active' AND membership_id IS NOT NULL;