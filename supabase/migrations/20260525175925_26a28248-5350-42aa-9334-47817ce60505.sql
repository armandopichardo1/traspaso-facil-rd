-- 1. asset_types: catálogo de tipos de activos traspasables
CREATE TABLE public.asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read asset types"
  ON public.asset_types FOR SELECT USING (true);
CREATE POLICY "Admins insert asset types"
  ON public.asset_types FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins update asset types"
  ON public.asset_types FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins delete asset types"
  ON public.asset_types FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

INSERT INTO public.asset_types (key, label, active) VALUES
  ('vehiculo',    'Vehículo',              true),
  ('motocicleta', 'Motocicleta',           false),
  ('terreno',     'Terreno',               false),
  ('propiedad',   'Propiedad / Inmueble',  false),
  ('lancha',      'Lancha / Embarcación',  false);

-- 2. pricing_config: precios editables por admin
CREATE TABLE public.pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  price_rd numeric(12,2) NOT NULL CHECK (price_rd >= 0),
  itbis_included boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (asset_type, item_key)
);
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing"
  ON public.pricing_config FOR SELECT USING (true);
CREATE POLICY "Admins insert pricing"
  ON public.pricing_config FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins update pricing"
  ON public.pricing_config FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins delete pricing"
  ON public.pricing_config FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_config (asset_type, item_key, label, price_rd) VALUES
  ('vehiculo', 'historial',          'Historial Vehicular',       350),
  ('vehiculo', 'traspaso_basico',    'Traspaso Básico',           3500),
  ('vehiculo', 'traspaso_express',   'Traspaso Express',          5000),
  ('vehiculo', 'gestor_wholesale',   'Tarifa Mayorista (Gestor)', 2500),
  ('vehiculo', 'dealer_starter',     'Plan Dealer Starter',       15000),
  ('vehiculo', 'dealer_growth',      'Plan Dealer Growth',        30000),
  ('vehiculo', 'dealer_enterprise',  'Plan Dealer Enterprise',    50000);

-- 3. traspasos.asset_type: por defecto 'vehiculo' para todos los registros existentes
ALTER TABLE public.traspasos
  ADD COLUMN asset_type text NOT NULL DEFAULT 'vehiculo';
CREATE INDEX idx_traspasos_asset_type ON public.traspasos(asset_type);