CREATE TABLE public.pricing_version_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.pricing_versions(id) ON DELETE CASCADE,
  position integer NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.pricing_version_files TO anon, authenticated;
GRANT ALL ON public.pricing_version_files TO service_role;
ALTER TABLE public.pricing_version_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing version files" ON public.pricing_version_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert pricing version files" ON public.pricing_version_files FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete pricing version files" ON public.pricing_version_files FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX pricing_version_files_version_idx ON public.pricing_version_files(version_id, position);