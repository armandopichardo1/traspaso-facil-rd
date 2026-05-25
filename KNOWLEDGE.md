# TRASPASA.DO - Knowledge Base

> Living document that captures the product vision, design system, and technical constraints. Read this before making architectural or visual decisions.

---

## 1. PRD: Problem & Core User Journey

**Problem Statement:** Buying or transferring a vehicle in the Dominican Republic still requires standing in long lines at DGII (tax authority), navigating opaque legal paperwork, and trusting strangers with large cash transactions — a process that takes weeks and causes constant anxiety.

**Core User Journey:**
1. **Discover** → Land on traspasa.do and see a clear, premium value prop: "Tu traspaso en 24 horas. Sin filas. Sin estrés."
2. **Trust** → Scroll through social proof (testimonials), legal verification badges (Ley 126-02), and security signals (escrow, digital signature, anti-fraud).
3. **Explore** → Use the "Historial Vehicular" tool (RD$350) to check any vehicle's past before buying — accidents, fines, liens, previous owners.
4. **Transact** → Start a full vehicle transfer (RD$3,500+) from the mobile-first dashboard: upload cédula, marbete, selfie; track progress; pay via escrow; sign digitally; receive the new title.
5. **Multi-role ecosystem** → Gestores (agents) create transfers, Notarios review contracts, Mensajeros (messengers) handle physical delivery — all coordinated through the same backend with role-based views.

---

## 2. Design System: "Premium Government-Tech"

Aesthetic: **confident, clean, trustworthy** — modern fintech polish applied to Dominican vehicle bureaucracy. Reference points: Revolut, Linear, TurboTax. Every screen should feel **premium, calm, and authoritative** — never busy, never generic.

### 2.1 Color Palette (HSL tokens only — never raw hex in components)

Brand spine: **Navy (authority) + Teal (action) + Orange (urgency)** on a warm off-white canvas. All tokens live in `src/index.css` under `:root` and are mapped in `tailwind.config.ts`.

| Role | Token | HSL | Hex ref | Usage |
|------|-------|-----|---------|-------|
| Primary / Navy | `--navy` | `222 47% 11%` | `#0F172A` | Headlines, sticky nav, dark hero sections, trust copy |
| Navy Light | `--navy-light` | `217 33% 17%` | `#1E293B` | Gradient stops, hover on dark surfaces |
| Accent / Teal | `--teal` / `--accent` | `192 91% 37%` | `#0891B2` | Primary actions, progress, active states, links |
| Teal Light | `--teal-light` | `192 91% 47%` | `#06B6D4` | Hover state for teal buttons, focus rings |
| CTA / Orange | `--cta` / `--orange` | `21 90% 48%` | `#EA580C` | Hero CTA, pricing highlights, urgency badges |
| Orange Light | `--orange-light` | `21 90% 55%` | `#F97316` | Hover state for CTA, gradient highlights |
| Background | `--background` | `210 20% 98%` | `#F8FAFC` | Page canvas (warm off-white — never `#FFFFFF`) |
| Card | `--card` | `0 0% 100%` | `#FFFFFF` | Elevated surfaces only (cards, modals, popovers) |
| Foreground | `--foreground` | `215 25% 10%` | `#0F1419` | Body text (never pure black) |
| Muted FG | `--muted-foreground` | `215 16% 47%` | `#64748B` | Secondary text, labels, captions |
| Border | `--border` | `214 32% 91%` | `#E2E8F0` | Dividers, input borders at rest |
| Success | (inline `green-600`) | — | `#16A34A` | Verification ticks, completed steps |
| Warning | (inline `amber-500`) | — | `#F59E0B` | Pending, in-review states |
| Destructive | `--destructive` | `0 84% 60%` | `#EF4444` | Errors, cancel actions |

**Hard rules:**
- **Never** use raw Tailwind palette utilities (`bg-blue-500`, `text-gray-600`). Always semantic: `bg-navy`, `text-cta`, `bg-accent`, `text-muted-foreground`.
- **Never** hardcode hex in components. Use `hsl(var(--token))` if you must drop to CSS.
- Light mode only — no dark mode toggle.
- Signature gradients: `bg-navy-gradient` (135deg navy → navy-light) for hero, and `bg-gradient-to-r from-cta to-orange-light` for CTA buttons only.

