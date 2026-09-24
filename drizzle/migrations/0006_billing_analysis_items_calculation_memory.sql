ALTER TABLE public.billing_analysis_items
  ADD COLUMN IF NOT EXISTS reference_type text,
  ADD COLUMN IF NOT EXISTS factor numeric,
  ADD COLUMN IF NOT EXISTS adjustment_percent numeric,
  ADD COLUMN IF NOT EXISTS calculation text;