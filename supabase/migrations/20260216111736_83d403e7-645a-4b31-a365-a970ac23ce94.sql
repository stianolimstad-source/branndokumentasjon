
-- Allow users to view profiles of people in their groups
CREATE POLICY "Users can view group member profiles" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM public.group_members gm
      WHERE gm.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
    )
  );
