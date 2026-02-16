
-- Allow group admins to insert members into their groups
DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;

CREATE POLICY "Users can insert group members"
ON public.group_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
  )
);
