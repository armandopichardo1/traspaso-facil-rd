/**
 * Front-end DTOs for the traspaso domain.
 *
 * These types are INDEPENDENT of the Supabase schema on purpose:
 * the service layer maps Supabase rows -> these DTOs so that when the
 * real back-end (separate REST API) replaces Supabase, only the service
 * layer changes — UI keeps consuming these stable shapes.
 *
 * @backend Mirror these shapes in the real back-end's response payloads.
 */

import type { TraspasoStatus, UserRole } from "@/lib/traspaso-status";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------- Traspaso ----------

export type AssetType = "vehiculo" | "inmueble" | "moto" | "embarcacion";
export type Plan = "basico" | "express";
export type EscrowStatus =
  | "no_aplica"
  | "pendiente"
  | "depositado"
  | "liberado"
  | "reembolsado";
export type PagoServicioStatus = "pendiente" | "pagado" | "reembolsado";

export interface Traspaso {
  id: string;
  codigo: string | null;
  status: TraspasoStatus;
  plan: Plan;
  assetType: AssetType;
  customerId: string | null;
  gestorId: string | null;
  notarioId: string | null;
  mensajeroId: string | null;

  // Vehículo
  vehiculoMarca: string | null;
  vehiculoModelo: string | null;
  vehiculoAno: number | null;
  vehiculoPlaca: string | null;
  vehiculoColor: string | null;
  vehiculoChasis: string | null;

  // Partes
  vendedorNombre: string | null;
  vendedorCedula: string | null;
  vendedorTelefono: string | null;
  vendedorTipoPersona: "fisica" | "juridica";
  vendedorRnc: string | null;

  compradorNombre: string | null;
  compradorCedula: string | null;
  compradorTelefono: string | null;
  compradorTipoPersona: "fisica" | "juridica";
  compradorRnc: string | null;

  // Precios
  precioVehiculo: number | null;
  precioServicio: number;

  // Estados auxiliares
  pagoServicioStatus: PagoServicioStatus;
  escrowStatus: EscrowStatus;
  antifraudeStatus: "pendiente" | "aprobado" | "rechazado";
  antifraudeNotas: string | null;

  // Misc
  fechaActoVenta: string | null;
  medioPago: string | null;
  tieneApoderado: boolean;
  apoderadoNombre: string | null;
  apoderadoCedula: string | null;
  esTraspasoFamiliar: boolean;
  notasInternas: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface NewTraspasoInput {
  customerId: string;
  plan: Plan;
  assetType?: AssetType;
  /** TODO_BACKEND: el backend real valida tipo_vehiculo contra catálogo */
  tipoVehiculo?: string;
  vehiculo?: {
    marca?: string;
    modelo?: string;
    ano?: number;
    placa?: string;
    color?: string;
    chasis?: string;
  };
  vendedor?: Partial<{
    nombre: string;
    cedula: string;
    telefono: string;
    tipoPersona: "fisica" | "juridica";
    rnc: string;
  }>;
  comprador?: Partial<{
    nombre: string;
    cedula: string;
    telefono: string;
    tipoPersona: "fisica" | "juridica";
    rnc: string;
  }>;
  precioVehiculo?: number;
  /** TODO_BACKEND: el backend sella precio_servicio desde pricing_config */
  precioServicio?: number;
  escrowStatus?: EscrowStatus;
  esTraspasoFamiliar?: boolean;
}

export type EditableTraspasoFields = Omit<
  Traspaso,
  | "id"
  | "codigo"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "customerId"
  | "escrowStatus"
  | "pagoServicioStatus"
>;

export interface TraspasoFilters {
  status?: TraspasoStatus[];
  search?: string;
}

// ---------- Timeline / Documentos / Firmas ----------

export interface TraspasoTimelineEntry {
  id: string;
  traspasoId: string;
  status: string;
  nota: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type DocTipoCanonical =
  | "matricula"
  | "cedula_vendedor"
  | "cedula_comprador"
  | "selfie_vendedor"
  | "selfie_comprador"
  | "contrato_firmado"
  | "comprobante_pago"
  | "otro";
/** TODO_BACKEND: normalizar tipos de documento. Hoy aceptamos strings legacy
 * (cedula_*_frente, marbete, matricula_foto, etc.) que el backend real
 * debe mapear a un set canónico. */
export type DocTipo = DocTipoCanonical | (string & {});

export interface TraspasoDoc {
  id: string;
  traspasoId: string;
  tipo: string;
  fileUrl: string;
  uploadedAt: string;
}

export type FirmanteTipo = "vendedor" | "comprador" | "notario" | "apoderado";

export interface Firma {
  id: string;
  traspasoId: string;
  contratoId: string | null;
  tipoFirmante: FirmanteTipo;
  nombreFirmante: string;
  cedulaFirmante: string | null;
  firmaImagenUrl: string;
  firmaHash: string;
  createdAt: string;
}

export type ContractTipo = "acto_venta" | "poder" | "otro";

export interface TraspasoMensaje {
  id: string;
  traspasoId: string;
  senderId: string;
  mensaje: string;
  leido: boolean;
  createdAt: string;
}

// ---------- Historial ----------

export type HistorialStatus = "pendiente" | "en_proceso" | "completado" | "rechazado";

export interface HistorialResultado {
  multas?: number;
  marbete?: string;
  ultimoMantenimiento?: string;
  observaciones?: string;
  [key: string]: unknown;
}

export interface HistorialConsulta {
  id: string;
  userId: string | null;
  placa: string;
  telefono: string | null;
  email: string | null;
  status: HistorialStatus;
  resultado: HistorialResultado | null;
  createdAt: string;
}

// ---------- Escrow / mocks ----------

export interface EscrowSnapshot {
  traspasoId: string;
  escrowStatus: EscrowStatus;
  pagoServicioStatus: PagoServicioStatus;
  amountRD: number;
  // TODO_BACKEND: enrich with provider txn id, hold expiry, etc.
}

export interface ActorContext {
  id: string;
  role: UserRole;
}

export type { TraspasoStatus, UserRole };
