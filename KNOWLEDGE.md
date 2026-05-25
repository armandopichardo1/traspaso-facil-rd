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

Aesthetic: **confident, refined, trustworthy** — luxury fintech polish applied to Dominican vehicle bureaucracy. Reference points: Revolut Metal, Linear, Mercury, Stripe. Every screen should feel **premium, calm, and authoritative** — never busy, never generic.

### 2.1 Premium Color Palette (HSL tokens only — never raw hex in components)

Brand spine: **Deep Navy (authority) + Emerald (action/success) + Champagne Gold (premium accent)** on a warm ivory canvas. Teal moves to a supporting role; orange is reserved for true urgency only. All tokens live in `src/index.css` under `:root` and are mapped in `tailwind.config.ts`.

| Role | Token | HSL | Hex ref | Usage |
|------|-------|-----|---------|-------|
| Ink / Navy 950 | `--navy` | `222 47% 9%` | `#0B1220` | Headlines, dark hero, sticky nav |
| Navy 800 | `--navy-light` | `220 39% 16%` | `#1A2236` | Gradient stop, hover on dark surfaces |
| Navy 600 | `--navy-soft` | `218 27% 28%` | `#39455C` | Secondary dark text on light bg |
| Primary / Emerald 600 | `--primary` / `--emerald` | `158 64% 28%` | `#1A7A55` | Primary actions, links, progress, active |
| Emerald 500 | `--emerald-light` | `158 64% 38%` | `#239A6B` | Hover state for primary, focus rings |
| Accent / Gold 500 | `--accent` / `--gold` | `41 60% 52%` | `#C9A24A` | Premium accents, badges, hairline dividers on dark, "Pro" tags |
| Gold 300 | `--gold-light` | `43 76% 74%` | `#EAD49A` | Hover sheen, subtle highlights on dark hero |
| Teal 600 | `--teal` | `192 80% 34%` | `#0E8AA8` | Info, secondary actions, document/file chips |
| CTA / Orange 600 | `--cta` | `21 90% 48%` | `#EA580C` | Urgency only: hero CTA, "última oportunidad" |
| Background / Ivory | `--background` | `40 30% 98%` | `#FAF8F3` | Page canvas (warm ivory — never `#FFFFFF`) |
| Surface | `--surface` | `40 24% 96%` | `#F4F1EA` | Section bands, alt rows |
| Card | `--card` | `0 0% 100%` | `#FFFFFF` | Elevated surfaces (cards, modals, popovers) |
| Foreground | `--foreground` | `222 47% 11%` | `#0F172A` | Body text (never pure black) |
| Muted FG | `--muted-foreground` | `218 16% 42%` | `#5A6678` | Secondary text, labels, captions |
| Border | `--border` | `38 22% 88%` | `#E6E0D2` | Hairlines, input borders at rest (warm) |
| Border Strong | `--border-strong` | `38 18% 78%` | `#CFC6B2` | Card outlines, table dividers |
| Success | `--success` | `158 64% 32%` | `#1F8A5F` | Verification ticks, completed steps |
| Warning | `--warning` | `36 92% 50%` | `#F59E0B` | Pending, in-review states |
| Destructive | `--destructive` | `0 72% 51%` | `#DC2626` | Errors, cancel actions |

**Hard rules:**
- **Never** use raw Tailwind palette utilities (`bg-blue-500`, `text-gray-600`). Always semantic: `bg-navy`, `text-primary`, `bg-gold`, `text-muted-foreground`.
- **Never** hardcode hex in components. Use `hsl(var(--token))` if you must drop to CSS.
- Light mode only — no dark mode toggle.
- Signature gradients:
  - `--gradient-navy`: `linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-light)) 100%)` — hero, sticky dark nav.
  - `--gradient-emerald`: `linear-gradient(135deg, hsl(var(--emerald)) 0%, hsl(var(--emerald-light)) 100%)` — primary buttons.
  - `--gradient-gold`: `linear-gradient(135deg, hsl(43 76% 74%) 0%, hsl(41 60% 52%) 100%)` — premium badges, hairline accents on dark.

### 2.2 Typography

- **Font:** `DM Sans` (Google Fonts) — single family, headings + body. Loaded via `<link>` in `index.html`.
- **Weights:** 400 body, 500 labels, 600 subheads/buttons, 700 section heads, 800 hero.
- **Scale:**
  - Display / hero: `text-3xl md:text-5xl lg:text-[3.5rem]` · `font-extrabold` · `leading-[1.05]` · `tracking-[-0.02em]`
  - Section H2: `text-2xl md:text-4xl` · `font-bold` · `tracking-[-0.015em]`
  - Card title H3: `text-lg md:text-xl` · `font-semibold` · `tracking-tight`
  - Body: `text-sm md:text-base` · `leading-[1.65]` · `text-foreground` or `text-muted-foreground`
  - Eyebrow / label: `text-[11px]` · `font-semibold` · `uppercase` · `tracking-[0.18em]` · `text-gold`
