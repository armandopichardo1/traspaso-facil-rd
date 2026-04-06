
CREATE TABLE public.sla_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etapa text NOT NULL UNIQUE,
  horas_objetivo numeric NOT NULL DEFAULT 24,
  descripcion text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SLA config" ON public.sla_config FOR SELECT USING (true);
CREATE POLICY "Admins can update SLA config" ON public.sla_config FOR UPDATE USING (get_user_role(auth.uid()) = 'admin'::text);
CREATE POLICY "Admins can insert SLA config" ON public.sla_config FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin'::text);

INSERT INTO public.sla_config (etapa, horas_objetivo, descripcion) VALUES
  ('solicitud', 2, 'Recepción de solicitud'),
  ('verificacion_antifraude', 24, 'Verificación antifraude'),
  ('contrato_firmado', 48, 'Firma de contrato'),
  ('matricula_recogida', 24, 'Recogida de matrícula'),
  ('plan_piloto', 72, 'Plan piloto DGII'),
  ('dgii_proceso', 48, 'Proceso en DGII'),
  ('completado', 24, 'Entrega final');
