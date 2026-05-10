DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;

CREATE POLICY "Admins can insert group members"
ON public.group_members
FOR INSERT
WITH CHECK (public.is_group_admin(group_id, auth.uid()));