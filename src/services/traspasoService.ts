/**
 * traspasoService.ts — capa de servicio del pipeline de traspaso.
 *
 * Define el contrato front/back. Hoy implementa contra Supabase; cuando
 * el back-end real esté listo, solo se reemplaza el cuerpo de cada función.
 *
 * @backend Endpoints objetivo:
 *   GET    /api/traspasos/:id                  -> getTraspaso
 *   GET    /api/traspasos/codigo/:codigo       -> getTraspasoByCodigo
 *   GET    /api/traspasos?role=&filters=       -> listTraspasosForRole
 *   GET    /api/traspasos/:id/timeline         -> getTimeline
 *   POST   /api/traspasos                      -> createTraspaso
 *   PATCH  /api/traspasos/:id                  -> updateTraspasoFields
 *   POST   /api/traspasos/:id/assign           -> assignRole
 *   POST   /api/traspasos/:id/advance          -> advanceStatus
 *   POST   /api/traspasos/:id/cancel           -> cancelTraspaso
 *   POST   /api/traspasos/:id/documentos       -> uploadDocumento
 *   GET    /api/traspasos/:id/documentos       -> listDocumentos
 *   GET    /api/documentos/:id/signed-url      -> getDocumentoSignedUrl
 *   POST   /api/traspasos/:id/firmas           -> saveFirma
 *   GET    /api/traspasos/:id/firmas           -> listFirmas
 *   POST   /api/traspasos/:id/contratos        -> generateContract
 *   GET    /api/contratos/:id                  -> getContract
 *   GET    /api/traspasos/:id/mensajes         -> listMensajes
 *   POST   /api/traspasos/:id/mensajes         -> sendMensaje
 *   PATCH  /api/traspasos/:id/mensajes/read    -> markRead
 */

import { supabase } from "@/integrations/supabase/client";
import {
  canAdvanceTo,
  cancelTraspaso as evaluateCancel,
  type TraspasoStatus,
  type UserRole,
} from "@/lib/traspaso-status";
import { triggerEscrowRefund } from "./mockBackend";
import type {
  ActorContext,
  ContractTipo,
  DocTipo,
  EditableTraspasoFields,
  Firma,
  FirmanteTipo,
  NewTraspasoInput,
  ServiceResult,
  Traspaso,
  TraspasoDoc,
  TraspasoFilters,
  TraspasoMensaje,
  TraspasoTimelineEntry,
} from "./types";

// ---------- Mappers ----------

type TraspasoRow = Record<string, unknown> & { id: string };

