
-- Update notario policies to remove verificacion_antifraude (now earlier in pipeline)
DROP POLICY IF EXISTS "Notarios see assigned traspasos" ON public.traspasos;
CREATE POLICY "Notarios see assigned traspasos"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND notario_id = auth.uid()
  AND status = ANY (ARRAY['contrato_generado','contrato_firmado'])
);

DROP POLICY IF EXISTS "Notarios can update assigned traspasos" ON public.traspasos;
CREATE POLICY "Notarios can update assigned traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'notario'
  AND notario_id = auth.uid()
  AND status = ANY (ARRAY['contrato_generado','contrato_firmado'])
);

-- Update mensajero policies: matricula_recogida + plan_piloto
DROP POLICY IF EXISTS "Mensajeros see assigned traspasos" ON public.traspasos;
CREATE POLICY "Mensajeros see assigned traspasos"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND mensajero_id = auth.uid()
  AND status = ANY (ARRAY['contrato_firmado','matricula_recogida'])
);

DROP POLICY IF EXISTS "Mensajeros can update assigned traspasos" ON public.traspasos;
CREATE POLICY "Mensajeros can update assigned traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND mensajero_id = auth.uid()
  AND status = ANY (ARRAY['contrato_firmado','matricula_recogida'])
);

-- Update notario contracts visibility
DROP POLICY IF EXISTS "Notarios see contracts" ON public.traspaso_contratos;
CREATE POLICY "Notarios see contracts"
ON public.traspaso_contratos FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'notario')
  AND (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id
    AND t.status = ANY (ARRAY['contrato_generado','contrato_firmado'])
  ))
);

-- Update notario signatures visibility
DROP POLICY IF EXISTS "Notarios see signatures" ON public.traspaso_firmas;
CREATE POLICY "Notarios see signatures"
ON public.traspaso_firmas FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'notario')
  AND (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id
    AND t.status = ANY (ARRAY['contrato_generado','contrato_firmado'])
  ))
);

-- Update notario timeline visibility
DROP POLICY IF EXISTS "Notarios see timeline" ON public.traspaso_timeline;
CREATE POLICY "Notarios see timeline"
ON public.traspaso_timeline FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'notario')
  AND (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_timeline.traspaso_id
    AND t.status = ANY (ARRAY['contrato_generado','contrato_firmado'])
  ))
);

-- Update mensajero docs visibility to include plan_piloto
DROP POLICY IF EXISTS "Mensajeros see documents" ON public.traspaso_documentos;
CREATE POLICY "Mensajeros see documents"
ON public.traspaso_documentos FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'mensajero')
  AND (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_documentos.traspaso_id
    AND t.status = ANY (ARRAY['contrato_firmado','matricula_recogida'])
  ))
);

-- Update mensajero timeline visibility
DROP POLICY IF EXISTS "Mensajeros see timeline" ON public.traspaso_timeline;
CREATE POLICY "Mensajeros see timeline"
ON public.traspaso_timeline FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'mensajero')
  AND (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_timeline.traspaso_id
    AND t.status = ANY (ARRAY['contrato_firmado','matricula_recogida'])
  ))
);