- **Rule:** Headlines = tight tracking + heavy weight (authority). Body = generous leading + muted color (calm). Eyebrows = gold, all-caps, wide-tracked (premium signal).

### 2.3 Spacing Scale (4px base, 8px rhythm)

All spacing is a multiple of `4px`, with `8px` as the primary rhythm. Stick to Tailwind's default scale — never invent values like `gap-[13px]`.

| Token | px | Use |
|-------|-----|-----|
| `1` | 4 | Icon ↔ text inline, hairline offsets |
| `2` | 8 | Tight stacks, badge padding (`px-2 py-0.5`) |
| `3` | 12 | Form field inner padding y |
| `4` | 16 | Default card padding sm, list gaps |
| `6` | 24 | Standard grid gap, card padding md |
| `8` | 32 | Card padding lg, hero grid gap, section sub-blocks |
| `12` | 48 | Vertical rhythm between minor sections |
| `16` | 64 | `py-16` between standard sections (mobile) |
| `20` / `24` | 80 / 96 | `md:py-20 lg:py-24` between major sections (desktop) |
| `32` | 128 | Hero top/bottom on large desktop only |

- **Page wrapper:** `container mx-auto px-4 md:px-6 lg:px-8` + `py-16 md:py-20 lg:py-24` per section.
- **Max content width:** `max-w-7xl` page, `max-w-3xl` prose, `max-w-2xl` forms.
- **Grids:** `gap-6` default, `gap-8` hero/feature, `gap-4` dense lists.
- **Stack rhythm:** Use `space-y-4` / `space-y-6` / `space-y-8` — avoid manual margins.

### 2.4 Border Radius

Premium feel comes from **generous, consistent** rounding. Never mix `rounded-md` with `rounded-2xl` in the same component. Defined as tokens in `tailwind.config.ts` `borderRadius`.

| Element | Class | Token | Value |
|---------|-------|-------|-------|
| Tooltip, tag chips | `rounded-md` | `--radius-sm` | 0.5rem (8px) |
| Buttons, inputs, selects | `rounded-xl` | `--radius` | 0.875rem (14px) |
| Cards, modals, popovers, dropdowns | `rounded-2xl` | `--radius-lg` | 1.25rem (20px) |
| Hero images, feature cards, premium panels | `rounded-3xl` | `--radius-xl` | 1.75rem (28px) |
| Hero illustration frames, decorative blocks | `rounded-[2rem]` | `--radius-2xl` | 2rem (32px) |
| Pills, badges, avatars, trust bar | `rounded-full` | — | full |

**Rule:** Inputs and their containing card must differ by exactly one step (e.g. `rounded-xl` input inside `rounded-2xl` card). No sharp corners anywhere except table cells.

### 2.5 Shadows (Premium Elevation System)

Soft, **navy-tinted** layered shadows — two-stop for realism. No harsh black drops. Define reusable values in `index.css` as `--shadow-*` tokens and map in `tailwind.config.ts` `boxShadow`.

| Level | Token | Value | Use |
|-------|-------|-------|-----|
| Flat | — | (none) | Inline elements, list items, row hovers |
| `shadow-xs` | `--shadow-xs` | `0 1px 2px hsl(222 47% 9% / 0.04)` | Inputs at rest, chips |
| `shadow-sm` | `--shadow-sm` | `0 1px 2px hsl(222 47% 9% / 0.04), 0 2px 4px hsl(222 47% 9% / 0.04)` | Cards at rest |
| `shadow-md` | `--shadow-md` | `0 2px 4px hsl(222 47% 9% / 0.05), 0 6px 16px hsl(222 47% 9% / 0.08)` | Sticky nav, dropdowns, popovers |
| `shadow-lg` | `--shadow-lg` | `0 4px 8px hsl(222 47% 9% / 0.06), 0 16px 32px hsl(222 47% 9% / 0.10)` | Card hover, hero CTA, floating panels |
| `shadow-xl` | `--shadow-xl` | `0 8px 16px hsl(222 47% 9% / 0.08), 0 32px 56px hsl(222 47% 9% / 0.14)` | Modals, drawers, premium spotlight |
| `shadow-emerald` | `--shadow-emerald` | `0 8px 24px hsl(158 64% 28% / 0.28)` | Primary button at rest |
| `shadow-cta` | `--shadow-cta` | `0 10px 28px hsl(21 90% 48% / 0.32)` | Hero urgency CTA |
| `shadow-gold` | `--shadow-gold` | `0 6px 20px hsl(41 60% 52% / 0.30)` | Premium "Pro" badges, gold-accented cards |
| `shadow-inset` | `--shadow-inset` | `inset 0 1px 0 hsl(0 0% 100% / 0.6)` | Top highlight on dark surfaces (luxury sheen) |

