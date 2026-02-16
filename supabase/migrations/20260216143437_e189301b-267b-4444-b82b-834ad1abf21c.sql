
CREATE POLICY "Assignees can delete tasks assigned to them"
ON public.tasks
FOR DELETE
USING (auth.uid() = assigned_to);
