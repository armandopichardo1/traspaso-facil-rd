
-- 1) historial_consultas: lectura restringida
DROP POLICY IF EXISTS "Authenticated users can read consultas" ON public.historial_consultas;
CREATE POLICY "Customers read own consultas" ON public.historial_consultas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all consultas" ON public.historial_consultas
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- 2) leads: solo admin lee/actualiza
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
CREATE POLICY "Admins read leads" ON public.leads
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins update leads" ON public.leads
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- 3) traspaso_timeline: cerrar lectura pública y restringir inserción genérica
DROP POLICY IF EXISTS "Public can read timeline for tracking" ON public.traspaso_timeline;
DROP POLICY IF EXISTS "System can add timeline entries" ON public.traspaso_timeline;
CREATE POLICY "Anon read timeline by codigo" ON public.traspaso_timeline
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_id AND t.codigo IS NOT NULL
  ));

-- 4) profiles: gestor solo ve perfiles de SUS partes
DROP POLICY IF EXISTS "Gestores can view profiles" ON public.profiles;
CREATE POLICY "Gestores see related customer profiles" ON public.profiles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'gestor'
    AND EXISTS (
      SELECT 1 FROM public.traspasos t
      WHERE t.gestor_id = auth.uid() AND t.customer_id = profiles.id
    )
  );

-- 5) traspasos: vista pública de tracking (sin PII)
CREATE OR REPLACE VIEW public.traspasos_tracking
WITH (security_invoker = on) AS
  SELECT id, codigo, status, asset_type,
         vehiculo_marca, vehiculo_modelo, vehiculo_placa,
         created_at, updated_at
  FROM public.traspasos
  WHERE codigo IS NOT NULL;

-- 6) traspaso_documentos: notario lee asignados
CREATE POLICY "Notarios see assigned docs" ON public.traspaso_documentos
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'notario'
    AND EXISTS (
      SELECT 1 FROM public.traspasos t
      WHERE t.id = traspaso_id AND t.notario_id = auth.uid()
    )
  );

-- 7) traspasos: customer puede editar mientras esté en solicitud_recibida
CREATE POLICY "Customers update own draft" ON public.traspasos
  FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'solicitud_recibida')
  WITH CHECK (auth.uid() = customer_id AND status = 'solicitud_recibida');

-- 8) storage.objects bucket "documentos"
DROP POLICY IF EXISTS "Authenticated users can upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own docs" ON storage.objects;

CREATE POLICY "Doc upload owner or staff" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
    AND (
      public.get_user_role(auth.uid()) IN ('admin','gestor','notario','mensajero')
      OR EXISTS (
        SELECT 1 FROM public.traspasos t
        WHERE t.id::text = (storage.foldername(name))[1]
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
        WHERE t.id::text = (storage.foldername(name))[1]
          AND (
            t.customer_id = auth.uid()
            OR t.gestor_id  = auth.uid()
            OR t.notario_id = auth.uid()
            OR t.mensajero_id = auth.uid()
          )
      )
    )
  );
