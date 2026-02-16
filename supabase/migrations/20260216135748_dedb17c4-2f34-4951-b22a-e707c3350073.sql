
-- Create table for QA review checkpoints per chapter
CREATE TABLE public.qa_checkpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES public.fire_concepts(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  section_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'feil')),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, section_key)
);

-- Enable RLS
ALTER TABLE public.qa_checkpoints ENABLE ROW LEVEL SECURITY;

-- Reviewer can view their own checkpoints
CREATE POLICY "Reviewers can view own checkpoints"
  ON public.qa_checkpoints FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Task creator can view checkpoints for their tasks
CREATE POLICY "Task creators can view checkpoints"
  ON public.qa_checkpoints FOR SELECT
  USING (task_id IN (SELECT id FROM public.tasks WHERE assigned_by = auth.uid()));

-- Reviewer can insert checkpoints
CREATE POLICY "Reviewers can insert checkpoints"
  ON public.qa_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Reviewer can update own checkpoints
CREATE POLICY "Reviewers can update own checkpoints"
  ON public.qa_checkpoints FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Reviewer can delete own checkpoints
CREATE POLICY "Reviewers can delete own checkpoints"
  ON public.qa_checkpoints FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Trigger for updated_at
CREATE TRIGGER update_qa_checkpoints_updated_at
  BEFORE UPDATE ON public.qa_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
