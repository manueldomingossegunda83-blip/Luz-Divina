-- Add RLS policies for donation-receipts storage bucket
-- First ensure the bucket exists and is private
UPDATE storage.buckets SET public = false WHERE id = 'donation-receipts';

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can upload donation receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all donation receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own donation receipts" ON storage.objects;

-- Allow authenticated users to upload their own receipts (files stored in user_id folder)
CREATE POLICY "Users can upload donation receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all receipts
CREATE POLICY "Admins can view all donation receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-receipts' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow users to view only their own receipts
CREATE POLICY "Users can view own donation receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
