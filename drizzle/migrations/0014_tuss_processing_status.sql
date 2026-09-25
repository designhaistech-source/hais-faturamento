ALTER TABLE public.tuss_versions
  ADD COLUMN status text NOT NULL DEFAULT 'EXTRACTED',
  ADD COLUMN status_problem text,
  ADD COLUMN status_guidance text,
  ADD COLUMN processed_count integer,
  ADD COLUMN unprocessed_count integer,
  ADD COLUMN retryable boolean NOT NULL DEFAULT false;
ALTER TABLE public.tuss_version_files ADD COLUMN file_hash text;
CREATE INDEX tuss_version_files_hash_idx ON public.tuss_version_files(file_hash);
GRANT UPDATE ON public.tuss_versions TO anon, authenticated;
CREATE POLICY "Anyone can update tuss versions" ON public.tuss_versions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);