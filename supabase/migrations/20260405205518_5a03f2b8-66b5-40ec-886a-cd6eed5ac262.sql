ALTER TABLE public.traspasos
ADD COLUMN vendedor_tipo_persona text NOT NULL DEFAULT 'fisica',
ADD COLUMN comprador_tipo_persona text NOT NULL DEFAULT 'fisica',
ADD COLUMN vendedor_rnc text,
ADD COLUMN comprador_rnc text;