-- 09_premium_menu_features.sql
-- Upgrading the menu table for the Premium 'Tevar' experience

-- 1. Add new columns to the menu table
ALTER TABLE menu ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE menu ADD COLUMN IF NOT EXISTS menu_type TEXT DEFAULT 'regular'; -- options: 'regular', 'party'

-- 2. Create a storage bucket for Menu Images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for Menu Images
-- Allow everyone to view menu images
CREATE POLICY "Public Access to Menu Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'menu-images');

-- Allow Admins to upload menu images
CREATE POLICY "Admins can upload menu images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' AND 
  auth.email() IN ('nishanthdas.personal@gmail.com', 'admin@banalata69.com', 'sutradharsanjeeb@gmail.com', 'digitalunnayan@gmail.com')
);

-- Allow Admins to delete menu images
CREATE POLICY "Admins can delete menu images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'menu-images' AND 
  auth.email() IN ('nishanthdas.personal@gmail.com', 'admin@banalata69.com', 'sutradharsanjeeb@gmail.com', 'digitalunnayan@gmail.com')
);
