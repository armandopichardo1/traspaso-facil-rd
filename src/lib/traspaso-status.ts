/**
 * SINGLE SOURCE OF TRUTH para la máquina de 10 estados del traspaso.
 *
 * Este archivo DEBE estar sincronizado con:
 *   - KNOWLEDGE.md §4.2 (tabla de estados + dueños)
 *   - El enum/validation trigger de `traspasos.status` en el back-end
 *   - Las políticas RLS por rol en supabase/migrations
 *
 * Reglas:
 *   - No renombrar claves sin migración coordinada en back-end.
 *   - No reordenar pasos: `CLIENT_PROGRESS_LABELS` y `getProgress` dependen del orden.
 *   - `cancelado` es terminal y NO está en STATUS_STEPS (es un estado fuera de pipeline).
 *   - Si se cancela tras `pago_seguro_depositado`, el consumidor DEBE disparar escrow-refund
 *     (ver `requiresEscrowRefund` y `cancelTraspaso`).
 */

export const STATUS_STEPS = [
  { key: "solicitud_recibida", label: "Solicitud Recibida", owner: "cliente", desc: "Solicitud registrada en el sistema" },
  { key: "verificacion_antifraude", label: "Verificación Antifraude", owner: "admin", desc: "Admin revisa selfie vs cédula" },
  { key: "pago_seguro_depositado", label: "Pago Seguro Depositado", owner: "admin/cliente", desc: "Cliente depositó el pago en escrow; admin confirma" },
  { key: "matricula_recogida", label: "Matrícula Recogida", owner: "mensajero", desc: "Mensajero recogió la matrícula vieja" },
  { key: "contrato_firmado", label: "Contrato Firmado y Notariado", owner: "notario", desc: "Notario certificó la firma del contrato" },
  { key: "legalizacion_pgr", label: "Legalización PGR + Banco de Reservas", owner: "gestor/admin", desc: "Legalización en PGR y pago en Banco de Reservas" },
  { key: "plan_piloto", label: "CENARVE / Plan Piloto", owner: "gestor/admin", desc: "Inspección CENARVE y plan piloto DGII" },
  { key: "dgii_proceso", label: "Expediente en DGII", owner: "admin", desc: "Expediente entregado a DGII para procesamiento" },
  { key: "matricula_entregada", label: "Matrícula Entregada", owner: "mensajero", desc: "Mensajero entregó la nueva matrícula al cliente" },
  { key: "completado", label: "Completado", owner: "admin", desc: "Traspaso finalizado" },
] as const;

export type TraspasoStatusKey = typeof STATUS_STEPS[number]["key"];
export type TraspasoStatus = TraspasoStatusKey | "cancelado";

export type UserRole = "customer" | "gestor" | "notario" | "mensajero" | "admin";

export const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...STATUS_STEPS.map((s) => [s.key, s.label]),
  ["cancelado", "Cancelado"],
]);

// Etiquetas cortas para barra de progreso del cliente (alineadas 1:1 con STATUS_STEPS)
export const CLIENT_PROGRESS_LABELS = [
  "SOLICITUD",
  "ANTIFRAUDE",
  "PAGO",
  "RECOGIDA",
  "FIRMA",
  "PGR",
  "PLAN PILOTO",
  "DGII",
  "ENTREGA",
  "COMPLETADO",
];

export const statusColor = (s: string) => {
  if (s === "completado") return "bg-green-100 text-green-800";
  if (s === "cancelado") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export const getProgress = (status: string) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : ((idx + 1) / STATUS_STEPS.length) * 100;
};

/**
 * Transiciones permitidas. `roles` lista quién PUEDE avanzar el paso.
 * Roles alineados con KNOWLEDGE.md §4.2. `admin` es comodín solo donde el spec lo permite
 * (apoyo operativo en pasos de mensajero/notario/gestor).
 */
