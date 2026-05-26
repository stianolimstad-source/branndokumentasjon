-- 1. project_shares ownership check
DROP POLICY IF EXISTS "Project owners can create shares" ON public.project_shares;
CREATE POLICY "Project owners can create shares"
ON public.project_shares
FOR INSERT
TO authenticated
WITH CHECK (
  shared_by = auth.uid()
  AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

-- 2. tilstandsvurdering-images: replace INSERT policy with folder check
DROP POLICY IF EXISTS "Authenticated users can upload tilstandsvurdering images" ON storage.objects;
CREATE POLICY "Users can upload own tilstandsvurdering images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tilstandsvurdering-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. notifications: remove user-facing INSERT
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;