

# Plan: Professional Redesign + Auth Bypass + Login Dropdown

## Summary
Three changes: (1) enable auto-confirm email so no password verification is needed, (2) restructure the admin login tab with a role dropdown for notario/mensajero, (3) full professional redesign of the landing page and per-role dashboards.

---

## 1. Enable Auto-Confirm Email Signups
- Use `cloud--configure_auth` to enable auto-confirm so users can sign in immediately without email verification
- No code changes needed — just a config toggle

## 2. Admin Login Tab — Role Dropdown
**File: `src/pages/app/Login.tsx`**
- Keep 3 tabs: Cliente, Gestor, Administrativo
- Under the "Administrativo" tab, add a Select/dropdown with options: Admin, Notario, Mensajero
- This is cosmetic/UX only — the actual redirect already works based on the profile role after login
- Update the description text dynamically based on dropdown selection

## 3. Landing Page Professional Redesign

### 3a. Replace ALL emojis with Lucide icons (~8 files)
This is the single biggest improvement. Every section uses emoji (🔍📋😰🚨📱📝🏍️🏛️✅👤⚠️💰🏷️📊⏱️). Replace each with a Lucide icon inside a styled circular container (teal/10 bg, teal border).

**Files**: HeroSection, TrustBar, ProblemaSection, ComoFunciona, HistorialSection, DealersSection, GestoresSection, PricingSection

### 3b. Navbar — Add brand icon + polish
**File: `src/components/Navbar.tsx`**
- Add a small SVG shield icon before the TRASPASA.DO wordmark
- Improve mobile menu transitions

### 3c. Hero Section — Social proof + polish
**File: `src/components/HeroSection.tsx`**
- Replace emoji with Lucide icons in the two cards
- Add social proof row below cards: "500+ traspasos", "4.9★ calificación", "24h promedio"
- Fix the spacer div hack with proper flex alignment

### 3d. Section backgrounds — Visual variety
**File: `src/pages/Index.tsx` + `src/index.css`**
- Alternate sections between white, light gray (`bg-muted/30`), and one navy section (ProblemaSection)
- Add `scroll-padding-top: 5rem` for smooth anchor scrolling under sticky nav

### 3e. ProblemaSection — Dark navy variant
**File: `src/components/ProblemaSection.tsx`**
- Dark navy background with light text for visual contrast break

### 3f. ComparisonTable — Column tints
**File: `src/components/ComparisonTable.tsx`**
- Light red tint on "Hoy" column, light teal tint on "Con TRASPASA.DO" column

### 3g. HistorialSection — Testimonial card
**File: `src/components/HistorialSection.tsx`**
- Convert italic quote into proper testimonial card with avatar placeholder, star rating, name

### 3h. Footer — Legitimacy signals
**File: `src/components/Footer.tsx`**
- Add RNC number, legal links (Términos, Privacidad)
- Replace text social links with Lucide icons (Instagram, Facebook)
- Add "Certificado por Notarios" badge area

### 3i. Favicon + OG
**File: `index.html` + `public/favicon.svg`**
- Create simple SVG favicon with shield/car mark
- Clean up OG meta tags

### 3j. Delete App.css boilerplate
**File: `src/App.css`** — Delete entirely (unused Vite boilerplate with logo-spin animation)

## 4. Per-Role Dashboard Polish

### 4a. Customer Dashboard (`src/pages/app/Dashboard.tsx`)
- Add a welcome header with user name and greeting
- Add quick-stats row (active traspasos count, last activity)
- Improve empty state with illustration-style icon composition

### 4b. Gestor Dashboard (`src/pages/gestor/GestorDashboard.tsx`)
- Add summary stats bar (total, active, completed counts)
- Improve card layout with better visual hierarchy

### 4c. Notario Dashboard (`src/pages/notario/NotarioDashboard.tsx`)
- Add header with "Certificaciones Pendientes" count badge
- Improve card design — show contract type, parties involved more prominently

### 4d. Mensajero Dashboard (`src/pages/mensajero/MensajeroDashboard.tsx`)
- Add header with "Entregas Pendientes" count
- Show pickup/delivery addresses more prominently in cards
- Add status-colored left border on cards

---

## Files Summary

| Action | File |
|--------|------|
| Config | Auto-confirm email (auth setting) |
| Edit | `src/pages/app/Login.tsx` — role dropdown in admin tab |
| Edit | `src/components/Navbar.tsx` — brand icon |
| Edit | `src/components/HeroSection.tsx` — icons + social proof |
| Edit | `src/components/TrustBar.tsx` — icons |
| Edit | `src/components/ProblemaSection.tsx` — icons + dark bg |
| Edit | `src/components/ComoFunciona.tsx` — icons |
| Edit | `src/components/HistorialSection.tsx` — icons + testimonial |
| Edit | `src/components/ComparisonTable.tsx` — column tints |
| Edit | `src/components/DealersSection.tsx` — icons |
| Edit | `src/components/GestoresSection.tsx` — icons |
| Edit | `src/components/PricingSection.tsx` — icons |
| Edit | `src/components/Footer.tsx` — legitimacy |
| Edit | `src/pages/Index.tsx` — section bg variety |
| Edit | `src/index.css` — scroll-padding, utilities |
| Edit | `src/pages/app/Dashboard.tsx` — welcome + stats |
| Edit | `src/pages/gestor/GestorDashboard.tsx` — stats bar |
| Edit | `src/pages/notario/NotarioDashboard.tsx` — header + cards |
| Edit | `src/pages/mensajero/MensajeroDashboard.tsx` — header + cards |
| Create | `public/favicon.svg` |
| Edit | `index.html` — favicon + OG |
| Delete | `src/App.css` |

