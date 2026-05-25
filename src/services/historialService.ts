/**
 * historialService.ts — Intake y gestión de consultas de historial vehicular.
 *
 * MVP: las consultas se almacenan en `historial_consultas` y el admin
 * las procesa manualmente (vía WhatsApp). Este servicio aísla esa lógica
 * para que el back-end real pueda reemplazarla por una integración con
 * un proveedor de historial (DGII, aseguradoras) sin tocar UI.
 *
 * @backend Endpoints objetivo:
 *   POST   /api/historiales            -> createHistorialRequest
 *   GET    /api/historiales/mine       -> listHistorialesForUser
 *   GET    /api/historiales?status=    -> listPendingHistoriales (admin)
 *   GET    /api/historiales/:id        -> getHistorial
 *   PATCH  /api/historiales/:id        -> adminFulfillHistorial
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  HistorialConsulta,
  HistorialResultado,
  HistorialStatus,
  ServiceResult,
} from "./types";

type Row = {
  id: string;
  user_id: string | null;
  placa: string;
  telefono: string | null;
  email: string | null;
  status: string;
  resultado: unknown;
  created_at: string;
};

const toDto = (r: Row): HistorialConsulta => ({
  id: r.id,
  userId: r.user_id,
  placa: r.placa,
  telefono: r.telefono,
  email: r.email,
  status: (r.status as HistorialStatus) ?? "pendiente",
  resultado: (r.resultado as HistorialResultado | null) ?? null,
  createdAt: r.created_at,
});

export async function createHistorialRequest(input: {
  placa: string;
  telefono?: string;
  email?: string;
  userId?: string | null;
}): Promise<ServiceResult<HistorialConsulta>> {
  const { data, error } = await supabase
    .from("historial_consultas")
    .insert({
      placa: input.placa,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      user_id: input.userId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return { ok: true, data: toDto(data as Row) };
}

export async function listHistorialesForUser(
  userId: string,
): Promise<ServiceResult<HistorialConsulta[]>> {
  const { data, error } = await supabase
    .from("historial_consultas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data as Row[]).map(toDto) };
}

export async function listPendingHistoriales(): Promise<
  ServiceResult<HistorialConsulta[]>
> {
  const { data, error } = await supabase
    .from("historial_consultas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data as Row[]).map(toDto) };
}

export async function getHistorial(
  id: string,
): Promise<ServiceResult<HistorialConsulta>> {
  const { data, error } = await supabase
    .from("historial_consultas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "No encontrado" };
  return { ok: true, data: toDto(data as Row) };
}

export async function adminFulfillHistorial(
  id: string,
  resultado: HistorialResultado,
  status: HistorialStatus = "completado",
): Promise<ServiceResult<void>> {
  const { error } = await supabase
    .from("historial_consultas")
    .update({ resultado: resultado as never, status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
