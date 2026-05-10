-- Allow admins to update member roles
CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE
USING (public.is_group_admin(group_id, auth.uid()))
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- Replace DELETE policy: admins cannot remove other admins
DROP POLICY IF EXISTS "Users can delete group members" ON public.group_members;
CREATE POLICY "Members can leave or admins can remove non-admins"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id
  OR (public.is_group_admin(group_id, auth.uid()) AND role <> 'admin')
);

-- Auto-promote next member if last admin leaves
CREATE OR REPLACE FUNCTION public.ensure_group_has_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_user uuid;
BEGIN
  IF OLD.role = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = OLD.group_id AND role = 'admin'
    ) THEN
      SELECT user_id INTO _next_user
      FROM public.group_members
      WHERE group_id = OLD.group_id
      ORDER BY created_at ASC
      LIMIT 1;
      IF _next_user IS NOT NULL THEN
        UPDATE public.group_members
        SET role = 'admin'
        WHERE group_id = OLD.group_id AND user_id = _next_user;
      END IF;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS ensure_group_has_admin_after_delete ON public.group_members;
CREATE TRIGGER ensure_group_has_admin_after_delete
AFTER DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.ensure_group_has_admin();