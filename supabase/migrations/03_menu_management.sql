-- 03_menu_management.sql
-- Added during Phase 11 for dynamic menu administration

CREATE TABLE menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Menu
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;

-- Anyone can see the menu
CREATE POLICY "Menu is viewable by everyone"
ON menu FOR SELECT
USING (true);

-- Only Admin can manage the menu (based on email check in app, but RLS adds safety)
-- Note: Replace admin@banalata.com with final admin if using server-side RLS
