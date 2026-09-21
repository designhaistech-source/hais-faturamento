ALTER TABLE public.pricing_versions
  ADD COLUMN base_type TEXT NOT NULL DEFAULT 'brasindice';

ALTER TABLE public.pricing_versions
  ADD CONSTRAINT pricing_versions_base_type_check
  CHECK (base_type IN ('brasindice', 'simpro', 'cbhpm'));
