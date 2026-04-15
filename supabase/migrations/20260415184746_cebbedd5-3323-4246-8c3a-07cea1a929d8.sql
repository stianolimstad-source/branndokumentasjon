
-- Quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  quote_number TEXT,
  recipient_name TEXT,
  recipient_company TEXT,
  recipient_address TEXT,
  recipient_email TEXT,
  validity_date DATE,
  payment_terms TEXT DEFAULT 'Betaling innen 14 dager etter fakturadato',
  conditions TEXT DEFAULT 'Eventuelle tillegg faktureres etter medgått tid. Alle priser er eks. mva.',
  include_mva BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quote line items
CREATE TABLE public.quote_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'stk',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines ENABLE ROW LEVEL SECURITY;

-- RLS for quotes
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- RLS for quote_lines (via quote ownership)
CREATE POLICY "Users can view own quote lines" ON public.quote_lines FOR SELECT USING (
  quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create own quote lines" ON public.quote_lines FOR INSERT WITH CHECK (
  quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own quote lines" ON public.quote_lines FOR UPDATE USING (
  quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own quote lines" ON public.quote_lines FOR DELETE USING (
  quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
);

-- Updated_at trigger
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
