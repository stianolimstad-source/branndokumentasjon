
-- Add a group_members table to track membership and roles
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own group's members
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert group members" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete group members" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-add creator as admin when a group is created
CREATE OR REPLACE FUNCTION public.auto_add_group_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_group_creator_as_admin
  AFTER INSERT ON public.contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_admin();
