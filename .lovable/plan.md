# Plan: Tarifas configurables por admin + esquema multi-activo

## Objetivo

(A) Eliminar precios hardcoded del frontend: todos los precios viven en `pricing_config` y se editan desde una pantalla admin.
(B) Preparar el esquema para que el día de mañana se puedan traspasar **terrenos, propiedades, lanchas y motocicletas** sin refactor. Solo modelo de datos — sin construir los flujos.

---

## Parte A — `pricing_config` (precios configurables)

### Tabla nueva
```text
pricing_config
  id              uuid PK default gen_random_uuid()
  asset_type      text NOT NULL  -- FK lógico a asset_types.key (vehiculo, terreno, ...)
  item_key        text NOT NULL  -- p.ej. 'historial', 'traspaso_basico'
  label           text NOT NULL  -- "Traspaso Básico"
  price_rd        numeric(12,2) NOT NULL CHECK (price_rd >= 0)
  itbis_included  boolean NOT NULL DEFAULT true
  active          boolean NOT NULL DEFAULT true
  updated_at      timestamptz NOT NULL DEFAULT now()
  updated_by      uuid REFERENCES auth.users(id)
  UNIQUE (asset_type, item_key)
```

### RLS (siguiendo §8 de KNOWLEDGE.md)
- SELECT: público (cualquiera puede leer precios — son visibles en la landing).
- INSERT/UPDATE/DELETE: solo `admin` vía `get_user_role(auth.uid()) = 'admin'`.

### Seed inicial (todos `asset_type='vehiculo'`)
| item_key | label | price_rd |
|---|---|---|
| historial | Historial Vehicular | 350 |
| traspaso_basico | Traspaso Básico | 3500 |
| traspaso_express | Traspaso Express | 5000 |
| gestor_wholesale | Tarifa Mayorista (Gestor) | 2500 |
| dealer_starter | Plan Dealer Starter | 15000 |
| dealer_growth | Plan Dealer Growth | 30000 |
| dealer_enterprise | Plan Dealer Enterprise | 50000 |

### Frontend
1. **Nuevo hook** `src/hooks/usePricing.ts`:
   ```ts
   usePricing(assetType='vehiculo') → { data, getPrice(item_key), isLoading }
   ```
   Usa React Query con `staleTime: 5min`. Devuelve mapa `{ item_key: { price_rd, label, ... } }`.
2. **Componente** `<Price itemKey="traspaso_basico" />` que renderiza `RD$ X,XXX` formateado con `formatDOP` y muestra skeleton mientras carga.
3. **Pantalla admin nueva** `src/pages/admin/AdminPricing.tsx`:
   - Tabla editable agrupada por `asset_type`.
   - Inline edit de `price_rd`, `label`, `active`, `itbis_included`.
   - Botón "Agregar tarifa" → modal con `asset_type`, `item_key`, `label`, `price_rd`.
   - Ruta `/admin/precios`, agregar enlace en `AdminDashboard`.
4. **Refactor de componentes que muestran precios** (los identificaré con `rg "3500|3,500|350|RD\$"` durante la implementación). Candidatos conocidos: `HeroSection`, `PlanesSection`, `HistorialSection`, `PrecioCard`, `GuiaTraspaso`, `app/Historial.tsx`.

---

## Parte B — Esquema multi-activo

### Tabla nueva `asset_types`
```text
asset_types
  id        uuid PK default gen_random_uuid()
  key       text UNIQUE NOT NULL  -- 'vehiculo', 'terreno', 'propiedad', 'lancha', 'motocicleta'
  label     text NOT NULL
  active    boolean NOT NULL DEFAULT true
  created_at timestamptz NOT NULL DEFAULT now()
```

Seed: las 5 categorías arriba, solo `vehiculo` con `active=true`. Las demás quedan `active=false` hasta que se construya el flujo.

### Modificar `traspasos`
- `ALTER TABLE traspasos ADD COLUMN asset_type text NOT NULL DEFAULT 'vehiculo'`.
- No agrego FK formal (los `text` keys son más flexibles para back-end externo); validación a nivel app/trigger.
- Los campos `vehiculo_*` existentes se quedan tal cual (son específicos del flujo vehicular). Más adelante, cada tipo nuevo puede traer su propia tabla de atributos `traspaso_atributos_<tipo>` o usar JSONB.