const TRANSITIONS: Record<TraspasoStatusKey, { next: TraspasoStatusKey; roles: UserRole[] }> = {
  solicitud_recibida:     { next: "verificacion_antifraude", roles: ["admin"] },
  verificacion_antifraude:{ next: "pago_seguro_depositado",  roles: ["admin"] },
  pago_seguro_depositado: { next: "matricula_recogida",      roles: ["admin"] },
  matricula_recogida:     { next: "contrato_firmado",        roles: ["mensajero", "admin"] },
  contrato_firmado:       { next: "legalizacion_pgr",        roles: ["notario", "admin"] },
  legalizacion_pgr:       { next: "plan_piloto",             roles: ["gestor", "admin"] },
  plan_piloto:            { next: "dgii_proceso",            roles: ["gestor", "admin"] },
  dgii_proceso:           { next: "matricula_entregada",     roles: ["admin"] },
  matricula_entregada:    { next: "completado",              roles: ["mensajero", "admin"] },
  completado:             { next: "completado",              roles: [] }, // terminal
};

const TERMINAL: TraspasoStatus[] = ["completado", "cancelado"];

export const isTerminal = (status: string): boolean =>
  (TERMINAL as string[]).includes(status);

export const getOwner = (status: string): string => {
  const step = STATUS_STEPS.find((s) => s.key === status);
  return step?.owner ?? (status === "cancelado" ? "admin" : "—");
};

/**
 * ¿Cancelar desde este estado requiere disparar refund de escrow?
 * True si el pago seguro ya fue depositado y el traspaso aún no terminó.
 */
export const requiresEscrowRefund = (current: string): boolean => {
  if (current === "completado" || current === "cancelado") return false;
  const idx = STATUS_STEPS.findIndex((s) => s.key === current);
  const payIdx = STATUS_STEPS.findIndex((s) => s.key === "pago_seguro_depositado");
  return idx >= payIdx && payIdx !== -1;
};

/**
 * Check if a given role can advance from current status to next status.
 */
export const canAdvanceTo = (current: string, next: string, role: UserRole): boolean => {
  // Solo admin puede cancelar, y solo desde un estado no terminal
  if (next === "cancelado") {
    return role === "admin" && !isTerminal(current);
  }
  const transition = TRANSITIONS[current as TraspasoStatusKey];
  if (!transition) return false;
  return transition.next === next && transition.roles.includes(role);
};

/**
 * Get the valid next status for a given current status and role.
 * Returns null if the role cannot advance from this status.
 */
export const getNextStatus = (current: string, role: UserRole): TraspasoStatusKey | null => {
  const transition = TRANSITIONS[current as TraspasoStatusKey];
  if (!transition || transition.roles.length === 0) return null;
  if (!transition.roles.includes(role)) return null;
  return transition.next;
};

/**
 * Get all valid next statuses for the pipeline (includes cancel if reachable).
 */
export const getValidNextStatuses = (current: string): string[] => {
  const result: string[] = [];
  const transition = TRANSITIONS[current as TraspasoStatusKey];
  if (transition && transition.roles.length > 0) result.push(transition.next);
  if (!isTerminal(current)) result.push("cancelado");
  return result;
};

/**
 * Función pura para evaluar una solicitud de cancelación.
 * El consumidor debe:
 *   1. Validar `ok`. Si es false, mostrar `error`.
 *   2. Persistir el cambio de status + `reason` en el log/auditoría.
 *   3. Si `needsRefund` es true, invocar la edge function de escrow-refund.
 */
export const cancelTraspaso = (
  current: string,
  role: UserRole,
  reason: string,
): { ok: boolean; needsRefund: boolean; error?: string } => {
  if (isTerminal(current)) {
    return { ok: false, needsRefund: false, error: "El traspaso ya está en estado terminal" };
  }
  if (role !== "admin") {
    return { ok: false, needsRefund: false, error: "Solo un admin puede cancelar un traspaso" };
  }
  if (!reason || reason.trim().length < 3) {
    return { ok: false, needsRefund: false, error: "Debes indicar una razón válida para cancelar" };
  }
  return { ok: true, needsRefund: requiresEscrowRefund(current) };
};
