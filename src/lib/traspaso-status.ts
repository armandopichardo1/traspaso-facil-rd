// Unified status pipeline aligned with DGII process (10-state machine)
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

export type TraspasoStatus = typeof STATUS_STEPS[number]["key"] | "cancelado";

export type UserRole = "customer" | "gestor" | "notario" | "mensajero" | "admin";

export const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...STATUS_STEPS.map((s) => [s.key, s.label]),
  ["cancelado", "Cancelado"],
]);

// Friendly labels for client-facing progress (aligned 1:1 with STATUS_STEPS)
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

// Workflow: which role can advance to which next status
const TRANSITIONS: Record<string, { next: string; roles: UserRole[] }> = {
  solicitud_recibida: { next: "verificacion_antifraude", roles: ["admin"] },
  verificacion_antifraude: { next: "pago_seguro_depositado", roles: ["admin"] },
  pago_seguro_depositado: { next: "matricula_recogida", roles: ["admin", "mensajero"] },
  matricula_recogida: { next: "contrato_firmado", roles: ["admin", "notario"] },
  contrato_firmado: { next: "legalizacion_pgr", roles: ["admin", "gestor"] },
  legalizacion_pgr: { next: "plan_piloto", roles: ["admin", "gestor"] },
  plan_piloto: { next: "dgii_proceso", roles: ["admin"] },
  dgii_proceso: { next: "matricula_entregada", roles: ["admin", "mensajero"] },
  matricula_entregada: { next: "completado", roles: ["admin"] },
};

/**
 * Check if a given role can advance from current status to next status.
 */
export const canAdvanceTo = (current: string, next: string, role: UserRole): boolean => {
  // Admin can always cancel from any non-terminal state
  if (next === "cancelado" && role === "admin" && current !== "completado" && current !== "cancelado") return true;
  const transition = TRANSITIONS[current];
  if (!transition) return false;
  return transition.next === next && transition.roles.includes(role);
};

/**
 * Get the valid next status for a given current status and role.
 * Returns null if the role cannot advance from this status.
 */
export const getNextStatus = (current: string, role: UserRole): string | null => {
  const transition = TRANSITIONS[current];
  if (!transition) return null;
  if (!transition.roles.includes(role)) return null;
  return transition.next;
};

/**
 * Get all valid next statuses for admin (includes cancel).
 */
export const getValidNextStatuses = (current: string): string[] => {
  const result: string[] = [];
  const transition = TRANSITIONS[current];
  if (transition) result.push(transition.next);
  if (current !== "cancelado" && current !== "completado") result.push("cancelado");
  return result;
};
