-- Create party_inquiries table
CREATE TABLE IF NOT EXISTS party_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guests INTEGER NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE party_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since the form is public)
CREATE POLICY "Public can insert inquiries"
ON party_inquiries FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to view and update
CREATE POLICY "Admins have full access to inquiries"
ON party_inquiries FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' IN ('nishanth.das1998@gmail.com', 'digitalunnayan@gmail.com', 'sutradharsanjeeb@gmail.com'));
