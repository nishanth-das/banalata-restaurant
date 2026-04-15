-- 01_initial_schema.sql
-- Create the Coupons table

CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  coupon_code TEXT NOT NULL,
  source TEXT NOT NULL, -- 'game' or 'review'
  is_redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Select: User can only see their own coupons
CREATE POLICY "Users can view their own coupons"
ON coupons FOR SELECT
USING (auth.uid() = user_id);

-- Insert: Logged in users can insert
CREATE POLICY "Users can insert coupons"
ON coupons FOR INSERT
WITH CHECK (auth.uid() = user_id);
