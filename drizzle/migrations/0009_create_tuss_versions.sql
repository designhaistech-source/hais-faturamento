CREATE TABLE public.tuss_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_month DATE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.tuss_versions TO anon;
GRANT SELECT, INSERT, DELETE ON public.tuss_versions TO authenticated;
GRANT ALL ON public.tuss_versions TO service_role;

ALTER TABLE public.tuss_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tuss versions" ON public.tuss_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tuss versions" ON public.tuss_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete tuss versions" ON public.tuss_versions FOR DELETE USING (true);

CREATE POLICY "Anyone can read tuss version files" ON storage.objects FOR SELECT USING (bucket_id = 'tuss-versions');
CREATE POLICY "Anyone can upload tuss version files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tuss-versions');
CREATE POLICY "Anyone can delete tuss version files" ON storage.objects FOR DELETE USING (bucket_id = 'tuss-versions');