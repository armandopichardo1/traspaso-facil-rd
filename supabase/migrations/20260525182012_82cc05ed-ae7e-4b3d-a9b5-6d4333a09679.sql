
DROP POLICY IF EXISTS "Doc upload owner or staff" ON storage.objects;
DROP POLICY IF EXISTS "Doc read owner or party" ON storage.objects;

CREATE POLICY "Doc upload owner or staff" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
    AND (
      public.get_user_role(auth.uid()) IN ('admin','gestor','notario','mensajero')
      OR EXISTS (
        SELECT 1 FROM public.traspasos t
        WHERE t.id::text = ANY (storage.foldername(name))
          AND t.customer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Doc read owner or party" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND (
      public.get_user_role(auth.uid()) = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.traspasos t
        WHERE t.id::text = ANY (storage.foldername(name))
          AND (
            t.customer_id   = auth.uid()
            OR t.gestor_id  = auth.uid()
            OR t.notario_id = auth.uid()
            OR t.mensajero_id = auth.uid()
          )
      )
    )
  );