const toTraspaso = (r: TraspasoRow): Traspaso => ({
  id: r.id,
  codigo: (r.codigo as string) ?? null,
  status: (r.status as TraspasoStatus) ?? "solicitud_recibida",
  plan: ((r.plan as string) ?? "basico") as Traspaso["plan"],
  assetType: ((r.asset_type as string) ?? "vehiculo") as Traspaso["assetType"],
  customerId: (r.customer_id as string) ?? null,
  gestorId: (r.gestor_id as string) ?? null,
  notarioId: (r.notario_id as string) ?? null,
  mensajeroId: (r.mensajero_id as string) ?? null,

  vehiculoMarca: (r.vehiculo_marca as string) ?? null,
  vehiculoModelo: (r.vehiculo_modelo as string) ?? null,
  vehiculoAno: (r.vehiculo_ano as number) ?? null,
  vehiculoPlaca: (r.vehiculo_placa as string) ?? null,
  vehiculoColor: (r.vehiculo_color as string) ?? null,
  vehiculoChasis: (r.vehiculo_chasis as string) ?? null,

  vendedorNombre: (r.vendedor_nombre as string) ?? null,
  vendedorCedula: (r.vendedor_cedula as string) ?? null,
  vendedorTelefono: (r.vendedor_telefono as string) ?? null,
  vendedorTipoPersona:
    ((r.vendedor_tipo_persona as string) ?? "fisica") as "fisica" | "juridica",
  vendedorRnc: (r.vendedor_rnc as string) ?? null,

  compradorNombre: (r.comprador_nombre as string) ?? null,
  compradorCedula: (r.comprador_cedula as string) ?? null,
  compradorTelefono: (r.comprador_telefono as string) ?? null,
  compradorTipoPersona:
    ((r.comprador_tipo_persona as string) ?? "fisica") as "fisica" | "juridica",
  compradorRnc: (r.comprador_rnc as string) ?? null,

  precioVehiculo: (r.precio_vehiculo as number) ?? null,
  precioServicio: Number(r.precio_servicio ?? 0),

  pagoServicioStatus: ((r.pago_servicio_status as string) ??
    "pendiente") as Traspaso["pagoServicioStatus"],
  escrowStatus: ((r.escrow_status as string) ??
    "no_aplica") as Traspaso["escrowStatus"],
  antifraudeStatus: ((r.antifraude_status as string) ??
    "pendiente") as Traspaso["antifraudeStatus"],
  antifraudeNotas: (r.antifraude_notas as string) ?? null,

  fechaActoVenta: (r.fecha_acto_venta as string) ?? null,
  medioPago: (r.medio_pago as string) ?? null,
  tieneApoderado: Boolean(r.tiene_apoderado),
  apoderadoNombre: (r.apoderado_nombre as string) ?? null,
  apoderadoCedula: (r.apoderado_cedula as string) ?? null,
  esTraspasoFamiliar: Boolean(r.es_traspaso_familiar),
  notasInternas: (r.notas_internas as string) ?? null,

  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

// ---------- READ ----------

export async function getTraspaso(id: string): Promise<ServiceResult<Traspaso>> {
  const { data, error } = await supabase
    .from("traspasos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "No encontrado" };
  return { ok: true, data: toTraspaso(data as TraspasoRow) };
}

export async function getTraspasoByCodigo(
  codigo: string,
): Promise<ServiceResult<Traspaso>> {
  const { data, error } = await supabase
    .from("traspasos")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "No encontrado" };
  return { ok: true, data: toTraspaso(data as TraspasoRow) };
}

/**
 * Columnas por rol. RLS en Supabase ya restringe qué filas puede leer cada
 * rol (ver políticas en traspasos); aquí además limitamos las COLUMNAS para
 * reducir payload y minimizar exposición de campos sensibles
 * (notas_internas, antifraude_notas, márgenes) a roles que no los necesitan.
 *
 * - customer / admin: vista completa (toTraspaso usa todos los campos).
 * - mensajero: solo lo necesario para la entrega (vehículo, partes, status).
 * - notario: contrato + partes + status (sin financieros ni notas internas).
 * - gestor: operacional + margen, sin notas crudas de antifraude.
 */
const SELECT_FULL = "*";

const SELECT_MENSAJERO = [
  "id", "codigo", "status", "plan", "asset_type",
  "customer_id", "mensajero_id",
  "vehiculo_marca", "vehiculo_modelo", "vehiculo_ano",
  "vehiculo_placa", "vehiculo_color", "vehiculo_chasis",
  "vendedor_nombre", "vendedor_telefono",
  "comprador_nombre", "comprador_telefono",
  "created_at", "updated_at",
].join(",");

const SELECT_NOTARIO = [
  "id", "codigo", "status", "plan", "asset_type",
  "customer_id", "notario_id",
  "vehiculo_marca", "vehiculo_modelo", "vehiculo_ano",
  "vehiculo_placa", "vehiculo_color", "vehiculo_chasis",
  "vendedor_nombre", "vendedor_cedula", "vendedor_telefono",
  "vendedor_tipo_persona", "vendedor_rnc",
  "comprador_nombre", "comprador_cedula", "comprador_telefono",
  "comprador_tipo_persona", "comprador_rnc",
  "fecha_acto_venta", "medio_pago",
  "tiene_apoderado", "apoderado_nombre", "apoderado_cedula",
  "es_traspaso_familiar",
  "created_at", "updated_at",
].join(",");

const SELECT_GESTOR = [
  "id", "codigo", "status", "plan", "asset_type",
  "customer_id", "gestor_id", "notario_id", "mensajero_id",
  "vehiculo_marca", "vehiculo_modelo", "vehiculo_ano",
  "vehiculo_placa", "vehiculo_color", "vehiculo_chasis",
  "vendedor_nombre", "vendedor_cedula", "vendedor_telefono",
  "vendedor_tipo_persona", "vendedor_rnc",
  "comprador_nombre", "comprador_cedula", "comprador_telefono",
  "comprador_tipo_persona", "comprador_rnc",
  "precio_vehiculo", "precio_servicio",
  "pago_servicio_status", "escrow_status",
  "antifraude_status", // status sí, notas crudas NO
  "gestor_commission_pct", "gestor_costs_rd",
  "fecha_acto_venta", "medio_pago",
  "tiene_apoderado", "apoderado_nombre", "apoderado_cedula",
  "es_traspaso_familiar",
  "created_at", "updated_at",
].join(",");

function selectColumnsForRole(role: UserRole): string {
  switch (role) {
    case "mensajero": return SELECT_MENSAJERO;
    case "notario":   return SELECT_NOTARIO;
    case "gestor":    return SELECT_GESTOR;
    case "customer":
    case "admin":
    default:          return SELECT_FULL;
  }
}

export async function listTraspasosForRole(
  role: UserRole,
  userId: string,
  filters?: TraspasoFilters,
): Promise<ServiceResult<Traspaso[]>> {
  const columns = selectColumnsForRole(role);
  let q = supabase.from("traspasos").select(columns).order("created_at", { ascending: false });

  // RLS hace el filtrado fino server-side; aquí restringimos también por
  // columna indexada para reducir payload. Las políticas en traspasos
  // garantizan que un rol nunca recibe filas que no le pertenecen aunque
  // alguien manipule el filtro del cliente.
  if (role === "customer") q = q.eq("customer_id", userId);
  else if (role === "gestor") q = q.eq("gestor_id", userId);
  else if (role === "notario") q = q.eq("notario_id", userId);
  else if (role === "mensajero") q = q.eq("mensajero_id", userId);

  if (filters?.status?.length) q = q.in("status", filters.status);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  let rows = (data as unknown as TraspasoRow[]).map(toTraspaso);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (t) =>
        t.codigo?.toLowerCase().includes(s) ||
        t.vehiculoPlaca?.toLowerCase().includes(s) ||
        t.compradorNombre?.toLowerCase().includes(s) ||
        t.vendedorNombre?.toLowerCase().includes(s),
    );
  }
  return { ok: true, data: rows };
}

