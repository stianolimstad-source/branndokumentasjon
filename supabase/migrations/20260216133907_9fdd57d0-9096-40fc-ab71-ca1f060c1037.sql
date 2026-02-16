
-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  group_id UUID REFERENCES public.contact_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks assigned to them
CREATE POLICY "Users can view tasks assigned to them"
ON public.tasks FOR SELECT
USING (auth.uid() = assigned_to);

-- Users can view tasks they created
CREATE POLICY "Users can view tasks they created"
ON public.tasks FOR SELECT
USING (auth.uid() = assigned_by);

-- Authenticated users can create tasks (for assigning to others)
CREATE POLICY "Users can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = assigned_by);

-- Assignees can update task status
CREATE POLICY "Assignees can update tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = assigned_to);

-- Creators can update their own tasks
CREATE POLICY "Creators can update own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = assigned_by);

-- Creators can delete their own tasks
CREATE POLICY "Creators can delete own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = assigned_by);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
