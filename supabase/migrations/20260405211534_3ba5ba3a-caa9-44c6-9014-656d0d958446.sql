
-- Add DGII required fields to traspasos
ALTER TABLE public.traspasos
  ADD COLUMN IF NOT EXISTS tipo_vehiculo text NOT NULL DEFAULT 'vehiculo_motor',
  ADD COLUMN IF NOT EXISTS vehiculo_chasis text,
  ADD COLUMN IF NOT EXISTS fecha_acto_venta date,
  ADD COLUMN IF NOT EXISTS medio_pago text,
  ADD COLUMN IF NOT EXISTS es_traspaso_familiar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_apoderado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS apoderado_nombre text,
  ADD COLUMN IF NOT EXISTS apoderado_cedula text;

-- Create traspaso_contratos table
CREATE TABLE public.traspaso_contratos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traspaso_id uuid NOT NULL REFERENCES public.traspasos(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- contrato_venta, poder_notarial, carta_autorizacion, declaracion_jurada
  contenido_html text NOT NULL,
  pdf_url text,
  status text NOT NULL DEFAULT 'borrador', -- borrador, firmado
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.traspaso_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own contracts"
  ON public.traspaso_contratos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id AND t.customer_id = auth.uid()
  ));

CREATE POLICY "Gestores see own contracts"
  ON public.traspaso_contratos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id AND t.gestor_id = auth.uid()
  ) AND public.get_user_role(auth.uid()) = 'gestor');

CREATE POLICY "Admins see all contracts"
  ON public.traspaso_contratos FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Customers can create contracts"
  ON public.traspaso_contratos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id AND t.customer_id = auth.uid()
  ));

CREATE POLICY "Gestores can create contracts"
  ON public.traspaso_contratos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_contratos.traspaso_id AND t.gestor_id = auth.uid()
  ) AND public.get_user_role(auth.uid()) = 'gestor');

CREATE POLICY "Admins can create contracts"
  ON public.traspaso_contratos FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update contracts"
  ON public.traspaso_contratos FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create traspaso_firmas table
CREATE TABLE public.traspaso_firmas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traspaso_id uuid NOT NULL REFERENCES public.traspasos(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.traspaso_contratos(id) ON DELETE CASCADE,
  tipo_firmante text NOT NULL, -- vendedor, comprador, apoderado
  nombre_firmante text NOT NULL,
  cedula_firmante text,
  firma_imagen_url text NOT NULL,
  firma_hash text NOT NULL, -- SHA-256 del documento al firmar
  ip_address text,
  user_agent text,
  geolocation text,
  documento_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.traspaso_firmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own signatures"
  ON public.traspaso_firmas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id AND t.customer_id = auth.uid()
  ));

CREATE POLICY "Gestores see own signatures"
  ON public.traspaso_firmas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id AND t.gestor_id = auth.uid()
  ) AND public.get_user_role(auth.uid()) = 'gestor');

CREATE POLICY "Admins see all signatures"
  ON public.traspaso_firmas FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Customers can sign"
  ON public.traspaso_firmas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id AND t.customer_id = auth.uid()
  ));

CREATE POLICY "Gestores can sign"
  ON public.traspaso_firmas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.traspasos t
    WHERE t.id = traspaso_firmas.traspaso_id AND t.gestor_id = auth.uid()
  ) AND public.get_user_role(auth.uid()) = 'gestor');

CREATE POLICY "Admins can sign"
  ON public.traspaso_firmas FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