export async function getTimeline(
  traspasoId: string,
): Promise<ServiceResult<TraspasoTimelineEntry[]>> {
  const { data, error } = await supabase
    .from("traspaso_timeline")
    .select("*")
    .eq("traspaso_id", traspasoId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      traspasoId: r.traspaso_id as string,
      status: r.status as string,
      nota: (r.nota as string) ?? null,
      createdBy: (r.created_by as string) ?? null,
      createdAt: r.created_at as string,
    })),
  };
}

// ---------- WRITE ----------

export async function createTraspaso(
  input: NewTraspasoInput,
): Promise<ServiceResult<Traspaso>> {
  // TODO_BACKEND: sellar el precio leyendo pricing_config en el server.
  const { data, error } = await supabase
    .from("traspasos")
    .insert({
      customer_id: input.customerId,
      plan: input.plan,
      asset_type: input.assetType ?? "vehiculo",
      vehiculo_marca: input.vehiculo?.marca ?? null,
      vehiculo_modelo: input.vehiculo?.modelo ?? null,
      vehiculo_ano: input.vehiculo?.ano ?? null,
      vehiculo_placa: input.vehiculo?.placa ?? null,
      vehiculo_color: input.vehiculo?.color ?? null,
      vehiculo_chasis: input.vehiculo?.chasis ?? null,
      vendedor_nombre: input.vendedor?.nombre ?? null,
      vendedor_cedula: input.vendedor?.cedula ?? null,
      vendedor_telefono: input.vendedor?.telefono ?? null,
      vendedor_tipo_persona: input.vendedor?.tipoPersona ?? "fisica",
      vendedor_rnc: input.vendedor?.rnc ?? null,
      comprador_nombre: input.comprador?.nombre ?? null,
      comprador_cedula: input.comprador?.cedula ?? null,
      comprador_telefono: input.comprador?.telefono ?? null,
      comprador_tipo_persona: input.comprador?.tipoPersona ?? "fisica",
      comprador_rnc: input.comprador?.rnc ?? null,
      precio_vehiculo: input.precioVehiculo ?? null,
      es_traspaso_familiar: input.esTraspasoFamiliar ?? false,
      tipo_vehiculo: input.tipoVehiculo ?? "vehiculo_motor",
      precio_servicio: input.precioServicio ?? (input.plan === "express" ? 5000 : 3500),
      escrow_status: input.escrowStatus ?? "no_aplica",
    })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return { ok: true, data: toTraspaso(data as TraspasoRow) };
}

