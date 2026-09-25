GRANT DELETE ON public.pricing_versions TO anon, authenticated;
CREATE POLICY "Anyone can delete pricing versions" ON public.pricing_versions FOR DELETE USING (true);
CREATE POLICY "Anyone can delete pricing version files" ON storage.objects FOR DELETE USING (bucket_id = 'pricing-versions');