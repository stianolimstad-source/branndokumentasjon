
-- Fix: replace self-referencing policy with a security definer function
CREATE OR REPLACE FUNCTION public.get_user_group_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = _user_id;
$$;

DROP POLICY "Users can view group members" ON public.group_members;

CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  );
