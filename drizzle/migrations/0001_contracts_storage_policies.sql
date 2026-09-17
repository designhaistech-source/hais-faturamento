CREATE POLICY "Contract files are readable"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Contract files can be uploaded"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'contracts');
