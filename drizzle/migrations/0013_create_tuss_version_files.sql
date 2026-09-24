CREATE TABLE public.tuss_version_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.tuss_versions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tuss_version_files TO anon, authenticated;
GRANT ALL ON public.tuss_version_files TO service_role;
ALTER TABLE public.tuss_version_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tuss version files" ON public.tuss_version_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert tuss version files" ON public.tuss_version_files FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete tuss version files" ON public.tuss_version_files FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX tuss_version_files_version_idx ON public.tuss_version_files(version_id, position);