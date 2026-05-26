
CREATE TABLE public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traspaso_id UUID NOT NULL,
  party TEXT NOT NULL CHECK (party IN ('vendedor','comprador')),
  match BOOLEAN NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('alta','media','baja')),
  rasgos_coincidentes TEXT[] NOT NULL DEFAULT '{}',
  rasgos_diferentes TEXT[] NOT NULL DEFAULT '{}',
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_identity_verifications_traspaso ON public.identity_verifications(traspaso_id, created_at DESC);

GRANT SELECT, INSERT ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all identity verifications"
ON public.identity_verifications FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins insert identity verifications"
ON public.identity_verifications FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Notarios see identity verifications of assigned traspasos"
ON public.identity_verifications FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'notario'
  AND EXISTS (SELECT 1 FROM public.traspasos t WHERE t.id = identity_verifications.traspaso_id AND t.notario_id = auth.uid())
);

CREATE POLICY "Notarios insert identity verifications"
ON public.identity_verifications FOR INSERT TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'notario'
  AND EXISTS (SELECT 1 FROM public.traspasos t WHERE t.id = identity_verifications.traspaso_id AND t.notario_id = auth.uid())
);

CREATE POLICY "Customers see own identity verifications"
ON public.identity_verifications FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.traspasos t WHERE t.id = identity_verifications.traspaso_id AND t.customer_id = auth.uid()));

CREATE POLICY "Customers insert own identity verifications"
ON public.identity_verifications FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.traspasos t WHERE t.id = identity_verifications.traspaso_id AND t.customer_id = auth.uid()));
