-- Add role to profiles
ALTER TABLE public.profiles
  ADD COLUMN role TEXT CHECK (role IN ('engineer', 'customer'));

UPDATE public.profiles SET role = 'engineer' WHERE role IS NULL;

-- Add created_by_role to projects
ALTER TABLE public.projects
  ADD COLUMN created_by_role TEXT NOT NULL DEFAULT 'engineer'
  CHECK (created_by_role IN ('engineer', 'customer'));

-- Add created_by to ros_analyses
ALTER TABLE public.ros_analyses
  ADD COLUMN created_by UUID REFERENCES auth.users(id);

UPDATE public.ros_analyses ra
  SET created_by = p.user_id
  FROM public.projects p
  WHERE ra.project_id = p.id AND ra.created_by IS NULL;