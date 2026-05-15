CREATE TABLE public.ros_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ros_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ros analyses"
  ON public.ros_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ros analyses"
  ON public.ros_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ros analyses"
  ON public.ros_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ros analyses"
  ON public.ros_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Group members can view shared ros analyses"
  ON public.ros_analyses FOR SELECT
  USING (project_id IN (
    SELECT ps.project_id FROM public.project_shares ps
    WHERE ps.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  ));

CREATE TRIGGER trg_ros_analyses_updated_at
  BEFORE UPDATE ON public.ros_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ros_analyses_project_id ON public.ros_analyses(project_id);
CREATE INDEX idx_ros_analyses_user_id ON public.ros_analyses(user_id);