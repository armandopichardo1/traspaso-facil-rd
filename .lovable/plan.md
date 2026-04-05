

# TRASPASA.DO Full MVP — Phase 1: Database + Auth + Customer App

This plan builds the foundation (database, auth, storage) and all customer-facing screens. Gestor and expanded admin screens come in a follow-up phase.

## What gets built

1. **Database schema** — 5 new tables: `profiles`, `traspasos`, `traspaso_documentos`, `traspaso_timeline`, plus alter `historial_consultas` to add `user_id` and `resultado_json`
2. **RLS policies** — customers see own data, admins see all (gestor policies added later)
3. **Storage bucket** — `documentos` for uploads (cédulas, selfies, matrícula photos)
4. **Auth flow** — email/password signup + login, profile completion (nombre, cédula, email, teléfono), role stored in `profiles`
5. **Customer screens** — dashboard, history report detail, new traspaso wizard, traspaso detail, escrow view, profile
6. **Public tracking** — `/seguimiento/:code` read-only status page
7. **Routing** — all `/app/*` routes protected, redirect unauthenticated users

## Technical Details

### Migration 1: Core tables

```sql
-- profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text, cedula text, telefono text, email text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

-- traspasos
CREATE TABLE public.traspasos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) NOT NULL,
  gestor_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'solicitud_recibida',
  plan text NOT NULL DEFAULT 'basico',
  vehiculo_marca text, vehiculo_modelo text, vehiculo_ano int,
  vehiculo_placa text, vehiculo_color text,
  vendedor_nombre text, vendedor_cedula text, vendedor_telefono text,
  comprador_nombre text, comprador_cedula text, comprador_telefono text,
  precio_vehiculo numeric, precio_servicio numeric NOT NULL DEFAULT 3500,
  pago_servicio_status text DEFAULT 'pendiente',
  escrow_status text DEFAULT 'no_aplica',
  antifraude_status text DEFAULT 'pendiente',
  antifraude_notas text, mensajero_nombre text, notas_internas text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- traspaso_documentos, traspaso_timeline
-- ALTER historial_consultas ADD user_id, resultado_json
-- Storage bucket: documentos
-- Trigger: auto-create profile on signup
-- RLS on all tables
```

### New files (approx)

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Auth state + profile, wraps app |
| `src/components/app/BottomNav.tsx` | Mobile bottom navigation |
| `src/components/app/AppLayout.tsx` | Protected layout with nav |
| `src/pages/app/Login.tsx` | Email/password login + signup |
| `src/pages/app/CompleteProfile.tsx` | Post-signup profile form |
| `src/pages/app/Dashboard.tsx` | Customer dashboard (C1) |
| `src/pages/app/HistorialDetail.tsx` | History report view (C2) |
| `src/pages/app/NuevoTraspaso.tsx` | Multi-step wizard (C3) |
| `src/pages/app/TraspasoDetail.tsx` | Transfer detail + timeline (C4) |
| `src/pages/app/EscrowView.tsx` | Escrow status (C5) |
| `src/pages/app/Profile.tsx` | User profile |
| `src/pages/Seguimiento.tsx` | Public tracking page |

### Routing changes in App.tsx

- `/app` → Dashboard (protected)
- `/app/login` → Login/Signup
- `/app/historial/:id` → History detail
- `/app/nuevo` → New traspaso wizard
- `/app/traspaso/:id` → Traspaso detail
- `/app/traspaso/:id/escrow` → Escrow view
- `/app/perfil` → Profile
- `/seguimiento/:code` → Public tracking

### Auth approach

- Email/password (existing Supabase Auth)
- Auto-confirm disabled (users verify email)
- On first login, if no profile exists → redirect to `/app/complete-profile`
- Profile stores role (default `customer`)
- Admin role check via `security definer` function (`has_role`)

### What is NOT in this phase

- Phone OTP auth (added later)
- Gestor screens (G1, G2)
- Expanded admin screens (A2-A5) — existing admin panel stays as-is
- QR code generation for escrow
- Actual payment integration

## Build order

1. Database migration (all tables + RLS + trigger + storage)
2. AuthContext + login/signup pages
3. AppLayout + BottomNav + routing
4. Customer Dashboard
5. History report detail page
6. New Traspaso wizard (5 steps)
7. Traspaso detail + timeline
8. Escrow view
9. Public tracking page `/seguimiento/:code`