**Rule:** Elevation must always pair with a radius ≥ `rounded-xl`. No shadowed sharp corners. Hover state lifts exactly one shadow step (`sm` → `lg`).

### 2.6 Motion & Interactions

- **Library:** `framer-motion` only. No GSAP; raw CSS keyframes allowed only as Tailwind utilities (e.g. `shimmer`).
- **Easing:** Use `[0.22, 1, 0.36, 1]` (out-expo) for entrances, `[0.4, 0, 0.2, 1]` (standard) for hovers.
- **Entrance:** `initial={{ opacity: 0, y: 24 }}` → `animate={{ opacity: 1, y: 0 }}` · `duration: 0.7` · stagger `0.08s`.
- **Hover lift:** Cards `whileHover={{ y: -6 }}` + `shadow-sm` → `shadow-lg` · `transition: 0.25s`.
- **Buttons:** `hover:-translate-y-0.5` + shadow grow. CTA adds `animate-shimmer` (2s loop, gold/30% sweep).
- **Reduce motion:** Respect `prefers-reduced-motion` — disable y-translations, keep opacity only.

### 2.7 Components & UI Patterns

- **Buttons:** Always `<Button>` from `@/components/ui/button`. Primary = `variant="default"` (emerald gradient + `shadow-emerald`). Urgency = `variant="cta"` (orange + `shadow-cta`). Premium = `variant="gold"` (gold gradient + `shadow-gold`, white text). Quiet = `outline` / `ghost`. Min height `h-11` standard, `h-12` hero, `h-9` compact. Never raw `<button>` with utility classes.
- **Cards:** `bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8`; hover adds `shadow-lg` + `-translate-y-1`. Premium card variant adds `border-gold/30` + `shadow-gold` + inset top highlight.
- **Inputs:** `h-12` min, `rounded-xl`, `bg-card`, `border-border`, focus `ring-2 ring-emerald/40 border-emerald`. Label sits above with `text-sm font-medium mb-2`.
- **Badges:** Pill, `text-[11px] font-semibold uppercase tracking-[0.14em]`. Success `bg-emerald/10 text-emerald`, pending `bg-warning/10 text-warning`, active `bg-teal/10 text-teal`, danger `bg-destructive/10 text-destructive`, premium `bg-gold/15 text-gold-700 ring-1 ring-gold/30`.
- **Inputs in dark hero:** `bg-white/8 backdrop-blur-md border border-white/15` with `text-white placeholder:text-white/60`, focus `ring-gold/50`.
- **Icons:** `lucide-react` only. `h-4 w-4` inline, `h-5 w-5` button, `h-6 w-6` feature, `h-10 w-10` hero accent inside a tinted rounded-2xl square (`bg-emerald/10` or `bg-gold/10`).
- **Sections:** Wrap in `<section className="container py-16 md:py-20 lg:py-24">` with an optional eyebrow (`text-[11px] uppercase tracking-[0.18em] text-gold font-semibold`) above the H2.
- **Dividers:** Prefer a 1px hairline `bg-gradient-to-r from-transparent via-border-strong to-transparent` over solid borders for premium feel.

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

## 5. Roadmap: Prioridades por Semana (Lanzamiento)

Meta: lanzamiento público en 8 semanas. Cada semana tiene un milestone entregable y un criterio de "listo para demo".

### Semana 1 — Fundamentos + Landing Premium
**Meta:** El sitio público transmite confianza y convierte consultas de historial.

- [ ] Aplicar design system premium (colores HSL, sombras, radios, tokens) a `index.css` y `tailwind.config.ts`.
- [ ] Refrescar `HeroSection`, `TrustBar`, `Navbar` con nuevos tokens.
- [ ] Conectar formulario de historial a la tabla `historial_consultas` (insert público).
- [ ] Integrar pasarela de pago (tarjeta/transferencia) para historial.
- [ ] Configurar notificaciones automáticas al equipo (WhatsApp/email) cuando llegue una consulta.

**Demo-ready:** Un visitante puede llegar, ver landing, pagar RD$350 y recibir confirmación.

---

### Semana 2 — Historial Vehicular (Producto Puerta de Entrada)
**Meta:** El equipo admin puede recibir, procesar y entregar un historial en <24h.

- [ ] Construir `AdminHistoriales` dashboard: listado, filtros por estado, asignación a gestor.
- [ ] Flujo de estados: `pendiente → en_proceso → entregado` (o `cancelado`).
- [ ] Subida de PDF por admin y marca de entrega.
- [ ] Envío automático de PDF al cliente por correo/WhatsApp con link firmado.
- [ ] CTA dentro del PDF/email para iniciar traspaso completo.

