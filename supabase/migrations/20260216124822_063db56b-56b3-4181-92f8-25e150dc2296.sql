
-- Allow authenticated users to look up profiles by email (needed for adding group members)
CREATE POLICY "Authenticated users can lookup profiles by email"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