### 2.2 Typography

- **Font:** `DM Sans` (Google Fonts) — single family, headings + body. Loaded via `<link>` in `index.html`.
- **Weights:** 400 body, 500 labels, 600 subheads/buttons, 700 section heads, 800 hero.
- **Scale:**
  - Display / hero: `text-3xl md:text-5xl lg:text-[3.5rem]` · `font-extrabold` · `leading-[1.1]` · `tracking-tight`
  - Section H2: `text-2xl md:text-3xl` · `font-bold` · `tracking-tight`
  - Card title H3: `text-lg md:text-xl` · `font-semibold`
  - Body: `text-sm md:text-base` · `leading-relaxed` · `text-foreground` or `text-muted-foreground`
  - Caption / label: `text-xs` · `font-semibold` · `uppercase` · `tracking-wider` · `text-muted-foreground`
- **Rule:** Headlines = tight tracking + heavy weight (authority). Body = relaxed leading + muted color (calm).

### 2.3 Spacing Scale (4px base)

All spacing is a multiple of `4px`. Stick to Tailwind's default scale — never invent values like `gap-[13px]`.

| Token | px | Use |
|-------|-----|-----|
| `1` | 4 | Icon ↔ text inline |
| `2` | 8 | Tight stacks, badge padding |
| `3` | 12 | Form field internal padding |
| `4` | 16 | Default card padding, list gaps |
| `6` | 24 | Standard grid gap, card padding md+ |
| `8` | 32 | Hero grid gap, section sub-blocks |
| `12` | 48 | Vertical rhythm between minor sections |
| `16` / `20` | 64 / 80 | `py-16 md:py-20` between major page sections |
| `24` | 96 | Hero top/bottom on desktop |

- **Page wrapper:** `container mx-auto px-4 md:px-6` + `py-12 md:py-20` per section.
- **Grids:** `gap-6` default, `gap-8` hero, `gap-4` dense lists.
- **Stack rhythm:** Use `space-y-4` or `space-y-6` — avoid manual margins.

### 2.4 Border Radius

Premium feel comes from **generous, consistent** rounding. Never mix `rounded-md` with `rounded-2xl` in the same component.

| Element | Class | Value |
|---------|-------|-------|
| Buttons, inputs, selects | `rounded-lg` | 0.75rem (12px) |
| Cards, modals, popovers | `rounded-xl` | 1rem (16px) |
| Hero images, feature cards | `rounded-2xl` | 1.5rem (24px) |
| Hero illustration frames | `rounded-3xl` | 2rem (32px) |
| Pills, badges, avatars, trust bar | `rounded-full` | full |
| Tooltip, tag chips | `rounded-md` | 0.5rem (8px) — exception only |

### 2.5 Shadows (Elevation System)

Soft, **navy-tinted** shadows. No harsh black drops. Define reusable values in `index.css`.

| Level | Value | Use |
|-------|-------|-----|
| Flat | (none) | Inline elements, list items |
| `shadow-sm` | `0 1px 2px hsl(222 47% 11% / 0.05)` | Cards at rest, inputs |
| `shadow-md` | `0 4px 12px hsl(222 47% 11% / 0.08)` | Sticky nav, dropdowns |
| `shadow-lg` | `0 12px 28px hsl(222 47% 11% / 0.10)` | Hover on cards, hero CTA |
| `shadow-xl` | `0 24px 48px hsl(222 47% 11% / 0.12)` | Modals, floating drawers |
| CTA glow | `0 8px 24px hsl(21 90% 48% / 0.30)` | Orange hero button at rest |
| Teal glow | `0 8px 24px hsl(192 91% 37% / 0.25)` | Primary teal button on hover |

**Rule:** Elevation must always pair with a radius ≥ `rounded-lg`. No shadowed sharp corners.

### 2.6 Motion & Interactions

- **Library:** `framer-motion` only. No GSAP; raw CSS keyframes allowed only as Tailwind utilities (e.g. `shimmer`).
- **Entrance:** `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` · `duration: 0.6` · stagger `0.1s`.
- **Hover lift:** Cards `whileHover={{ y: -4 }}` + `shadow-sm` → `shadow-lg` · `transition: 0.2s ease`.
- **Buttons:** `hover:-translate-y-0.5` + shadow grow. CTA adds `animate-shimmer` (2s loop, white/30% sweep).
- **Reduce motion:** Respect `prefers-reduced-motion`.

