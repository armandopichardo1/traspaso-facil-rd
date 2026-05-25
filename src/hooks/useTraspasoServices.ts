/**
 * React Query hooks que envuelven los servicios del traspaso.
 *
 * Convención de query keys:
 *   ["traspaso", id]
 *   ["traspasos", role, userId, filters]
 *   ["traspaso", id, "timeline" | "documentos" | "firmas" | "mensajes"]
 *   ["escrow", traspasoId]
 *   ["historiales", userId | "pending"]
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as historial from "@/services/historialService";
import * as mock from "@/services/mockBackend";
import * as svc from "@/services/traspasoService";
import type {
  ActorContext,
  HistorialResultado,
  NewTraspasoInput,
  TraspasoFilters,
} from "@/services/types";
import type { TraspasoStatus, UserRole } from "@/lib/traspaso-status";

async function unwrap<T>(
  p: Promise<{ ok: true; data: T } | { ok: false; error: string }>,
): Promise<T> {
  const r = await p;
  if (r.ok === true) return r.data;
  throw new Error((r as { ok: false; error: string }).error);
}

// ---------- Traspaso ----------

export const useTraspaso = (id: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", id],
    enabled: !!id,
    queryFn: () => unwrap(svc.getTraspaso(id!)),
  });

export const useTraspasoByCodigo = (codigo: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", "codigo", codigo],
    enabled: !!codigo,
    queryFn: () => unwrap(svc.getTraspasoByCodigo(codigo!)),
  });

export const useTraspasosForRole = (
  role: UserRole | undefined,
  userId: string | undefined,
  filters?: TraspasoFilters,
) =>
  useQuery({
    queryKey: ["traspasos", role, userId, filters],
    enabled: !!role && !!userId,
    queryFn: () => unwrap(svc.listTraspasosForRole(role!, userId!, filters)),
  });

export const useTimeline = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", traspasoId, "timeline"],
    enabled: !!traspasoId,
    queryFn: () => unwrap(svc.getTimeline(traspasoId!)),
  });

export const useCreateTraspaso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTraspasoInput) => unwrap(svc.createTraspaso(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["traspasos"] }),
  });
};

export const useAdvanceStatus = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      toStatus: TraspasoStatus;
      actor: ActorContext;
      nota?: string;
    }) =>
      unwrap(
        svc.advanceStatus(traspasoId, vars.toStatus, vars.actor, { nota: vars.nota }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId] });
      qc.invalidateQueries({ queryKey: ["traspasos"] });
      qc.invalidateQueries({ queryKey: ["escrow", traspasoId] });
    },
  });
};

export const useCancelTraspaso = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { actor: ActorContext; reason: string }) =>
      unwrap(svc.cancelTraspaso(traspasoId, vars.actor, vars.reason)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId] });
      qc.invalidateQueries({ queryKey: ["escrow", traspasoId] });
    },
  });
};

// ---------- Documentos / Firmas / Mensajes ----------

export const useDocumentos = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", traspasoId, "documentos"],
    enabled: !!traspasoId,
    queryFn: () => unwrap(svc.listDocumentos(traspasoId!)),
  });

export const useUploadDocumento = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tipo: Parameters<typeof svc.uploadDocumento>[1]; file: File }) =>
      unwrap(svc.uploadDocumento(traspasoId, vars.tipo, vars.file)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId, "documentos"] }),
  });
};

export const useFirmas = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", traspasoId, "firmas"],
    enabled: !!traspasoId,
    queryFn: () => unwrap(svc.listFirmas(traspasoId!)),
  });

export const useSaveFirma = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof svc.saveFirma>[0], "traspasoId">) =>
      unwrap(svc.saveFirma({ ...input, traspasoId })),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId, "firmas"] }),
  });
};

export const useContratos = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", traspasoId, "contratos"],
    enabled: !!traspasoId,
    queryFn: async () => {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("traspaso_contratos")
        .select("*")
        .eq("traspaso_id", traspasoId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const useGenerateContract = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tipo: Parameters<typeof svc.generateContract>[1]; contenidoHtml: string }) =>
      unwrap(svc.generateContract(traspasoId, vars.tipo, vars.contenidoHtml)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId, "contratos"] }),
  });
};

export const useMensajes = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["traspaso", traspasoId, "mensajes"],
    enabled: !!traspasoId,
    queryFn: () => unwrap(svc.listMensajes(traspasoId!)),
  });

export const useSendMensaje = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { senderId: string; text: string }) =>
      unwrap(svc.sendMensaje(traspasoId, vars.senderId, vars.text)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId, "mensajes"] }),
  });
};

// ---------- Escrow (mock) ----------

export const useEscrow = (traspasoId: string | undefined) =>
  useQuery({
    queryKey: ["escrow", traspasoId],
    enabled: !!traspasoId,
    queryFn: () => unwrap(mock.getEscrowSnapshot(traspasoId!)),
  });

export const useCreateEscrowDeposit = (traspasoId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amountRD: number) =>
      unwrap(mock.createEscrowDeposit(traspasoId, amountRD)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow", traspasoId] });
      qc.invalidateQueries({ queryKey: ["traspaso", traspasoId] });
    },
  });
};

// ---------- Historial ----------

export const useHistorialesForUser = (userId: string | undefined) =>
  useQuery({
    queryKey: ["historiales", userId],
    enabled: !!userId,
    queryFn: () => unwrap(historial.listHistorialesForUser(userId!)),
  });

export const usePendingHistoriales = () =>
  useQuery({
    queryKey: ["historiales", "pending"],
    queryFn: () => unwrap(historial.listPendingHistoriales()),
  });

export const useCreateHistorialRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof historial.createHistorialRequest>[0]) =>
      unwrap(historial.createHistorialRequest(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["historiales"] }),
  });
};

export const useFulfillHistorial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; resultado: HistorialResultado }) =>
      unwrap(historial.adminFulfillHistorial(vars.id, vars.resultado)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["historiales"] }),
  });
};
