
-- Table to store frozen snapshots of fire concepts at time of KS submission
CREATE TABLE public.concept_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id uuid NOT NULL REFERENCES public.fire_concepts(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  snapshot_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot_name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.concept_snapshots ENABLE ROW LEVEL SECURITY;

-- Creator can view their own snapshots
CREATE POLICY "Creators can view own snapshots"
ON public.concept_snapshots FOR SELECT
USING (auth.uid() = created_by);

-- Task assignee can view snapshots linked to their tasks
CREATE POLICY "Assignees can view task snapshots"
ON public.concept_snapshots FOR SELECT
USING (task_id IN (SELECT id FROM public.tasks WHERE assigned_to = auth.uid()));

-- Creator can insert snapshots
CREATE POLICY "Users can create snapshots"
ON public.concept_snapshots FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Cascade delete with task - also allow explicit delete by creator
CREATE POLICY "Creators can delete own snapshots"
ON public.concept_snapshots FOR DELETE
USING (auth.uid() = created_by);
