
-- Create a security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Recreate the INSERT policy using the function
DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;

CREATE POLICY "Users can insert group members"
ON public.group_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  public.is_group_admin(group_id, auth.uid())
);
