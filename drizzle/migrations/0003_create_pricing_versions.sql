CREATE TABLE public.pricing_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pricing_versions TO anon;
GRANT SELECT, INSERT ON public.pricing_versions TO authenticated;
GRANT ALL ON public.pricing_versions TO service_role;

ALTER TABLE public.pricing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing versions"
  ON public.pricing_versions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert pricing versions"
  ON public.pricing_versions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read pricing version files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pricing-versions');

CREATE POLICY "Anyone can upload pricing version files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pricing-versions');
