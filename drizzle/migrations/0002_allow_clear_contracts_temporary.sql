GRANT DELETE ON public.contracts TO anon, authenticated;

CREATE POLICY "Anyone can delete contracts"
  ON public.contracts FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete contract files"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'contracts');