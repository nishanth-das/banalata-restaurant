-- 12_add_dietary_preference.sql
-- Add dietary preference column to menu table

ALTER TABLE menu ADD COLUMN IF NOT EXISTS dietary_preference TEXT DEFAULT 'none';
