
-- RLS: Notarios can see traspasos in firma-related statuses
CREATE POLICY "Notarios see traspasos in firma status"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND status IN ('contrato_firmado', 'verificacion_antifraude', 'contrato_generado')
);

-- RLS: Notarios can update traspasos (advance status)
CREATE POLICY "Notarios can update traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'notario'
  AND status IN ('contrato_firmado', 'verificacion_antifraude', 'contrato_generado')
);

-- RLS: Mensajeros can see traspasos in recogida status
CREATE POLICY "Mensajeros see traspasos in recogida status"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND status IN ('matricula_recogida', 'en_dgii')
);

-- RLS: Mensajeros can update traspasos
CREATE POLICY "Mensajeros can update traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND status IN ('matricula_recogida', 'en_dgii')
);

-- Notarios see contracts for traspasos they can access
CREATE POLICY "Notarios see contracts"
ON public.traspaso_contratos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id
    AND t.status IN ('contrato_firmado', 'verificacion_antifraude', 'contrato_generado')
  )
);

-- Notarios see signatures
CREATE POLICY "Notarios see signatures"
ON public.traspaso_firmas FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id
    AND t.status IN ('contrato_firmado', 'verificacion_antifraude', 'contrato_generado')
  )
);

-- Notarios can sign
CREATE POLICY "Notarios can sign"
ON public.traspaso_firmas FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = 'notario'
);

-- Mensajeros see documents
CREATE POLICY "Mensajeros see documents"
ON public.traspaso_documentos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_documentos.traspaso_id
    AND t.status IN ('matricula_recogida', 'en_dgii')
  )
);

-- Mensajeros can upload documents
CREATE POLICY "Mensajeros can upload documents"
ON public.traspaso_documentos FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = 'mensajero'
);

-- Notarios see timeline
CREATE POLICY "Notarios see timeline"
ON public.traspaso_timeline FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_timeline.traspaso_id
    AND t.status IN ('contrato_firmado', 'verificacion_antifraude', 'contrato_generado')
  )
);

-- Notarios can add timeline entries
CREATE POLICY "Notarios can add timeline entries"
ON public.traspaso_timeline FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'notario');

-- Mensajeros see timeline
CREATE POLICY "Mensajeros see timeline"
ON public.traspaso_timeline FOR SELECT
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_timeline.traspaso_id
    AND t.status IN ('matricula_recogida', 'en_dgii')
  )
);

-- Mensajeros can add timeline entries
CREATE POLICY "Mensajeros can add timeline entries"
ON public.traspaso_timeline FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'mensajero');

-- Admins can update profiles (to change roles)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (get_user_role(auth.uid()) = 'admin');
