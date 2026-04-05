CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL,
  marca_modelo TEXT,
  ano INTEGER,
  placa TEXT,
  plan TEXT,
  comentarios TEXT,
  status TEXT NOT NULL DEFAULT 'nuevo'
);

CREATE TABLE public.historial_consultas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  placa TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  resultado JSONB
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can submit a historial consulta" ON public.historial_consultas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read consultas" ON public.historial_consultas FOR SELECT TO authenticated USING (true);