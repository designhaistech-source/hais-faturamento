CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  cnpj TEXT NOT NULL DEFAULT '',
  valid_until DATE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.contracts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contracts are readable by anyone"
  ON public.contracts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create contracts"
  ON public.contracts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