### 2.7 Components & UI Patterns

- **Buttons:** Always `<Button>` from `@/components/ui/button`. Primary = `variant="cta"` (orange). Secondary = `variant="teal"`. Quiet = `outline` / `ghost`. Never raw `<button>` with utility classes.
- **Cards:** `bg-card rounded-xl border border-border/50 shadow-sm p-6`; hover adds `shadow-lg` + `-translate-y-1`.
- **Inputs:** `h-12` min, `rounded-lg`, `bg-card`, `border-border`, focus `ring-2 ring-teal/40`.
- **Badges:** Pill, `text-xs font-semibold uppercase tracking-wider`. Success `bg-green-50 text-green-700`, pending `bg-amber-50 text-amber-700`, active `bg-teal/10 text-teal`, danger `bg-red-50 text-red-700`.
- **Icons:** `lucide-react` only. `h-4 w-4` inline, `h-5 w-5` button, `h-6 w-6` feature, `h-10 w-10` hero accent inside a tinted rounded square.
- **Sections:** Wrap in `<section className="container py-12 md:py-20">` with an optional eyebrow (`text-xs uppercase tracking-wider text-teal`) above the H2.

---

## 3. Tech Constraints

### Frontend Stack

- **Framework:** React 18 + TypeScript 5 (strict mode preferred).
- **Build tool:** Vite 5 (never Webpack).
- **Styling:** Tailwind CSS v3 + `tailwindcss-animate` plugin.
- **UI library:** `shadcn/ui` components (radix-based primitives). All components live in `src/components/ui/`.
- **Animation:** `framer-motion` for all motion (no GSAP, no raw CSS keyframes for component animations).
- **Data fetching:** `@tanstack/react-query` (QueryClient with default staleTime of 5 minutes).
- **Routing:** React Router v6 (BrowserRouter). Protected routes wrapped in layout components (`AppLayout`, `GestorLayout`, etc.).
- **Forms:** React Hook Form + Zod for validation (not used in all forms yet, but standard when adding new ones).

### Backend (Lovable Cloud)

- **Database:** PostgreSQL via Lovable Cloud (Supabase abstraction). Never mention Supabase to users; always say "backend" or "database."
- **Auth:** Supabase Auth with email/password + Google OAuth. No anonymous signups.
- **RLS:** Row Level Security enabled on all user-facing tables (`traspasos`, `historial_consultas`, `profiles`).
- **Edge Functions:** Deno/TypeScript in `supabase/functions/`. Used for OCR (cedula, marbete, matricula) and face verification.
- **Realtime:** Available via Supabase Realtime but currently not used for live updates; polling via React Query is the current pattern.

### File & Asset Rules

- **Images:** Store in `src/assets/` for bundled images, `public/` for static assets (favicon, robots.txt).
- **SVG:** Favicon is `public/favicon.svg` (SVG first, PNG fallback).
- **Fonts:** DM Sans loaded via Google Fonts `<link>` in `index.html`.

### Code Conventions

- **Paths:** Use `@/` alias for all imports (configured in `vite.config.ts` and `tsconfig.json`).
- **Components:** React functional components with named exports. Props typed with interfaces.
- **Colors in CSS/TS:** Always use `hsl(var(--token))` format. Never hardcode hex values in component files.
- **Spanish language:** All UI text is in Dominican Spanish. No English copy in user-facing strings.

### What NOT to do

- Do NOT add a dark mode toggle. The brand is light-mode-only.
- Do NOT use generic AI-purple gradients. Stick to the navy/teal/orange system.
- Do NOT add server-side frameworks (Next.js, Express) — this is a client-side SPA.
- Do NOT expose Supabase service-role keys or project URLs in frontend code.
- Do NOT use `localStorage` for auth state or role checks; always validate server-side.

---

## 4. Flujos paso a paso

### 4.1 Comprar Historial del Vehículo

Producto rápido y de bajo costo. Sirve como puerta de entrada antes de un traspaso completo.

