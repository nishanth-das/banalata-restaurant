-- 10_review_screenshots_storage.sql
-- Setting up the storage bucket for Review Screenshots

-- 1. Create a storage bucket for Review Screenshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-screenshots', 'review-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for Review Screenshots

-- Allow everyone to view review screenshots (needed for admin dashboard)
CREATE POLICY "Public Access to Review Screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-screenshots');

-- Allow authenticated users to upload their review screenshots
CREATE POLICY "Users can upload review screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-screenshots' AND
  auth.role() = 'authenticated'
);

-- Allow Admins to delete review screenshots
CREATE POLICY "Admins can delete review screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-screenshots' AND
  auth.email() IN ('nishanthdas.personal@gmail.com', 'admin@banalata69.com')
);
