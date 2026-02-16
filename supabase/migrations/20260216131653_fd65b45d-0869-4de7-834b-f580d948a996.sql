-- Allow admins to also delete group members
DROP POLICY IF EXISTS "Users can delete group members" ON public.group_members;

CREATE POLICY "Users can delete group members"
ON public.group_members
FOR DELETE
USING (auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid()));
