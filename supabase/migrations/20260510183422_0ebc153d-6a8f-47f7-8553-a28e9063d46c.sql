CREATE POLICY "Users can update own tilstandsvurdering images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tilstandsvurdering-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tilstandsvurdering-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);