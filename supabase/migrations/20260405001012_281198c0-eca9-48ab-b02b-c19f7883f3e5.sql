ALTER TABLE public.leads ADD CONSTRAINT leads_nombre_length CHECK (char_length(nombre) <= 200);
ALTER TABLE public.leads ADD CONSTRAINT leads_telefono_length CHECK (char_length(telefono) <= 30);
ALTER TABLE public.leads ADD CONSTRAINT leads_placa_length CHECK (char_length(placa) <= 15);
ALTER TABLE public.leads ADD CONSTRAINT leads_comentarios_length CHECK (char_length(comentarios) <= 2000);
ALTER TABLE public.historial_consultas ADD CONSTRAINT hc_placa_length CHECK (char_length(placa) <= 15);
ALTER TABLE public.historial_consultas ADD CONSTRAINT hc_telefono_length CHECK (char_length(telefono) <= 30);