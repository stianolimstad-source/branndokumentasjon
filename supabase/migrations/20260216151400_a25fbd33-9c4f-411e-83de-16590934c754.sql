
CREATE POLICY "Assignees can view task checkpoints"
ON public.qa_checkpoints
FOR SELECT
USING (task_id IN (SELECT id FROM tasks WHERE assigned_to = auth.uid()));
