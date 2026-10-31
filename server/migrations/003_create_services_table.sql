-- Migration: 003_create_services_table.sql
-- Services (Custom Add-ons / "CAT") that users can add to their orders

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'kes',
  duration_minutes INTEGER,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);

-- Sample seed data for services (CAT - Custom Add-ons / Trials)
INSERT INTO services (name, description, price, currency, duration_minutes, category, is_active) VALUES
  ('Personal Training Session', 'One-on-one coaching session with a certified trainer', 3500.00, 'kes', 60, 'Training', true),
  ('Nutrition Consultation', 'Personalized nutrition plan and guidance', 5000.00, 'kes', 45, 'Wellness', true),
  ('Yoga Class - Group', 'Group yoga session for beginners to advanced', 2000.00, 'kes', 90, 'Wellness', true),
  ('Physical Therapy Session', 'Professional physiotherapy assessment and treatment', 4500.00, 'kes', 60, 'Health', true),
  ('Gym Membership Add-on', 'Additional gym access for premium facilities', 1500.00, 'kes', NULL, 'Membership', true),
  ('Sports Massage', 'Therapeutic sports massage session', 4000.00, 'kes', 60, 'Wellness', true),
  ('Equipment Rental - Daily', 'Daily rental of premium fitness equipment', 500.00, 'kes', NULL, 'Equipment', true),
  ('Video Analysis Session', 'Technique analysis with video feedback', 3000.00, 'kes', 30, 'Training', true),
  ('Group Fitness Class', 'Attend a specialized group fitness class', 1500.00, 'kes', 60, 'Training', true),
  ('Recovery Session', 'Recovery and stretching session', 2500.00, 'kes', 45, 'Wellness', true),
  ('Dance Class', 'Learn various dance styles', 2000.00, 'kes', 60, 'Entertainment', true),
  ('Martial Arts Session', 'Traditional martial arts training', 3000.00, 'kes', 60, 'Training', true);