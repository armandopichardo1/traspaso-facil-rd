import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Car, Shield, CheckCircle, Clock, Loader2, Lock, MessageCircle,
  ShieldCheck, MapPin,
} from "lucide-react";
import ContractGenerator from "@/components/gestor/ContractGenerator";
import DocumentUpload from "@/components/gestor/DocumentUpload";
import MarbeteUpload, { type MarbeteOcrResult } from "@/components/app/MarbeteUpload";
import TraspasoChat from "@/components/app/TraspasoChat";
import type { ContractData } from "@/lib/contract-templates";
import { motion } from "framer-motion";
import { useTraspaso, useDocumentos } from "@/hooks/useTraspasoServices";

import { STATUS_STEPS } from "@/lib/traspaso-status";

const antifraudeBadge = (s: string) => {
  if (s === "aprobado") return { color: "bg-green-50 text-green-800 border-green-200", icon: Shield, label: "Aprobado" };
  if (s === "alerta") return { color: "bg-red-50 text-red-800 border-red-200", icon: Shield, label: "Alerta" };
  if (s === "rechazado") return { color: "bg-red-50 text-red-800 border-red-200", icon: Shield, label: "Rechazado" };
  return { color: "bg-amber-50 text-amber-800 border-amber-200", icon: Shield, label: "Pendiente" };
};

