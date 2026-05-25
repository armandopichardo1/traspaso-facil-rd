# Plan: Update `src/lib/traspaso-status.ts` to the new 10-state machine

## Heads-up before we start
I read `KNOWLEDGE.md` end-to-end. **Section 3 is "Tech Constraints" — it does not contain a state machine.** The 10-step spec lives only in your message. I'll implement exactly what you pasted, and as a follow-up we should add this state machine to `KNOWLEDGE.md` so it's the source of truth. Flag if you want me to do that in the same step.

Also: the old config contained `documentos_completos` and `contrato_generado`. The new spec drops both. Many UI files and DB migrations reference them — see blast radius below.

## Scope of this change
Only `src/lib/traspaso-status.ts`. No UI, no DB migration, no consumer fixes. The app **will break at runtime / typecheck** in places that import the dropped keys until we do the follow-up pass.

## New `STATUS_STEPS` (exact order)

```text
 # | key                    | label                                  | owner
 1 | solicitud_recibida     | Solicitud Recibida                     | cliente
 2 | verificacion_antifraude| Verificación Antifraude                | admin
 3 | pago_seguro_depositado | Pago Seguro Depositado          (NEW) | admin/cliente
 4 | matricula_recogida     | Matrícula Recogida              (MOVED)| mensajero
 5 | contrato_firmado       | Contrato Firmado y Notariado           | notario
 6 | legalizacion_pgr       | Legalización PGR + Banco Reservas (NEW)| gestor/admin
 7 | plan_piloto            | CENARVE / Plan Piloto                  | gestor/admin
 8 | dgii_proceso           | Expediente en DGII                     | admin
 9 | matricula_entregada    | Matrícula Entregada             (NEW) | mensajero
10 | completado             | Completado                             | admin
```

Dropped: `documentos_completos`, `contrato_generado`.
`cancelado` stays as terminal, admin-only from any non-terminal state.

## New `TRANSITIONS` map (role gating)

```ts
solicitud_recibida      → verificacion_antifraude   [admin]
verificacion_antifraude → pago_seguro_depositado    [admin]
pago_seguro_depositado  → matricula_recogida        [admin, mensajero]
matricula_recogida      → contrato_firmado          [admin, notario]
contrato_firmado        → legalizacion_pgr          [admin, gestor]
legalizacion_pgr        → plan_piloto               [admin, gestor]
plan_piloto             → dgii_proceso              [admin]
dgii_proceso            → matricula_entregada       [admin, mensajero]
matricula_entregada     → completado                [admin]
```

`canAdvanceTo`, `getNextStatus`, `getValidNextStatuses` stay as-is structurally — they just read the new map. `cancelado` continues to be reachable by admin from any non-terminal state.

## New `CLIENT_PROGRESS_LABELS` (10 items, aligned 1:1)

```
SOLICITUD · ANTIFRAUDE · PAGO · RECOGIDA · FIRMA · PGR · PLAN PILOTO · DGII · ENTREGA · COMPLETADO
```

## Open question (pago_seguro_depositado owner)
You wrote owner `admin/cliente` but the transition INTO it is gated. I'm proposing: cliente triggers the payment in-app, but the **status transition** is gated to `admin` (confirmation that escrow received funds). If you want the cliente role to also be able to advance this status from the UI, say so and I'll add `"customer"` to the transition roles. Same question for `cancelado`: today only admin can cancel — keep that?

## Blast radius (files referencing old/changed keys — for the follow-up step, NOT this one)

Direct references to `documentos_completos`, `contrato_generado`, `plan_piloto`, `matricula_recogida`, `dgii_proceso`, `verificacion_antifraude`, `solicitud_recibida`, `completado`:

**App / UI (15 files):**
- `src/pages/app/Dashboard.tsx`, `TraspasoDetail.tsx`, `CompleteProfile.tsx`, `Historial.tsx`, `HistorialDetail.tsx`
- `src/pages/gestor/GestorDashboard.tsx`, `GestorTraspasoDetail.tsx`, `GestorNuevoTraspaso.tsx`
- `src/pages/notario/NotarioDashboard.tsx`, `NotarioTraspasoDetail.tsx`
- `src/pages/mensajero/MensajeroDashboard.tsx`, `MensajeroTraspasoDetail.tsx`
- `src/pages/admin/AdminTraspasoDetail.tsx`, `AdminHistoriales.tsx`, `src/pages/AdminDashboard.tsx`
- `src/components/admin/MetricsDashboard.tsx`, `TrendCharts.tsx`, `LeadFilters.tsx`
- `src/pages/Norma0325.tsx`, `GuiaTraspaso.tsx`, `TerminosServicio.tsx` (likely just copy mentions)

**DB / migrations (6 files):**
- `supabase/migrations/20260405003706_*.sql`
- `supabase/migrations/20260405213401_*.sql`
- `supabase/migrations/20260406142641_*.sql`
- `supabase/migrations/20260408191938_*.sql`
- `supabase/migrations/20260409204455_*.sql`
- `supabase/migrations/20260409205932_*.sql`

The `traspasos.status` column is almost certainly a Postgres `enum` or has a CHECK constraint built from the old keys. Inserting/advancing to `pago_seguro_depositado`, `legalizacion_pgr`, or `matricula_entregada` **will fail in DB until we add a migration** that:
1. Adds the 3 new enum values.
2. Drops or replaces the 2 removed values (only safe if no rows currently use them — needs a `read_query` check first).
3. Backfills any in-flight rows sitting on `documentos_completos` / `contrato_generado` to the closest new state.

I'll handle all of that in the follow-up step you mentioned. For now: only the TS config changes.

## Confirm before I switch to build
1. OK to proceed with `pago_seguro_depositado` gated to `[admin]` only (cliente pays, admin confirms)?
2. Keep `cancelado` admin-only?
3. Want me to also append this state machine to `KNOWLEDGE.md` section 3 in the same change, so the doc matches reality?
