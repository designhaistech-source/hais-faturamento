CREATE TABLE public.contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  extraction_status text NOT NULL DEFAULT 'extracting',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contract_amendments_contract_id_idx ON public.contract_amendments(contract_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_amendments TO anon, authenticated;
GRANT ALL ON public.contract_amendments TO service_role;
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contract amendments" ON public.contract_amendments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert contract amendments" ON public.contract_amendments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update contract amendments" ON public.contract_amendments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete contract amendments" ON public.contract_amendments FOR DELETE TO anon, authenticated USING (true);