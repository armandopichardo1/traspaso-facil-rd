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

export const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...STATUS_STEPS.map((s) => [s.key, s.label]),
  ["cancelado", "Cancelado"],
]);

export const statusColor = (s: string) => {
  if (s === "completado") return "bg-green-100 text-green-800";
  if (s === "cancelado") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export const getProgress = (status: string) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : ((idx + 1) / STATUS_STEPS.length) * 100;
};
