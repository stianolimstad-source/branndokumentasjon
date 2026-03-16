
-- Create storage bucket for tilstandsvurdering images
INSERT INTO storage.buckets (id, name, public) VALUES ('tilstandsvurdering-images', 'tilstandsvurdering-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload tilstandsvurdering images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tilstandsvurdering-images');

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view tilstandsvurdering images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tilstandsvurdering-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own tilstandsvurdering images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tilstandsvurdering-images' AND (storage.foldername(name))[1] = auth.uid()::text);
