-- Migration: Add reward_text to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS reward_text TEXT;
