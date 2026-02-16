-- Backfill: add existing group creators as admin members
INSERT INTO public.group_members (group_id, user_id, role)
SELECT cg.id, cg.user_id, 'admin'
FROM public.contact_groups cg
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm WHERE gm.group_id = cg.id AND gm.user_id = cg.user_id
);