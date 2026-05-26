ALTER TABLE public.traspasos
  ADD COLUMN IF NOT EXISTS gestor_commission_pct numeric NOT NULL DEFAULT 0.30,
  ADD COLUMN IF NOT EXISTS gestor_costs_rd numeric NOT NULL DEFAULT 0;