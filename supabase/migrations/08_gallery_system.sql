-- 1. Create the Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users,
  is_approved BOOLEAN DEFAULT FALSE,
  is_admin_upload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- 3. Set up Database Policies
-- Public can see approved photos
CREATE POLICY "Public can view approved photos" 
ON gallery FOR SELECT USING (is_approved = true);

-- Authenticated users can upload their own photos
CREATE POLICY "Users can upload their own photos" 
ON gallery FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can see and manage EVERYTHING
-- Note: Replace with nishanthdas.personal@gmail.com or use the whitelist check
CREATE POLICY "Admins have full access to gallery" 
ON gallery FOR ALL USING (
  auth.email() IN ('nishanthdas.personal@gmail.com', 'admin@banalata69.com', 'sutradharsanjeeb@gmail.com', 'digitalunnayan@gmail.com')
);

-- 4. Create the Storage Bucket for Gallery Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Set up Storage Policies (Who can upload files)
-- Public can read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

-- Authenticated users can upload to gallery
CREATE POLICY "Users can upload gallery images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

-- Admins can delete or update files
CREATE POLICY "Admins can manage gallery images" ON storage.objects FOR ALL 
USING (bucket_id = 'gallery');