export default function TraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [marbeteData, setMarbeteData] = useState<MarbeteOcrResult | null>(null);

  const { data: traspaso, isLoading } = useTraspaso(id);
  const { data: docs } = useDocumentos(id);

  const { data: contracts = [] } = useQuery({
    queryKey: ["traspaso-contracts", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspaso_contratos").select("*").eq("traspaso_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ["traspaso-signatures", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspaso_firmas").select("*").eq("traspaso_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["traspaso-contracts", id] });
    queryClient.invalidateQueries({ queryKey: ["traspaso-signatures", id] });
    queryClient.invalidateQueries({ queryKey: ["traspaso-docs", id] });
  };

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 pt-6 space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-48 w-full rounded-2xl" /></div>;
  }

  if (!traspaso) {
    return <div className="max-w-lg mx-auto px-4 pt-6 text-center"><p className="text-muted-foreground">Traspaso no encontrado.</p><Button variant="ghost" onClick={() => navigate("/app")} className="mt-4">← Volver</Button></div>;
  }

  const t = traspaso;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === t.status);
  const progressPct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STATUS_STEPS.length) * 100) : 0;
  const af = antifraudeBadge(t.antifraudeStatus);

  const contractData: ContractData = {
    vehiculo_marca: t.vehiculoMarca || "", vehiculo_modelo: t.vehiculoModelo || "",
    vehiculo_ano: t.vehiculoAno || "", vehiculo_placa: t.vehiculoPlaca || "",
    vehiculo_color: t.vehiculoColor || "", vehiculo_chasis: t.vehiculoChasis || "",
    tipo_vehiculo: "vehiculo_motor",
    vendedor_nombre: t.vendedorNombre || "", vendedor_cedula: t.vendedorCedula || "",
    vendedor_rnc: t.vendedorRnc || "", vendedor_tipo_persona: t.vendedorTipoPersona || "fisica",
    vendedor_telefono: t.vendedorTelefono || "",
    comprador_nombre: t.compradorNombre || "", comprador_cedula: t.compradorCedula || "",
    comprador_rnc: t.compradorRnc || "", comprador_tipo_persona: t.compradorTipoPersona || "fisica",
    comprador_telefono: t.compradorTelefono || "",
    precio_vehiculo: t.precioVehiculo, medio_pago: t.medioPago || "",
    fecha_acto_venta: t.fechaActoVenta || "",
    es_traspaso_familiar: t.esTraspasoFamiliar || false,
    tiene_apoderado: t.tieneApoderado || false,
    apoderado_nombre: t.apoderadoNombre || "", apoderado_cedula: t.apoderadoCedula || "",
    codigo: t.codigo || "",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {/* Vehicle header card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-4 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Tu proceso está en marcha
              </h2>
              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" /> VERIFICADO
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg">{t.vehiculoMarca} {t.vehiculoModelo} {t.vehiculoAno}</h1>
                <p className="text-sm text-muted-foreground">Placa: {t.vehiculoPlaca} · {t.codigo}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Progreso</span>
              <span className="text-sm font-bold text-accent">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2.5 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Antifraude */}
      <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 border ${af.color}`}>
        <af.icon className="h-4 w-4" />
        <span className="text-sm font-medium">Antifraude: {af.label}</span>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="mb-4 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="font-bold text-sm mb-4">Progreso del Traspaso</h2>
            <div className="space-y-0">
              {STATUS_STEPS.map((s, i) => {
                const isDone = i <= currentIdx && t.status !== "cancelado";
                const isCurrent = i === currentIdx;
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                        isDone && !isCurrent ? "bg-green-500 text-white" :
                        isCurrent ? "bg-accent text-white ring-4 ring-accent/20" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {isDone && !isCurrent ? <CheckCircle className="h-4 w-4" /> :
                         isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> :
                         <Clock className="h-3.5 w-3.5" />}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 ${isDone ? "bg-green-500" : "bg-muted"}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm ${isDone || isCurrent ? "font-bold" : "text-muted-foreground"}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                      {/* Badges for specific steps */}
                      {isCurrent && s.key === "contrato_firmado" && (
                        <div className="flex gap-1.5 mt-1.5">
                          <Badge className="bg-green-50 text-green-700 text-[9px]">FIRMA DIGITAL OK</Badge>
                          <Badge className="bg-accent/10 text-accent text-[9px]">FONDOS EN CUSTODIA</Badge>
                        </div>
                      )}
                      {isCurrent && s.key === "matricula_recogida" && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-accent/5 border border-accent/20 p-2">
                          <div className="flex items-center gap-2 text-xs text-accent">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="font-medium">Ubicación actual del gestor</span>
                          </div>
                        </div>
                      )}
                      {s.key === "dgii_proceso" && isDone && (
                        <button
                          className="text-xs text-accent font-semibold hover:underline mt-1"
                          onClick={() => navigate(`/app/traspaso/${id}/escrow`)}
                        >
                          Rastrear pago en custodia (Escrow) →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contracts & Signatures — client can sign when contrato_generado */}
      {((t.status as string) === "contrato_generado" || t.status === "contrato_firmado" || contracts.length > 0) && (
        <Card className="mb-4 rounded-xl">
          <CardContent className="p-4">
            {(t.status as string) === "contrato_generado" && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent mb-3">
                ✍️ Tu contrato está listo. Puedes firmarlo digitalmente a continuación.
              </div>
            )}
            <ContractGenerator
              traspasoId={t.id}
              contractData={contractData}
              contracts={contracts as any}
              signatures={signatures as any}
              onRefresh={refreshData}
            />
          </CardContent>
        </Card>
      )}

      {/* Client document upload — can upload additional docs */}
      {t.status !== "completado" && t.status !== "cancelado" && (
        <div className="mb-4">
          <DocumentUpload traspasoId={t.id} />
        </div>
      )}

      {/* Marbete upload */}
      <div className="mb-4">
        <MarbeteUpload
          traspasoId={t.id}
          existingUrl={docs?.find((d: any) => d.tipo === "marbete")?.file_url || null}
          onUploaded={refreshData}
          onOcrResult={(result) => setMarbeteData(result)}
        />
      </div>

      {/* Chat */}
      {t.status !== "completado" && t.status !== "cancelado" && (
        <div className="mb-4">
          <TraspasoChat traspasoId={t.id} />
        </div>
      )}

      {/* Escrow card */}
      {t.escrowStatus !== "no_aplica" && (
        <Card className="mb-4 cursor-pointer rounded-xl hover:shadow-md transition-shadow" onClick={() => navigate(`/app/traspaso/${id}/escrow`)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Pago Seguro</p>
              <p className="text-xs text-muted-foreground capitalize">{t.escrowStatus.replace("_", " ")}</p>
            </div>
            {t.precioVehiculo && <p className="font-bold text-accent">RD$ {t.precioVehiculo.toLocaleString()}</p>}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {docs && docs.length > 0 && (
        <Card className="mb-4 rounded-xl">
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-3">Documentos</h2>
            <div className="space-y-2">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{d.tipo.replace(/_/g, " ")}</span>
                  <a href={d.fileUrl} target="_blank" rel="noopener" className="text-accent hover:underline text-xs font-medium">Ver</a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp help */}
      <Card className="rounded-xl bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => window.open(`https://wa.me/18092001234?text=Hola, necesito ayuda con mi traspaso ${t.codigo}`, "_blank")}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-green-800">¿Necesitas ayuda?</p>
            <p className="text-xs text-green-700">Habla con tu asesor por WhatsApp</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
