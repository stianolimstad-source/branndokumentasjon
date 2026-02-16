
-- Table to track project sharing with groups and contacts
CREATE TABLE public.project_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT must_share_with_group_or_contact CHECK (
    (group_id IS NOT NULL AND contact_id IS NULL) OR
    (group_id IS NULL AND contact_id IS NOT NULL)
  )
);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Owner of the project can manage shares
CREATE POLICY "Project owners can view shares"
  ON public.project_shares FOR SELECT
  USING (shared_by = auth.uid());

CREATE POLICY "Project owners can create shares"
  ON public.project_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Project owners can delete shares"
  ON public.project_shares FOR DELETE
  USING (shared_by = auth.uid());
