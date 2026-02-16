
-- 1. Allow group members to see groups they belong to
CREATE POLICY "Members can view their groups"
ON public.contact_groups
FOR SELECT
USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- 2. Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'group_added', 'contact_added', etc.
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- 3. Trigger: notify user when added to a group
CREATE OR REPLACE FUNCTION public.notify_group_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_name text;
BEGIN
  SELECT name INTO _group_name FROM public.contact_groups WHERE id = NEW.group_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'group_added',
    'Lagt til i gruppe',
    'Du har blitt lagt til i gruppen "' || COALESCE(_group_name, 'Ukjent') || '".',
    jsonb_build_object('group_id', NEW.group_id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_member_added
AFTER INSERT ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_group_member_added();
