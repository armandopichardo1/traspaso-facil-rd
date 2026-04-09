// Unified status pipeline aligned with DGII process
export const STATUS_STEPS = [
  { key: "solicitud_recibida", label: "Solicitud Recibida", owner: "cliente/gestor", desc: "Solicitud registrada en el sistema" },
  { key: "documentos_completos", label: "Documentos Completos", owner: "gestor", desc: "Gestor verificó que todos los docs están listos" },
  { key: "contrato_generado", label: "Contrato Generado", owner: "gestor", desc: "Contrato de compraventa generado" },
  { key: "contrato_firmado", label: "Contrato Firmado", owner: "notario", desc: "Notario certificó la firma del contrato" },
  { key: "verificacion_antifraude", label: "Verificación Antifraude", owner: "admin", desc: "Admin revisa selfie vs cédula" },
  { key: "matricula_recogida", label: "Matrícula Recogida", owner: "mensajero", desc: "Mensajero recogió la matrícula vieja" },
  { key: "dgii_proceso", label: "DGII en Proceso", owner: "admin/gestor", desc: "Documentos entregados a DGII" },
  { key: "completado", label: "Completado", owner: "admin", desc: "Nueva matrícula entregada" },
] as const;

export type TraspasoStatus = typeof STATUS_STEPS[number]["key"] | "cancelado";

export type UserRole = "customer" | "gestor" | "notario" | "mensajero" | "admin";

export const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...STATUS_STEPS.map((s) => [s.key, s.label]),
  ["cancelado", "Cancelado"],
]);

// Friendly labels for client-facing progress
export const CLIENT_PROGRESS_LABELS = ["SOLICITUD", "DOCUMENTOS", "CONTRATO", "FIRMA", "VERIFICACIÓN", "RECOGIDA", "DGII", "COMPLETADO"];

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
  solicitud_recibida: { next: "documentos_completos", roles: ["admin", "gestor"] },
  documentos_completos: { next: "contrato_generado", roles: ["admin", "gestor"] },
  contrato_generado: { next: "contrato_firmado", roles: ["admin", "notario"] },
  contrato_firmado: { next: "verificacion_antifraude", roles: ["admin"] },
  verificacion_antifraude: { next: "matricula_recogida", roles: ["admin", "mensajero"] },
  matricula_recogida: { next: "dgii_proceso", roles: ["admin", "gestor"] },
  dgii_proceso: { next: "completado", roles: ["admin"] },
};

/**
 * Check if a given role can advance from current status to next status.
 */
export const canAdvanceTo = (current: string, next: string, role: UserRole): boolean => {
  // Admin can always cancel
  if (next === "cancelado" && role === "admin") return true;
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
