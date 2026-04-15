-- 07_allow_null_userid_coupons.sql
-- Recorded on 2026-04-05
-- This fix removes the "NOT NULL" requirement from the user_id column.
-- This allows coupons to be created as "Templates" in the reward pool 
-- before they are assigned to a specific customer.

ALTER TABLE coupons ALTER COLUMN user_id DROP NOT NULL;
