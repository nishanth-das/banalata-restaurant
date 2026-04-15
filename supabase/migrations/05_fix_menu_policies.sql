-- 05_fix_menu_policies.sql
-- Recorded on 2026-04-05
-- This ensures that the Admin (Authenticated User) has permission 
-- to ADD, UPDATE, and DELETE items in the menu table.

-- Note: The user manually ran this in the Supabase SQL Editor on this date.

CREATE POLICY "Allow all actions for authenticated users" 
ON menu FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
