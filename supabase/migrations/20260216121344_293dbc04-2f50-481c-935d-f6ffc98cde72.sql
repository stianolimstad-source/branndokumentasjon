
-- Allow group members to view shares for their groups
CREATE POLICY "Group members can view shares"
  ON public.project_shares FOR SELECT
  USING (group_id IN (SELECT public.get_user_group_ids(auth.uid())));
