
-- Helper
CREATE OR REPLACE FUNCTION public.is_customer(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'customer'
  );
$$;

-- PROJECTS
CREATE POLICY "Customers can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND created_by_role = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

CREATE POLICY "Customers can update own projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = user_id
    AND created_by_role = 'customer'
  );

CREATE POLICY "Customers can delete own projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() = user_id
    AND created_by_role = 'customer'
  );

-- ROS_ANALYSES
CREATE POLICY "Customers can view ROS in own or shared projects"
  ON public.ros_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ros_analyses.project_id
      AND (
        p.user_id = auth.uid()
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
        )
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          INNER JOIN public.contacts c ON c.id = ps.contact_id
          WHERE c.linked_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Customers can create ROS in accessible projects"
  ON public.ros_analyses FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ros_analyses.project_id
      AND (
        p.user_id = auth.uid()
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
        )
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          INNER JOIN public.contacts c ON c.id = ps.contact_id
          WHERE c.linked_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Customers can update own ROS analyses"
  ON public.ros_analyses FOR UPDATE
  USING (
    auth.uid() = created_by
  )
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ros_analyses.project_id
      AND (
        p.user_id = auth.uid()
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
        )
        OR p.id IN (
          SELECT ps.project_id FROM public.project_shares ps
          INNER JOIN public.contacts c ON c.id = ps.contact_id
          WHERE c.linked_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Customers can delete own ROS analyses"
  ON public.ros_analyses FOR DELETE
  USING (
    auth.uid() = created_by
  );
