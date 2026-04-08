
-- Make customer_id nullable so gestors can create traspasos without being the customer
ALTER TABLE public.traspasos ALTER COLUMN customer_id DROP NOT NULL;

-- Drop and recreate mensajero RLS policies to use dgii_proceso instead of en_dgii
DROP POLICY IF EXISTS "Mensajeros see traspasos in recogida status" ON public.traspasos;
CREATE POLICY "Mensajeros see traspasos in recogida status" ON public.traspasos
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'mensajero'::text) 
    AND (status = ANY (ARRAY['matricula_recogida'::text, 'dgii_proceso'::text]))
  );

DROP POLICY IF EXISTS "Mensajeros can update traspasos" ON public.traspasos;
CREATE POLICY "Mensajeros can update traspasos" ON public.traspasos
  FOR UPDATE USING (
    (get_user_role(auth.uid()) = 'mensajero'::text) 
    AND (status = ANY (ARRAY['matricula_recogida'::text, 'dgii_proceso'::text]))
  );

-- Update notario policies to include documentos_completos and contrato_generado
DROP POLICY IF EXISTS "Notarios see traspasos in firma status" ON public.traspasos;
CREATE POLICY "Notarios see traspasos in firma status" ON public.traspasos
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'notario'::text) 
    AND (status = ANY (ARRAY['contrato_generado'::text, 'contrato_firmado'::text, 'verificacion_antifraude'::text]))
  );

DROP POLICY IF EXISTS "Notarios can update traspasos" ON public.traspasos;
CREATE POLICY "Notarios can update traspasos" ON public.traspasos
  FOR UPDATE USING (
    (get_user_role(auth.uid()) = 'notario'::text) 
    AND (status = ANY (ARRAY['contrato_generado'::text, 'contrato_firmado'::text, 'verificacion_antifraude'::text]))
  );

-- Update notario contract policies
DROP POLICY IF EXISTS "Notarios see contracts" ON public.traspaso_contratos;
CREATE POLICY "Notarios see contracts" ON public.traspaso_contratos
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'notario'::text) 
    AND (EXISTS (
      SELECT 1 FROM traspasos t 
      WHERE t.id = traspaso_contratos.traspaso_id 
      AND t.status = ANY (ARRAY['contrato_generado'::text, 'contrato_firmado'::text, 'verificacion_antifraude'::text])
    ))
  );

-- Update notario signature policies
DROP POLICY IF EXISTS "Notarios see signatures" ON public.traspaso_firmas;
CREATE POLICY "Notarios see signatures" ON public.traspaso_firmas
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'notario'::text) 
    AND (EXISTS (
      SELECT 1 FROM traspasos t 
      WHERE t.id = traspaso_firmas.traspaso_id 
      AND t.status = ANY (ARRAY['contrato_generado'::text, 'contrato_firmado'::text, 'verificacion_antifraude'::text])
    ))
  );

-- Update notario timeline policies
DROP POLICY IF EXISTS "Notarios see timeline" ON public.traspaso_timeline;
CREATE POLICY "Notarios see timeline" ON public.traspaso_timeline
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'notario'::text) 
    AND (EXISTS (
      SELECT 1 FROM traspasos t 
      WHERE t.id = traspaso_timeline.traspaso_id 
      AND t.status = ANY (ARRAY['contrato_generado'::text, 'contrato_firmado'::text, 'verificacion_antifraude'::text])
    ))
  );

-- Update mensajero document policies
DROP POLICY IF EXISTS "Mensajeros see documents" ON public.traspaso_documentos;
CREATE POLICY "Mensajeros see documents" ON public.traspaso_documentos
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'mensajero'::text) 
    AND (EXISTS (
      SELECT 1 FROM traspasos t 
      WHERE t.id = traspaso_documentos.traspaso_id 
      AND t.status = ANY (ARRAY['matricula_recogida'::text, 'dgii_proceso'::text])
    ))
  );

-- Update mensajero timeline policies  
DROP POLICY IF EXISTS "Mensajeros see timeline" ON public.traspaso_timeline;
CREATE POLICY "Mensajeros see timeline" ON public.traspaso_timeline
  FOR SELECT USING (
    (get_user_role(auth.uid()) = 'mensajero'::text) 
    AND (EXISTS (
      SELECT 1 FROM traspasos t 
      WHERE t.id = traspaso_timeline.traspaso_id 
      AND t.status = ANY (ARRAY['matricula_recogida'::text, 'dgii_proceso'::text])
    ))
  );

-- Also update gestor INSERT policy to allow null customer_id
DROP POLICY IF EXISTS "Gestores can create traspasos" ON public.traspasos;
CREATE POLICY "Gestores can create traspasos" ON public.traspasos
  FOR INSERT WITH CHECK (
    (gestor_id = auth.uid()) AND (get_user_role(auth.uid()) = 'gestor'::text)
  );
