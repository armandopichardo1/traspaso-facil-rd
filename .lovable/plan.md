# Plan: Sincronizar `src/lib/traspaso-status.ts` con KNOWLEDGE.md §3 + §7

## Hallazgo importante (estado actual)

Al leer `src/lib/traspaso-status.ts`, **el archivo ya contiene las 10 claves en el orden solicitado**, con los labels, owners, `CLIENT_PROGRESS_LABELS` y `TRANSITIONS` correctos. Lo que falta para cumplir 100% con el spec es:

1. Endurecer las **reglas de rol** en `TRANSITIONS` para que coincidan exactamente con la tabla de §3 (hoy varios pasos permiten `admin` como comodín; el spec marca dueños específicos).
2. Añadir lógica de **escrow-refund** cuando se cancela después de `pago_seguro_depositado`.
3. Exportar el **owner por estado** como dato consultable (hoy vive en `STATUS_STEPS` pero no hay helper).
4. Dejar comentario claro de que este archivo es **single source of truth** y debe replicarse en el back-end (enum/constraints).

No hay re-ordenamiento ni renombrado de claves. Es un cambio quirúrgico.

## Cambios concretos a `src/lib/traspaso-status.ts`

1. Encabezado: comentario "SINGLE SOURCE OF TRUTH — debe estar sincronizado con el enum/constraint del back-end y con KNOWLEDGE.md §3".
2. `TRANSITIONS`: ajustar `roles` por paso según §3:
   - `solicitud_recibida → verificacion_antifraude`: `["admin"]`
   - `verificacion_antifraude → pago_seguro_depositado`: `["admin"]`
   - `pago_seguro_depositado → matricula_recogida`: `["admin"]` (el cliente paga, admin confirma escrow)
   - `matricula_recogida → contrato_firmado`: `["mensajero", "admin"]`
   - `contrato_firmado → legalizacion_pgr`: `["notario", "admin"]`
   - `legalizacion_pgr → plan_piloto`: `["gestor", "admin"]`
   - `plan_piloto → dgii_proceso`: `["gestor", "admin"]`
   - `dgii_proceso → matricula_entregada`: `["admin"]`
   - `matricula_entregada → completado`: `["mensajero", "admin"]`
3. Cancelación: `cancelado` sigue siendo terminal, alcanzable desde cualquier estado no terminal solo por `admin`, con `reason: string` obligatorio. Nuevo helper:
   ```ts
   export const requiresEscrowRefund = (current: TraspasoStatus): boolean
   ```
   Devuelve `true` si `current` es `pago_seguro_depositado` o cualquier paso posterior distinto de `completado`. El consumidor (admin UI / edge function) deberá llamar al refund.
4. Nuevos helpers utilitarios (no rompen API existente):
   - `getOwner(status): string` — lee `STATUS_STEPS[i].owner`.
   - `isTerminal(status): boolean` — `completado | cancelado`.
   - `cancelTraspaso(current, role, reason)` retornando `{ ok, needsRefund, error? }` (función pura, no hace I/O).
5. `canAdvanceTo` se mantiene; ya respeta la nueva lista de roles.
6. `CLIENT_PROGRESS_LABELS` se mantiene tal cual (ya está alineado 1:1).

API pública preservada: `STATUS_STEPS`, `TraspasoStatus`, `UserRole`, `STATUS_LABELS`, `CLIENT_PROGRESS_LABELS`, `statusColor`, `getProgress`, `canAdvanceTo`, `getNextStatus`, `getValidNextStatuses`. Solo se **añaden** exports.

## Blast radius — archivos que referencian claves de estado y deben revisarse en una sesión separada

### Frontend (consumidores actuales)
- `src/pages/notario/NotarioTraspasoDetail.tsx` — usa `"verificacion_antifraude"` hardcoded como nextStatus (línea 89) — **BUG**: notario nunca debería avanzar a antifraude; debe ser `legalizacion_pgr`.
- `src/pages/mensajero/MensajeroTraspasoDetail.tsx` — usa `"dgii_proceso"` hardcoded (línea 80); debería derivarse de `getNextStatus`. También usa `"matricula_recogida"` como guard (línea 210) ✅.
- `src/pages/admin/AdminTraspasoDetail.tsx`
- `src/pages/gestor/GestorTraspasoDetail.tsx`
- `src/pages/gestor/GestorDashboard.tsx` — mapa local de labels que incluye clave **legacy** `documentos_pendientes` (línea 18) que ya no existe en el spec; quitar.
- `src/pages/gestor/GestorNuevoTraspaso.tsx`
- `src/pages/app/Dashboard.tsx`
- `src/pages/app/TraspasoDetail.tsx` — checa `contrato_generado` (línea 225), **clave legacy** que no está en STATUS_STEPS.
- `src/pages/Seguimiento.tsx`
- `src/components/admin/TrendCharts.tsx` — mapa propio de labels/colores, falta `pago_seguro_depositado`, `legalizacion_pgr`, `matricula_entregada`.
- `src/components/admin/MetricsDashboard.tsx` — mismo problema; además label viejo `"Plan Piloto + Impuesto 2%"`.

Recomendación: cada uno de estos archivos debe importar `STATUS_STEPS`/`STATUS_LABELS` desde `traspaso-status.ts` en lugar de mantener mapas locales.

### Back-end (fuera de alcance de esta sesión, pero el spec dice "single source of truth")
- `supabase/migrations/20260405003706_*.sql` — `traspasos.status text DEFAULT 'solicitud_recibida'` (sin CHECK/enum). Recomendado: en migración futura, añadir validation trigger (no CHECK constraint, según reglas del proyecto) que valide contra las 11 claves (10 + `cancelado`).
- `supabase/migrations/20260405213401_*.sql`, `20260408191938_*.sql`, `20260409204455_*.sql`, `20260409205932_*.sql`, `20260406142641_*.sql` — políticas RLS que filtran por status para notario/mensajero. Deben actualizarse para reflejar nuevos owners (notario ve `contrato_firmado`, mensajero ve `matricula_recogida` y `matricula_entregada`).

### Otras claves de status (NO son traspaso, no tocar pero documentar)
- `historial_consultas.status` → `pendiente|en_proceso|entregado` (sistema aparte).
- `escrow_payments.status`, `pago_servicio_status`, `antifraude_status`, `contracts.status` → sub-estados independientes.

## Resumen de impacto
- **Archivos a editar ahora:** 1 (`src/lib/traspaso-status.ts`)
- **Archivos consumidores a actualizar en sesión siguiente:** 11 frontend + 5 migraciones / nueva migración para validation trigger
- **Bugs descubiertos para corregir luego:** transición incorrecta en `NotarioTraspasoDetail.tsx`, claves legacy `documentos_pendientes` y `contrato_generado` en UI.
- **Riesgo:** bajo. API pública preservada; cambios solo en `roles` arrays y exports nuevos.

¿Apruebas el plan para que aplique los cambios solo en `traspaso-status.ts`?
