-- Allow snapshot creators to update their own snapshots
CREATE POLICY "Creators can update own snapshots"
ON public.concept_snapshots
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