export async function updateTraspasoFields(
  id: string,
  patch: Partial<EditableTraspasoFields>,
): Promise<ServiceResult<Traspaso>> {
  // Convierte camelCase -> snake_case del subset editable.
  const map: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) map[k] = v;
  };
  set("plan", patch.plan);
  set("asset_type", patch.assetType);
  set("gestor_id", patch.gestorId);
  set("notario_id", patch.notarioId);
  set("mensajero_id", patch.mensajeroId);
  set("vehiculo_marca", patch.vehiculoMarca);
  set("vehiculo_modelo", patch.vehiculoModelo);
  set("vehiculo_ano", patch.vehiculoAno);
  set("vehiculo_placa", patch.vehiculoPlaca);
  set("vehiculo_color", patch.vehiculoColor);
  set("vehiculo_chasis", patch.vehiculoChasis);
  set("vendedor_nombre", patch.vendedorNombre);
  set("vendedor_cedula", patch.vendedorCedula);
  set("vendedor_telefono", patch.vendedorTelefono);
  set("vendedor_tipo_persona", patch.vendedorTipoPersona);
  set("vendedor_rnc", patch.vendedorRnc);
  set("comprador_nombre", patch.compradorNombre);
  set("comprador_cedula", patch.compradorCedula);
  set("comprador_telefono", patch.compradorTelefono);
  set("comprador_tipo_persona", patch.compradorTipoPersona);
  set("comprador_rnc", patch.compradorRnc);
  set("precio_vehiculo", patch.precioVehiculo);
  set("precio_servicio", patch.precioServicio);
  set("antifraude_status", patch.antifraudeStatus);
  set("antifraude_notas", patch.antifraudeNotas);
  set("fecha_acto_venta", patch.fechaActoVenta);
  set("medio_pago", patch.medioPago);
  set("tiene_apoderado", patch.tieneApoderado);
  set("apoderado_nombre", patch.apoderadoNombre);
  set("apoderado_cedula", patch.apoderadoCedula);
  set("es_traspaso_familiar", patch.esTraspasoFamiliar);
  set("notas_internas", patch.notasInternas);

  const { data, error } = await supabase
    .from("traspasos")
    .update(map as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return { ok: true, data: toTraspaso(data as TraspasoRow) };
}

