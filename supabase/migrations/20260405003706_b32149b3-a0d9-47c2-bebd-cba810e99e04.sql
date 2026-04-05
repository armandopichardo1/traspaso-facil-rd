
-- 1. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  cedula text,
  telefono text,
  email text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- 3. Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 4. Traspasos table
CREATE TABLE public.traspasos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  gestor_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'solicitud_recibida',
  plan text NOT NULL DEFAULT 'basico',
  vehiculo_marca text,
  vehiculo_modelo text,
  vehiculo_ano integer,
  vehiculo_placa text,
  vehiculo_color text,
  vendedor_nombre text,
  vendedor_cedula text,
  vendedor_telefono text,
  comprador_nombre text,
  comprador_cedula text,
  comprador_telefono text,
  precio_vehiculo numeric,
  precio_servicio numeric NOT NULL DEFAULT 3500,
  pago_servicio_status text NOT NULL DEFAULT 'pendiente',
  escrow_status text NOT NULL DEFAULT 'no_aplica',
  antifraude_status text NOT NULL DEFAULT 'pendiente',
  antifraude_notas text,
  mensajero_nombre text,
  notas_internas text,
  codigo text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.traspasos ENABLE ROW LEVEL SECURITY;

-- Generate unique tracking code
CREATE OR REPLACE FUNCTION public.generate_traspaso_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.codigo := 'TRASPASO-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER traspaso_set_code
  BEFORE INSERT ON public.traspasos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_traspaso_code();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_traspasos_updated_at
  BEFORE UPDATE ON public.traspasos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Traspasos RLS
CREATE POLICY "Customers see own traspasos"
  ON public.traspasos FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins see all traspasos"
  ON public.traspasos FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Customers can create traspasos"
  ON public.traspasos FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update traspasos"
  ON public.traspasos FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Traspaso documentos
CREATE TABLE public.traspaso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traspaso_id uuid NOT NULL REFERENCES public.traspasos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.traspaso_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own docs"
  ON public.traspaso_documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.traspasos t
      WHERE t.id = traspaso_id AND t.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins see all docs"
  ON public.traspaso_documentos FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Customers can upload docs"
  ON public.traspaso_documentos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.traspasos t
      WHERE t.id = traspaso_id AND t.customer_id = auth.uid()
    )
  );

-- 6. Traspaso timeline
CREATE TABLE public.traspaso_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traspaso_id uuid NOT NULL REFERENCES public.traspasos(id) ON DELETE CASCADE,
  status text NOT NULL,
  nota text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.traspaso_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own timeline"
  ON public.traspaso_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.traspasos t
      WHERE t.id = traspaso_id AND t.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins see all timeline"
  ON public.traspaso_timeline FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can add timeline entries"
  ON public.traspaso_timeline FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can add timeline entries"
  ON public.traspaso_timeline FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Alter historial_consultas to add user_id
ALTER TABLE public.historial_consultas
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Update historial RLS: customers see own
CREATE POLICY "Customers see own historiales"
  ON public.historial_consultas FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert with user_id
CREATE POLICY "Authenticated users can submit consultas"
  ON public.historial_consultas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false);

CREATE POLICY "Authenticated users can upload docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

-- 10. Public read for tracking by code (no auth needed)
CREATE POLICY "Public can read traspasos by code"
  ON public.traspasos FOR SELECT
  USING (codigo IS NOT NULL);

CREATE POLICY "Public can read timeline for tracking"
  ON public.traspaso_timeline FOR SELECT
  USING (true);
