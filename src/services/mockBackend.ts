/**
 * mockBackend.ts — Simulaciones determinísticas para la demo.
 *
 * Todo aquí está marcado con `TODO_BACKEND:` porque será reemplazado por
 * el back-end real (pagos con procesador, escrow custodio, scraping DGII,
 * antifraude con IA, envío WhatsApp con Twilio/Meta).
 *
 * Reglas de la demo:
 *  - Latencia simulada fija (~600ms) para que se sienta "real".
 *  - Mocks son DETERMINÍSTICOS: siempre OK. Cuando se necesite probar el
 *    camino de cancelación/refund, se hace desde el botón "Cancelar" del admin.
 *  - Persistimos en las columnas existentes de `traspasos`
 *    (`escrow_status`, `pago_servicio_status`) — no creamos tablas mock.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  EscrowSnapshot,
  ServiceResult,
  EscrowStatus,
  PagoServicioStatus,
} from "./types";

const FAKE_LATENCY_MS = 600;
const sleep = (ms = FAKE_LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

async function readEscrow(traspasoId: string): Promise<EscrowSnapshot | null> {
  const { data, error } = await supabase
    .from("traspasos")
    .select("id, escrow_status, pago_servicio_status, precio_servicio")
    .eq("id", traspasoId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    traspasoId: data.id,
    escrowStatus: (data.escrow_status as EscrowStatus) ?? "no_aplica",
    pagoServicioStatus:
      (data.pago_servicio_status as PagoServicioStatus) ?? "pendiente",
    amountRD: Number(data.precio_servicio ?? 0),
  };
}

async function writeEscrow(
  traspasoId: string,
  patch: { escrow_status?: EscrowStatus; pago_servicio_status?: PagoServicioStatus },
): Promise<ServiceResult<EscrowSnapshot>> {
  const { error } = await supabase
    .from("traspasos")
    .update(patch)
    .eq("id", traspasoId);
  if (error) return { ok: false, error: error.message };
  const snap = await readEscrow(traspasoId);
  if (!snap) return { ok: false, error: "Traspaso no encontrado" };
  return { ok: true, data: snap };
}

/**
 * @backend POST /api/payments/escrow/deposit
 * TODO_BACKEND: Reemplazar por integración con procesador real (Azul/CardNet)
 *               + custodia escrow. Hoy solo flippa estado en DB.
 */
export async function createEscrowDeposit(
  traspasoId: string,
  _amountRD: number,
): Promise<ServiceResult<EscrowSnapshot>> {
  await sleep();
  return writeEscrow(traspasoId, {
    escrow_status: "depositado",
    pago_servicio_status: "pagado",
  });
}

/** @backend GET /api/payments/escrow/:traspasoId */
export async function getEscrowSnapshot(
  traspasoId: string,
): Promise<ServiceResult<EscrowSnapshot>> {
  const snap = await readEscrow(traspasoId);
  if (!snap) return { ok: false, error: "Traspaso no encontrado" };
  return { ok: true, data: snap };
}

/**
 * @backend POST /api/payments/escrow/:traspasoId/confirm
 * TODO_BACKEND: confirmación manual de admin de que el depósito llegó.
 */
export async function confirmEscrowReceived(
  traspasoId: string,
): Promise<ServiceResult<EscrowSnapshot>> {
  await sleep();
  return writeEscrow(traspasoId, { escrow_status: "depositado" });
}

/**
 * @backend POST /api/payments/escrow/:traspasoId/release
 * TODO_BACKEND: libera fondos al vendedor cuando el traspaso completa.
 */
export async function releaseEscrowToVendor(
  traspasoId: string,
): Promise<ServiceResult<EscrowSnapshot>> {
  await sleep();
  return writeEscrow(traspasoId, { escrow_status: "liberado" });
}

/**
 * @backend POST /api/payments/escrow/:traspasoId/refund
 * TODO_BACKEND: reembolso al comprador si se cancela post-depósito.
 */
export async function triggerEscrowRefund(
  traspasoId: string,
  _reason: string,
): Promise<ServiceResult<EscrowSnapshot>> {
  await sleep();
  return writeEscrow(traspasoId, {
    escrow_status: "reembolsado",
    pago_servicio_status: "reembolsado",
  });
}

/**
 * @backend POST /api/antifraude/run
 * TODO_BACKEND: Modelo IA que compara selfie vs cédula. Mock = siempre OK.
 */
export async function runAntifraudeCheck(
  _traspasoId: string,
): Promise<ServiceResult<{ score: number; passed: boolean }>> {
  await sleep();
  return { ok: true, data: { score: 0.97, passed: true } };
}

/**
 * @backend GET /api/dgii/status/:traspasoId
 * TODO_BACKEND: scraping/integración con DGII. Mock devuelve etapa fija.
 */
export async function fetchDgiiStatus(
  _traspasoId: string,
): Promise<ServiceResult<{ stage: string; estimatedDate: string }>> {
  await sleep();
  const eta = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return { ok: true, data: { stage: "En cola DGII", estimatedDate: eta } };
}

/**
 * @backend POST /api/notifications/whatsapp
 * TODO_BACKEND: Twilio/Meta WhatsApp Business. Mock solo loggea.
 */
export async function sendWhatsAppNotification(
  to: string,
  template: string,
  vars: Record<string, string>,
): Promise<ServiceResult<void>> {
  await sleep(200);
  // eslint-disable-next-line no-console
  console.info("[mockBackend.WhatsApp]", { to, template, vars });
  return { ok: true, data: undefined };
}
