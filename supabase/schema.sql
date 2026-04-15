-- Create the coupons table
create table coupons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  coupon_code text not null,
  source text not null, -- 'game' or 'review'
  screenshot_url text, -- link to the proof image (for 'review' source)
  is_redeemed boolean default false,
  created_at timestamp with time zone default now()
);

-- Phase 11: Menu Table
CREATE TABLE menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
alter table coupons enable row level security;

-- Policy: Users can see only their own coupons
create policy "Users can view their own coupons"
  on coupons for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own coupons
create policy "Users can insert their own coupons"
  on coupons for insert
  with check ( auth.uid() = user_id );