```text
┌─────────────────────────────────────────────────────────────────┐
│  FLUJO: COMPRAR HISTORIAL                                       │
└─────────────────────────────────────────────────────────────────┘

[Cliente]
   │
   ▼
1. Landing / CTA "Consultar historial"
   │
   ▼
2. Ingresa placa o chasis + correo + WhatsApp
   │  (validación de formato, no requiere cuenta)
   ▼
3. Resumen del pedido + precio (RD$)
   │
   ▼
4. Pago en línea (tarjeta / transferencia)
   │  └─ Si falla → reintentar / cambiar método
   ▼
5. Registro en `historial_consultas`  (estado: pendiente)
   │
   ▼
6. Notificación al equipo (WhatsApp interno + dashboard admin)
   │
   ▼
[Admin / Gestor]
7. Consulta manual en DGII / INTRANT / PGR
   │
   ▼
8. Arma el PDF de historial (multas, gravámenes, dueños, etc.)
   │
   ▼
9. Sube PDF y marca `historial_consultas.estado = entregado`
   │
   ▼
10. Envío automático al cliente (WhatsApp + correo con link firmado)
    │
    ▼
11. CTA dentro del PDF: "Iniciar traspaso completo" ──► entra al Flujo 4.2
```

**Reglas clave**
- No requiere cuenta: la consulta se hace con correo + WhatsApp.
- SLA objetivo: entrega en menos de 24h hábiles.
- Estados válidos: `pendiente → en_proceso → entregado` (o `cancelado` por admin).

---

### 4.2 Iniciar Traspaso Completo (10 estados)

Producto principal. Sigue la máquina de estados definida en `src/lib/traspaso-status.ts`.

```text
┌─────────────────────────────────────────────────────────────────┐
│  FLUJO: TRASPASO COMPLETO                                       │
└─────────────────────────────────────────────────────────────────┘

[Cliente]
   │
   ▼
1. solicitud_recibida              (owner: cliente)
   │  - Crea cuenta / inicia sesión
   │  - Sube cédulas, matrícula, fotos del vehículo
   │  - Firma acuerdo de servicio
   ▼
[Admin]
2. verificacion_antifraude         (owner: admin)
   │  - OCR de cédula/matrícula
   │  - Face match comprador/vendedor
   │  - Validación de gravámenes
   │  └─ Falla → cancelado
   ▼
[Admin + Cliente]
3. pago_seguro_depositado          (owner: admin/cliente)   NUEVO
   │  - Cliente deposita el monto en cuenta de garantía
   │  - Admin confirma fondos disponibles
   ▼
[Mensajero]
4. matricula_recogida              (owner: mensajero)
   │  - Mensajero retira matrícula física del vendedor
   │  - Foto + GPS de la entrega
   ▼
[Notario]
5. contrato_firmado                (owner: notario)
   │  - Firma de contrato de venta notariado
   │  - Sello y acta legalizada
   ▼
[Gestor / Admin]
6. legalizacion_pgr                (owner: gestor/admin)    NUEVO
   │  - Legalización de firmas en PGR
   ▼
7. plan_piloto                     (owner: gestor/admin)
   │  - Pago de impuestos (transferencia + opacidad)
   ▼
[Admin]
8. dgii_proceso                    (owner: admin)
   │  - Radicación y seguimiento en DGII
   │  - Emisión de nueva matrícula
   ▼
[Mensajero]
9. matricula_entregada             (owner: mensajero)       NUEVO
   │  - Entrega de matrícula nueva al comprador
   │  - Firma de recibido + foto
   ▼
[Admin]
10. completado                     (owner: admin)
    │  - Cierre del expediente
    │  - Liberación de fondos al vendedor
    │  - Encuesta NPS al cliente
    ▼
   FIN

   Estado terminal alterno: `cancelado`
      Accesible por admin desde cualquier estado.
      Dispara reembolso parcial/total según etapa.
```

**Reglas clave**
- Cada transición está role-gated en `TRANSITIONS` (ver `src/lib/traspaso-status.ts`).
- El cliente solo ve `CLIENT_PROGRESS_LABELS` (10 pasos amigables, 1:1 con los estados).
- `cancelado` es el único estado terminal alterno y solo lo puede disparar `admin`.
- Cada cambio de estado debe registrar: `actor_id`, `actor_role`, `timestamp`, `nota`.

---

*Last updated: 2026-05-25*