export async function assignRole(
  id: string,
  role: "gestor" | "notario" | "mensajero",
  userId: string,
): Promise<ServiceResult<void>> {
  const col =
    role === "gestor" ? "gestor_id" : role === "notario" ? "notario_id" : "mensajero_id";
  const { error } = await supabase.from("traspasos").update({ [col]: userId } as never).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

// ---------- State machine ----------

export async function advanceStatus(
  id: string,
  toStatus: TraspasoStatus,
  actor: ActorContext,
  options?: { nota?: string; evidenceUrl?: string },
): Promise<ServiceResult<Traspaso>> {
  const current = await getTraspaso(id);
  if (!current.ok) return current;

  if (!canAdvanceTo(current.data.status, toStatus, actor.role)) {
    return {
      ok: false,
      error: `Transición no permitida: ${current.data.status} -> ${toStatus} para rol ${actor.role}`,
    };
  }

  const { error: upErr } = await supabase
    .from("traspasos")
    .update({ status: toStatus })
    .eq("id", id);
  if (upErr) return { ok: false, error: upErr.message };

  await supabase.from("traspaso_timeline").insert({
    traspaso_id: id,
    status: toStatus,
    nota: options?.nota ?? options?.evidenceUrl ?? null,
    created_by: actor.id,
    actor_role: actor.role,
  } as never);

  // Hook: al completar, liberar escrow (mock).
  if (toStatus === "completado") {
    const { releaseEscrowToVendor } = await import("./mockBackend");
    await releaseEscrowToVendor(id);
  }

  return getTraspaso(id);
}

export async function cancelTraspaso(
  id: string,
  actor: ActorContext,
  reason: string,
): Promise<ServiceResult<{ traspaso: Traspaso; refundTriggered: boolean }>> {
  const current = await getTraspaso(id);
  if (current.ok === false) return { ok: false, error: current.error };

  const decision = evaluateCancel(current.data.status, actor.role, reason);
  if (!decision.ok) return { ok: false, error: decision.error ?? "No autorizado" };

  const { error } = await supabase
    .from("traspasos")
    .update({ status: "cancelado", notas_internas: reason })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("traspaso_timeline").insert({
    traspaso_id: id,
    status: "cancelado",
    nota: reason,
    created_by: actor.id,
    actor_role: actor.role,
  } as never);

  let refundTriggered = false;
  if (decision.needsRefund) {
    const r = await triggerEscrowRefund(id, reason);
    refundTriggered = r.ok;
  }

  const refreshed = await getTraspaso(id);
  if (refreshed.ok === false) return { ok: false, error: refreshed.error };
  return { ok: true, data: { traspaso: refreshed.data, refundTriggered } };
}

// ---------- Documentos ----------

export async function uploadDocumento(
  traspasoId: string,
  tipo: DocTipo,
  file: File,
): Promise<ServiceResult<TraspasoDoc>> {
  const path = `${traspasoId}/${tipo}-${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage
    .from("documentos")
    .upload(path, file, { upsert: false });
  if (upErr) return { ok: false, error: upErr.message };

  const { data, error } = await supabase
    .from("traspaso_documentos")
    .insert({ traspaso_id: traspasoId, tipo, file_url: path })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return {
    ok: true,
    data: {
      id: data.id as string,
      traspasoId: data.traspaso_id as string,
      tipo: data.tipo as DocTipo,
      fileUrl: data.file_url as string,
      uploadedAt: data.uploaded_at as string,
    },
  };
}

export async function listDocumentos(
  traspasoId: string,
): Promise<ServiceResult<TraspasoDoc[]>> {
  const { data, error } = await supabase
    .from("traspaso_documentos")
    .select("*")
    .eq("traspaso_id", traspasoId)
    .order("uploaded_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      traspasoId: r.traspaso_id as string,
      tipo: r.tipo as DocTipo,
      fileUrl: r.file_url as string,
      uploadedAt: r.uploaded_at as string,
    })),
  };
}

export async function getDocumentoSignedUrl(
  docId: string,
): Promise<ServiceResult<string>> {
  const { data: doc, error: dErr } = await supabase
    .from("traspaso_documentos")
    .select("file_url")
    .eq("id", docId)
    .maybeSingle();
  if (dErr || !doc) return { ok: false, error: dErr?.message ?? "No encontrado" };
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(doc.file_url as string, 60 * 60);
  if (error || !data) return { ok: false, error: error?.message ?? "Error firmando URL" };
  return { ok: true, data: data.signedUrl };
}

// ---------- Firmas ----------

export async function saveFirma(input: {
  traspasoId: string;
  contratoId?: string | null;
  tipoFirmante: FirmanteTipo;
  firmaImagenBlob: Blob;
  nombre: string;
  cedula?: string;
}): Promise<ServiceResult<Firma>> {
  const path = `${input.traspasoId}/firma-${input.tipoFirmante}-${Date.now()}.png`;
  const { error: upErr } = await supabase.storage
    .from("documentos")
    .upload(path, input.firmaImagenBlob, { upsert: false, contentType: "image/png" });
  if (upErr) return { ok: false, error: upErr.message };

  // Hash determinístico simple (tamaño + timestamp). TODO_BACKEND: SHA-256 server-side.
  const firmaHash = `${input.tipoFirmante}-${input.firmaImagenBlob.size}-${Date.now()}`;

  const { data, error } = await supabase
    .from("traspaso_firmas")
    .insert({
      traspaso_id: input.traspasoId,
      contrato_id: input.contratoId ?? null,
      tipo_firmante: input.tipoFirmante,
      nombre_firmante: input.nombre,
      cedula_firmante: input.cedula ?? null,
      firma_imagen_url: path,
      firma_hash: firmaHash,
    })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return {
    ok: true,
    data: {
      id: data.id as string,
      traspasoId: data.traspaso_id as string,
      contratoId: (data.contrato_id as string) ?? null,
      tipoFirmante: data.tipo_firmante as FirmanteTipo,
      nombreFirmante: data.nombre_firmante as string,
      cedulaFirmante: (data.cedula_firmante as string) ?? null,
      firmaImagenUrl: data.firma_imagen_url as string,
      firmaHash: data.firma_hash as string,
      createdAt: data.created_at as string,
    },
  };
}

export async function listFirmas(
  traspasoId: string,
): Promise<ServiceResult<Firma[]>> {
  const { data, error } = await supabase
    .from("traspaso_firmas")
    .select("*")
    .eq("traspaso_id", traspasoId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      traspasoId: r.traspaso_id as string,
      contratoId: (r.contrato_id as string) ?? null,
      tipoFirmante: r.tipo_firmante as FirmanteTipo,
      nombreFirmante: r.nombre_firmante as string,
      cedulaFirmante: (r.cedula_firmante as string) ?? null,
      firmaImagenUrl: r.firma_imagen_url as string,
      firmaHash: r.firma_hash as string,
      createdAt: r.created_at as string,
    })),
  };
}

// ---------- Contratos ----------

export async function generateContract(
  traspasoId: string,
  tipo: ContractTipo,
  contenidoHtml: string,
): Promise<ServiceResult<{ id: string; html: string }>> {
  // TODO_BACKEND: el server real generará el HTML del contrato a partir
  // de templates oficiales. Hoy el caller pasa el HTML ya renderizado.
  const { data, error } = await supabase
    .from("traspaso_contratos")
    .insert({ traspaso_id: traspasoId, tipo, contenido_html: contenidoHtml })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return {
    ok: true,
    data: { id: data.id as string, html: data.contenido_html as string },
  };
}

export async function getContract(
  contractId: string,
): Promise<ServiceResult<{ html: string; pdfUrl: string | null }>> {
  const { data, error } = await supabase
    .from("traspaso_contratos")
    .select("contenido_html, pdf_url")
    .eq("id", contractId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "No encontrado" };
  return {
    ok: true,
    data: {
      html: data.contenido_html as string,
      pdfUrl: (data.pdf_url as string) ?? null,
    },
  };
}

// ---------- Mensajes ----------

export async function listMensajes(
  traspasoId: string,
): Promise<ServiceResult<TraspasoMensaje[]>> {
  const { data, error } = await supabase
    .from("traspaso_mensajes")
    .select("*")
    .eq("traspaso_id", traspasoId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      traspasoId: r.traspaso_id as string,
      senderId: r.sender_id as string,
      mensaje: r.mensaje as string,
      leido: Boolean(r.leido),
      createdAt: r.created_at as string,
    })),
  };
}

export async function sendMensaje(
  traspasoId: string,
  senderId: string,
  text: string,
): Promise<ServiceResult<TraspasoMensaje>> {
  const { data, error } = await supabase
    .from("traspaso_mensajes")
    .insert({ traspaso_id: traspasoId, sender_id: senderId, mensaje: text })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error" };
  return {
    ok: true,
    data: {
      id: data.id as string,
      traspasoId: data.traspaso_id as string,
      senderId: data.sender_id as string,
      mensaje: data.mensaje as string,
      leido: Boolean(data.leido),
      createdAt: data.created_at as string,
    },
  };
}

export async function markRead(
  traspasoId: string,
  readerId: string,
): Promise<ServiceResult<void>> {
  const { error } = await supabase
    .from("traspaso_mensajes")
    .update({ leido: true })
    .eq("traspaso_id", traspasoId)
    .neq("sender_id", readerId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
