
CREATE TABLE public.engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  engagement_number TEXT,
  client_name TEXT,
  client_company TEXT,
  client_address TEXT,
  client_email TEXT,
  assignment_description TEXT,
  scope TEXT,
  deliverables TEXT,
  timeline TEXT,
  fee_description TEXT,
  fee_amount NUMERIC,
  conditions TEXT DEFAULT 'Oppdraget utføres i henhold til avtalt omfang. Eventuelle tilleggsarbeider avtales separat.',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagements" ON public.engagements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own engagements" ON public.engagements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own engagements" ON public.engagements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own engagements" ON public.engagements FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_engagements_updated_at BEFORE UPDATE ON public.engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
