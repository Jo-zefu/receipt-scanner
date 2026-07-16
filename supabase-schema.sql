-- Supabase SQL: Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  vendor TEXT,
  category TEXT DEFAULT 'Other',
  amount NUMERIC(10, 2),
  date DATE,
  raw_text TEXT,
  confidence TEXT DEFAULT 'low',
  image_url TEXT,
  payment_method TEXT DEFAULT 'Other',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (adjust for production)
CREATE POLICY "Allow all for anon" ON receipts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-images', 'receipt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow public uploads
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'receipt-images');

CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipt-images');
