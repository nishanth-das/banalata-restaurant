-- 06_fix_coupon_pool_rls.sql
-- Recorded on 2026-04-05
-- This fix allows the Admin to create "Pool" coupons where user_id is NULL.
-- It also allows the Admin to delete any coupon (history or template).

DROP POLICY IF EXISTS "Admins can manage all coupons" ON coupons;

CREATE POLICY "Admins can manage all coupons"
ON coupons FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
