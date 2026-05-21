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

Our aesthetic is **confident, clean, and trustworthy** — the visual language of a modern fintech app applied to government bureaucracy. Think Revolut meets TurboTax, but for Dominican vehicle transfers.

### Color Palette (HSL tokens only — never raw hex in components)

| Role | Token | HSL | Usage |
|------|-------|-----|-------|
| Primary / Navy | `--navy` | `222 47% 11%` | Headlines, trust badges, dark sections |
| Accent / Teal | `--teal` | `192 91% 37%` | Primary actions, progress bars, success states |
| CTA / Orange | `--cta` | `21 90% 48%` | Hero buttons, pricing highlights, urgency |
| Background | `--background` | `210 20% 98%` | Page background (off-white, never pure #fff) |
| Foreground | `--foreground` | `215 25% 10%` | Body text |
| Muted | `--muted-foreground` | `215 16% 47%` | Secondary text, labels |
| Card | `--card` | `0 0% 100%` | Elevated surfaces |
| Border | `--border` | `214 32% 91%` | Dividers, input borders |

**Rules:**
- Never use `bg-blue-500`, `text-gray-600`, or any raw Tailwind color utilities. Always use semantic tokens: `bg-navy`, `text-cta`, `bg-accent`, etc.
- Gradients for hero backgrounds: `bg-navy-gradient` (navy → navy-light at 135deg) or `bg-gradient-to-br from-navy via-accent to-navy`.
- Light mode only. No dark mode toggle. The brand lives on off-white.

### Typography

- **Font:** `DM Sans` (Google Fonts) for everything — headings and body.
- **Scale:**
  - Hero headline: `text-3xl md:text-5xl lg:text-[3.5rem]`, `font-extrabold`, `leading-[1.1]`, `tracking-tight`
  - Section headlines: `text-2xl md:text-3xl`, `font-bold`
  - Body: `text-sm md:text-base`, `text-muted-foreground`
  - Labels / badges: `text-xs`, `font-semibold`, `uppercase`, `tracking-wider`
- **Rule:** Headlines use tight tracking and heavy weight (extrabold/bold) to feel authoritative. Body stays legible with muted color.

### Spacing & Shape

- **Border radius:** `rounded-xl` (1rem) for cards, `rounded-2xl` (1.5rem) for hero images, `rounded-lg` (0.75rem) for buttons and inputs. Pill shapes (`rounded-full`) only for badges and trust bars.
- **Shadows:** `shadow-sm` for cards at rest, `shadow-lg` on hover for interactive cards. Hero CTA uses `shadow-lg` to pop.
- **Page padding:** `container` with `py-12 md:py-20` for vertical rhythm.
- **Grid gaps:** `gap-6` for standard grids, `gap-8` for hero layouts.

### Motion & Interactions

- **Framework:** `framer-motion` for React animations.
- **Entrance pattern:** Elements fade in (`opacity: 1`) and slide up (`translateY: 20px → 0`) with `duration: 0.6` and staggered delays (`0.1s`, `0.2s`).
- **Hover micro-interactions:** Cards lift on hover (`whileHover={{ y: -4, boxShadow: "..." }}`). Buttons get subtle scale or shadow increase.
- **Shimmer effect:** CTA buttons (hero and dashboard) include a `translateX` shimmer sweep using `animate-shimmer` (2s ease-in-out loop) with a white/30% gradient overlay.
- **Scroll behavior:** `scroll-behavior: smooth` globally, `scroll-padding-top: 5rem` for sticky nav offset.

### Components & UI Patterns

- **Buttons:** Use `cva` variants. Primary CTA uses `variant="cta"` (orange). Secondary actions use `variant="teal"` (teal). Never use raw `<button>` classes.
- **Cards:** `bg-card`, `rounded-2xl`, `border border-border/50`, `shadow-sm`.
- **Badges:** Small, pill-shaped. Green for success, amber for pending, accent for active states.
- **Icons:** `lucide-react` only. Size `h-4 w-4` for inline, `h-6 w-6` for feature icons, `h-12 w-12` for hero accents.
- **Inputs:** `rounded-xl`, `h-12` minimum for mobile tap targets. White background with subtle shadow for contrast against off-white page.

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

*Last updated: 2026-05-21*
