ALTER TABLE public.billing_analyses
  ADD COLUMN IF NOT EXISTS processing_status text,
  ADD COLUMN IF NOT EXISTS processing_details jsonb,
  ADD COLUMN IF NOT EXISTS file_hash text;
CREATE INDEX IF NOT EXISTS billing_analyses_file_hash_idx ON public.billing_analyses (contract_id, file_hash);