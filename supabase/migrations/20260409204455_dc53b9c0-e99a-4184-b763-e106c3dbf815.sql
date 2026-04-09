
-- Add notario_id and mensajero_id columns
ALTER TABLE public.traspasos
ADD COLUMN notario_id uuid REFERENCES public.profiles(id),
ADD COLUMN mensajero_id uuid REFERENCES public.profiles(id);

-- Drop old notario RLS policies and recreate with assignment filter
DROP POLICY IF EXISTS "Notarios see traspasos in firma status" ON public.traspasos;
CREATE POLICY "Notarios see assigned traspasos"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'notario'
  AND notario_id = auth.uid()
  AND status = ANY (ARRAY['contrato_generado','contrato_firmado','verificacion_antifraude'])
);

DROP POLICY IF EXISTS "Notarios can update traspasos" ON public.traspasos;
CREATE POLICY "Notarios can update assigned traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'notario'
  AND notario_id = auth.uid()
  AND status = ANY (ARRAY['contrato_generado','contrato_firmado','verificacion_antifraude'])
);

-- Drop old mensajero RLS policies and recreate with assignment filter
DROP POLICY IF EXISTS "Mensajeros see traspasos in recogida status" ON public.traspasos;
CREATE POLICY "Mensajeros see assigned traspasos"
ON public.traspasos FOR SELECT
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND mensajero_id = auth.uid()
  AND status = ANY (ARRAY['matricula_recogida','dgii_proceso'])
);

DROP POLICY IF EXISTS "Mensajeros can update traspasos" ON public.traspasos;
CREATE POLICY "Mensajeros can update assigned traspasos"
ON public.traspasos FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'mensajero'
  AND mensajero_id = auth.uid()
  AND status = ANY (ARRAY['matricula_recogida','dgii_proceso'])
);
