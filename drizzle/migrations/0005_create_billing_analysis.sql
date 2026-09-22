CREATE TABLE public.contract_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  base_type TEXT NOT NULL DEFAULT 'none' CHECK (base_type IN ('brasindice', 'simpro', 'cbhpm', 'contract', 'none')),
  codes TEXT NOT NULL DEFAULT '',
  factor NUMERIC NOT NULL DEFAULT 1,
  adjustment_percent NUMERIC NOT NULL DEFAULT 0,
  negotiated_value NUMERIC,
  valid_from DATE,
  valid_to DATE,
  source_excerpt TEXT NOT NULL DEFAULT '',
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_rules TO authenticated;
GRANT ALL ON public.contract_rules TO service_role;

ALTER TABLE public.contract_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read contract rules" ON public.contract_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert contract rules" ON public.contract_rules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update contract rules" ON public.contract_rules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete contract rules" ON public.contract_rules FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX contract_rules_contract_id_idx ON public.contract_rules (contract_id);

CREATE TABLE public.billing_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  contract_company TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  health_plan TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  item_count INTEGER NOT NULL DEFAULT 0,
  divergence_count INTEGER NOT NULL DEFAULT 0,
  unanalyzed_count INTEGER NOT NULL DEFAULT 0,
  billed_total NUMERIC NOT NULL DEFAULT 0,
  expected_total NUMERIC NOT NULL DEFAULT 0,
  error_message TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_analyses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_analyses TO authenticated;
GRANT ALL ON public.billing_analyses TO service_role;

ALTER TABLE public.billing_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read billing analyses" ON public.billing_analyses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert billing analyses" ON public.billing_analyses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update billing analyses" ON public.billing_analyses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete billing analyses" ON public.billing_analyses FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.billing_analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.billing_analyses(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 0,
  code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_value NUMERIC,
  total_value NUMERIC,
  executed_at DATE,
  status TEXT NOT NULL DEFAULT 'unanalyzed' CHECK (status IN ('ok', 'divergent', 'unanalyzed')),
  reason TEXT,
  source TEXT NOT NULL DEFAULT '',
  reference_value NUMERIC,
  rule_description TEXT,
  expected_value NUMERIC,
  difference NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_analysis_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_analysis_items TO authenticated;
GRANT ALL ON public.billing_analysis_items TO service_role;

ALTER TABLE public.billing_analysis_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read billing analysis items" ON public.billing_analysis_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert billing analysis items" ON public.billing_analysis_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update billing analysis items" ON public.billing_analysis_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete billing analysis items" ON public.billing_analysis_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX billing_analysis_items_analysis_id_idx ON public.billing_analysis_items (analysis_id);