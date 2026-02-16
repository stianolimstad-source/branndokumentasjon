
-- Allow group members to view shared projects
CREATE POLICY "Group members can view shared projects"
ON public.projects FOR SELECT
USING (id IN (
  SELECT ps.project_id FROM public.project_shares ps
  WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
));

-- Allow group members to view fire concepts in shared projects
CREATE POLICY "Group members can view shared fire concepts"
ON public.fire_concepts FOR SELECT
USING (project_id IN (
  SELECT ps.project_id FROM public.project_shares ps
  WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
));
