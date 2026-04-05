import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Car, Shield, CheckCircle, Clock, Loader2, Lock, MessageCircle,
} from "lucide-react";
import ContractGenerator from "@/components/gestor/ContractGenerator";
import MarbeteUpload from "@/components/app/MarbeteUpload";
import type { ContractData } from "@/lib/contract-templates";

const STATUS_STEPS = [
  { key: "solicitud_recibida", label: "Solicitud Recibida" },
  { key: "verificacion_antifraude", label: "Verificación Antifraude" },
  { key: "contrato_firmado", label: "Contrato Firmado" },
  { key: "matricula_recogida", label: "Matrícula Recogida" },
  { key: "plan_piloto", label: "Plan Piloto + DGII" },
  { key: "dgii_proceso", label: "Nueva Matrícula Lista" },
  { key: "completado", label: "Entrega + Escrow Liberado" },
];

const antifraudeBadge = (s: string) => {
  if (s === "aprobado") return { color: "bg-green-100 text-green-800", icon: Shield, label: "Aprobado" };
  if (s === "alerta") return { color: "bg-red-100 text-red-800", icon: Shield, label: "Alerta" };
  if (s === "rechazado") return { color: "bg-red-100 text-red-800", icon: Shield, label: "Rechazado" };
  return { color: "bg-amber-100 text-amber-800", icon: Shield, label: "Pendiente" };
};

export default function TraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: traspaso, isLoading } = useQuery({
    queryKey: ["traspaso", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspasos").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: docs } = useQuery({
    queryKey: ["traspaso-docs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspaso_documentos").select("*").eq("traspaso_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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
    return <div className="max-w-lg mx-auto px-4 pt-6 space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (!traspaso) {
    return <div className="max-w-lg mx-auto px-4 pt-6 text-center"><p className="text-muted-foreground">Traspaso no encontrado.</p><Button variant="ghost" onClick={() => navigate("/app")} className="mt-4">← Volver</Button></div>;
  }

  const t = traspaso as any;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === t.status);
  const af = antifraudeBadge(t.antifraude_status);

  const contractData: ContractData = {
    vehiculo_marca: t.vehiculo_marca || "",
    vehiculo_modelo: t.vehiculo_modelo || "",
    vehiculo_ano: t.vehiculo_ano || "",
    vehiculo_placa: t.vehiculo_placa || "",
    vehiculo_color: t.vehiculo_color || "",
    vehiculo_chasis: t.vehiculo_chasis || "",
    tipo_vehiculo: t.tipo_vehiculo || "vehiculo_motor",
    vendedor_nombre: t.vendedor_nombre || "",
    vendedor_cedula: t.vendedor_cedula || "",
    vendedor_rnc: t.vendedor_rnc || "",
    vendedor_tipo_persona: t.vendedor_tipo_persona || "fisica",
    vendedor_telefono: t.vendedor_telefono || "",
    comprador_nombre: t.comprador_nombre || "",
    comprador_cedula: t.comprador_cedula || "",
    comprador_rnc: t.comprador_rnc || "",
    comprador_tipo_persona: t.comprador_tipo_persona || "fisica",
    comprador_telefono: t.comprador_telefono || "",
    precio_vehiculo: t.precio_vehiculo,
    medio_pago: t.medio_pago || "",
    fecha_acto_venta: t.fecha_acto_venta || "",
    es_traspaso_familiar: t.es_traspaso_familiar || false,
    tiene_apoderado: t.tiene_apoderado || false,
    apoderado_nombre: t.apoderado_nombre || "",
    apoderado_cedula: t.apoderado_cedula || "",
    codigo: t.codigo || "",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {/* Vehicle info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Car className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="font-bold">{t.vehiculo_marca} {t.vehiculo_modelo} {t.vehiculo_ano}</h1>
              <p className="text-sm text-muted-foreground">Placa: {t.vehiculo_placa} · {t.codigo}</p>
              {t.vehiculo_chasis && <p className="text-xs text-muted-foreground">Chasis: {t.vehiculo_chasis}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Antifraude badge */}
      <div className={`flex items-center gap-2 rounded-lg p-3 mb-4 ${af.color}`}>
        <af.icon className="h-4 w-4" />
        <span className="text-sm font-medium">Antifraude: {af.label}</span>
      </div>

      {/* Timeline */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="font-semibold text-sm mb-4">Progreso del Traspaso</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((s, i) => {
              const isDone = i <= currentIdx && t.status !== "cancelado";
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      isDone ? "bg-green-500 text-white" : isCurrent ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone && !isCurrent ? <CheckCircle className="h-3.5 w-3.5" /> :
                       isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                       <Clock className="h-3 w-3" />}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isDone ? "bg-green-500" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm ${isDone || isCurrent ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contracts & Signatures */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <ContractGenerator
            traspasoId={t.id}
            contractData={contractData}
            contracts={contracts as any}
            signatures={signatures as any}
            onRefresh={refreshData}
          />
        </CardContent>
      </Card>

      {/* Marbete upload */}
      <div className="mb-4">
        <MarbeteUpload
          traspasoId={t.id}
          existingUrl={docs?.find((d: any) => d.tipo === "marbete")?.file_url || null}
          onUploaded={refreshData}
        />
      </div>

      {/* Escrow card */}
      {t.escrow_status !== "no_aplica" && (
        <Card className="mb-4 cursor-pointer" onClick={() => navigate(`/app/traspaso/${id}/escrow`)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Pago Seguro</p>
              <p className="text-xs text-muted-foreground capitalize">{t.escrow_status.replace("_", " ")}</p>
            </div>
            {t.precio_vehiculo && <p className="font-bold text-accent">RD$ {t.precio_vehiculo.toLocaleString()}</p>}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {docs && docs.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-sm mb-3">Documentos</h2>
            <div className="space-y-2">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{d.tipo.replace(/_/g, " ")}</span>
                  <a href={d.file_url} target="_blank" rel="noopener" className="text-accent hover:underline text-xs">Ver</a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp help */}
      <Button variant="outline" className="w-full mb-8"
        onClick={() => window.open(`https://wa.me/18092001234?text=Hola, necesito ayuda con mi traspaso ${t.codigo}`, "_blank")}>
        <MessageCircle className="h-4 w-4 mr-2" />
        ¿Necesitas ayuda? Escríbenos por WhatsApp
      </Button>
    </div>
  );
}
