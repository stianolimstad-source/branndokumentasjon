
-- Replace overly permissive INSERT policy with a restrictive one
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only allow users to insert notifications for themselves (the trigger uses SECURITY DEFINER so it bypasses RLS)
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