**Demo-ready:** Admin recibe notificación, sube PDF, cliente lo recibe.

---

### Semana 3 — Autenticación + Onboarding del Cliente
**Meta:** Un cliente puede crear cuenta, iniciar sesión y completar su perfil.

- [ ] Auth con email/password + Google OAuth (sin confirmación automática de email).
- [ ] Tabla `profiles` vinculada a `auth.users` con campos: nombre, cédula, teléfono, dirección.
- [ ] Pantalla `CompleteProfile` obligatoria después del primer login.
- [ ] Vistas protegidas: redirigir a login si no hay sesión.
- [ ] Recuperación de contraseña por correo.

**Demo-ready:** Usuario se registra con Google, completa perfil y llega al dashboard.

---

### Semana 4 — Traspaso Completo (Flujo del Cliente)
**Meta:** Un cliente autenticado puede iniciar un traspaso y subir todos los documentos.

- [ ] Tabla `traspasos` con campos: estado, datos del vehículo, vendedor, comprador, documentos.
- [ ] Pantalla `NuevoTraspaso`: wizard de 4 pasos (datos vehículo → vendedor → comprador → documentos).
- [ ] Captura de cédula y marbete con guía visual (`DocumentCameraGuide`).
- [ ] Selfie capture con verificación facial (`SelfieCapture` → edge function `verify-face`).
- [ ] Subida de fotos del vehículo y firma digital básica.

**Demo-ready:** Cliente inicia traspaso, sube documentos, estado = `solicitud_recibida`.

---

### Semana 5 — Dashboard Admin y Gestores
**Meta:** Admin y gestores pueden ver, asignar y avanzar traspasos.

- [ ] `AdminDashboard` con métricas: traspasos activos, en espera, completados, ingresos.
- [ ] `AdminTraspasoDetail`: vista completa del expediente, cambio de estado, notas internas.
- [ ] `GestorDashboard`: vista filtrada de traspasos asignados al gestor.
- [ ] `GestorNuevoTraspaso`: un gestor puede crear traspaso en nombre de un cliente.
- [ ] RLS correcto: admin ve todo, gestor solo lo asignado.

**Demo-ready:** Admin ve métricas, abre un traspaso y cambia estado a `verificacion_antifraude`.

---

### Semana 6 — Roles de Mensajero y Notario
**Meta:** Mensajeros y notarios tienen vistas móviles para ejecutar sus tareas.

- [ ] `MensajeroDashboard`: lista de recogidas y entregas asignadas.
- [ ] `MensajeroTraspasoDetail`: confirmar recogida de matrícula (foto + GPS) y entrega (firma de recibido).
- [ ] `NotarioDashboard`: lista de contratos pendientes de firma.
- [ ] `NotarioTraspasoDetail`: revisar contrato generado, confirmar firma notariada.
- [ ] `ContractGenerator`: genera borrador de contrato de venta con datos del traspaso.

**Demo-ready:** Mensajero abre app, confirma recogida con foto; notario marca contrato firmado.

---

### Semana 7 — Pagos en Línea y Escrow
**Meta:** Cliente puede pagar el traspaso y el dinero queda retenido hasta la entrega.

- [ ] Integrar pasarela de pago para traspaso completo (RD$3,500+).
- [ ] Tabla `escrow_payments`: monto, estado (deposited / released / refunded), traspaso_id.
- [ ] Vista `EscrowView` para el cliente: ver depósito, liberación o reembolso.
- [ ] Admin puede liberar fondos al vendedor o reembolsar al cliente según etapa.
- [ ] Email/WhatsApp de confirmación de pago y liberación.

**Demo-ready:** Cliente paga, admin libera fondos al completar.

---

### Semana 8 — QA, Polish y Lanzamiento
**Meta:** Producto estable, rápido y listo para usuarios reales.

- [ ] Testing completo de los 10 estados del flujo con roles reales.
- [ ] Revisión de RLS en todas las tablas (`traspasos`, `historial_consultas`, `profiles`, `escrow_payments`).
- [ ] Optimizar imágenes, lazy loading de páginas, revisar métricas de Lighthouse.
- [ ] Copy review: todo el texto en español dominicano, sin inglés en la UI.
- [ ] Configurar dominio personalizado, SSL, y SEO básico (meta tags, sitemap).
- [ ] Guía rápida para el equipo de soporte y documentación de procesos manuales (DGII, INTRANT).

**Demo-ready:** Lanzamiento público. Primer cliente real puede comprar historial o iniciar traspaso.

---

*Last updated: 2026-05-25*
