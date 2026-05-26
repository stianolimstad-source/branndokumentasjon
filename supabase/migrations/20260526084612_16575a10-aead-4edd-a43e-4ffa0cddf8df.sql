-- Revoke EXECUTE from anon and authenticated on trigger-only functions
REVOKE EXECUTE ON FUNCTION public.auto_add_group_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_group_member_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_group_has_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- create_notification is only used from server-side / triggers
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- Revoke from anon on functions used by authenticated users (RLS helpers + RPC)
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_group_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_profile_by_email(text) FROM PUBLIC, anon;

-- Ensure authenticated still has access where needed
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_group_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_profile_by_email(text) TO authenticated;