### Diseño para flujos de estado por tipo (futuro, NO se construye ahora)
Documentar en KNOWLEDGE.md §7 que cuando se agreguen activos:
- `traspaso-status.ts` exportará `getStatusFlow(assetType)` que devuelve el `STATUS_STEPS` correspondiente.
- Habrá una constante por tipo: `VEHICULO_STEPS`, `TERRENO_STEPS`, etc.
- El flujo actual de 10 estados se renombrará internamente como `VEHICULO_STEPS` (alias para compatibilidad).

**No se toca `traspaso-status.ts` en esta sesión** — el cambio queda documentado.

### RLS de `asset_types`
- SELECT: público.
- INSERT/UPDATE/DELETE: solo `admin`.

---

## Migración SQL propuesta (vista previa, aún no ejecutada)

```sql
-- 1. asset_types
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
CREATE POLICY "Admins manage asset types insert"
  ON public.asset_types FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins manage asset types update"
  ON public.asset_types FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins manage asset types delete"
  ON public.asset_types FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

INSERT INTO public.asset_types (key, label, active) VALUES
  ('vehiculo', 'Vehículo', true),
  ('motocicleta', 'Motocicleta', false),
  ('terreno', 'Terreno', false),
  ('propiedad', 'Propiedad / Inmueble', false),
  ('lancha', 'Lancha / Embarcación', false);

-- 2. pricing_config
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

CREATE POLICY "Anyone can read active pricing"
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

-- 3. traspasos.asset_type
ALTER TABLE public.traspasos
  ADD COLUMN asset_type text NOT NULL DEFAULT 'vehiculo';
CREATE INDEX idx_traspasos_asset_type ON public.traspasos(asset_type);
```

---

## Flags para el back-end externo (debe mirrorar)

1. **Tablas nuevas:** `pricing_config`, `asset_types` — esquema, RLS, seed idénticos.
2. **Columna nueva:** `traspasos.asset_type text NOT NULL DEFAULT 'vehiculo'`.
3. **Fuente de verdad de precios:** el back-end NO debe hardcodear precios; debe consultar `pricing_config` por `(asset_type, item_key)`. Cualquier checkout/payment intent debe leerlo en tiempo de cobro.
4. **`updated_by`** apunta a `auth.users(id)` — si el back-end usa otro sistema de identidad, mantener el UUID consistente.
5. **Validación de `asset_type`** en `traspasos`: cuando el back-end inserte, debe verificar que el `key` exista y esté `active=true` en `asset_types`.
6. **Estado por tipo (futuro):** documentar que el `STATUS_STEPS` actual aplica solo a `asset_type='vehiculo'`. Otros tipos definirán su propio pipeline.

---

## Archivos a tocar (segunda fase, después de aprobar migración)

**Nuevos:**
- `src/hooks/usePricing.ts`
- `src/components/Price.tsx`
- `src/pages/admin/AdminPricing.tsx`
- ruta en `src/App.tsx`

**Modificados (refactor de precios hardcoded — lista preliminar a confirmar con `rg`):**
- `src/pages/Index.tsx` / `HeroSection`
- `src/components/PlanesSection.tsx`
- `src/components/HistorialSection.tsx`
- `src/components/PrecioCard.tsx` (si existe)
- `src/pages/GuiaTraspaso.tsx`
- `src/pages/app/Historial.tsx`
- `src/pages/AdminDashboard.tsx` (link a /admin/precios)

**KNOWLEDGE.md:**
- §1: nota de pricing dinámico
- §7: arquitectura multi-activo + regla "no hardcoded prices"

**Sin tocar:** `src/lib/traspaso-status.ts`, edge functions, RLS de tablas existentes.

---

## Orden de ejecución (próximas sesiones)

1. **Sesión actual (al aprobar):** ejecutar migración → confirmar tipos generados.
2. **Sesión siguiente:** crear `usePricing`, `<Price>`, `AdminPricing` y refactorizar componentes de la landing.
3. **Sesión 3:** documentar en KNOWLEDGE.md y notificar back-end.

¿Apruebas el plan y la migración para que la ejecute?
