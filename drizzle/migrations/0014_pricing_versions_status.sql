ALTER TABLE public.pricing_versions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'EXTRACTED',
  ADD COLUMN IF NOT EXISTS status_problem text,
  ADD COLUMN IF NOT EXISTS status_guidance text,
  ADD COLUMN IF NOT EXISTS processed_count integer,
  ADD COLUMN IF NOT EXISTS unprocessed_count integer,
  ADD COLUMN IF NOT EXISTS unprocessed_reasons jsonb,
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS retryable boolean NOT NULL DEFAULT false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_versions TO anon, authenticated;
GRANT ALL ON public.pricing_versions TO service_role;
CREATE POLICY "Anyone can update pricing versions" ON public.pricing_versions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);