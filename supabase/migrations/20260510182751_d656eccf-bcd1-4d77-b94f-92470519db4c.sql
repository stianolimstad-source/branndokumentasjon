-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can lookup profiles by email" ON public.profiles;

-- Secure RPC: lookup minimal profile by email
CREATE OR REPLACE FUNCTION public.lookup_profile_by_email(_email text)
RETURNS TABLE (id uuid, full_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND lower(p.email) = lower(trim(_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_profile_by_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_profile_by_email(text) TO authenticated;