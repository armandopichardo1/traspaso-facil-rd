import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ErrorState, LoadingSkeleton, NotFoundView } from "@/components/shared/StateView";
import {
  ArrowLeft,
  Car,
  User,
  Shield,
  Clock,
  Phone,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Copy,
} from "lucide-react";
import { getNextStatus } from "@/lib/traspaso-status";
import { useAdvanceStatus } from "@/hooks/useTraspasoServices";
import DocumentUpload from "@/components/gestor/DocumentUpload";
import ContractGenerator from "@/components/gestor/ContractGenerator";
import TraspasoChat from "@/components/app/TraspasoChat";
import type { ContractData } from "@/lib/contract-templates";
import { STATUS_STEPS, STATUS_LABELS, statusColor, getProgress } from "@/lib/traspaso-status";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

// Formatea pesos dominicanos sin decimales
const fmtRD = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 })
    .format(n)
    .replace("DOP", "RD$");

/** Genera 3 slots propuestos para inspección CENARVE (próximos días hábiles, mañana/mediodía/tarde). */
function proposeCenarveSlots(from = new Date()) {
  const slots: { date: Date; label: string }[] = [];
  const times = [
    { h: 9, label: "9:00 AM" },
    { h: 11, label: "11:00 AM" },
    { h: 14, label: "2:00 PM" },
  ];
  let cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  let i = 0;
  while (slots.length < 3 && i < 14) {
    const day = cursor.getDay(); // 0 dom, 6 sáb
    if (day !== 0 && day !== 6) {
      const t = times[slots.length];
      const d = new Date(cursor);
      d.setHours(t.h, 0, 0, 0);
      slots.push({
        date: d,
        label: `${d.toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "short" })} · ${t.label}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    i++;
  }
  return slots;
}

/** Checklist estándar para radicación CENARVE / DGII */
const RADICACION_CHECKLIST = [
  "Matrícula original del vendedor (sin enmiendas)",
  "Cédula vigente del vendedor y comprador (copia ambos lados)",
  "Contrato de venta notarizado (Ley 126-02) en 3 originales",
  "Certificación de no oposición DGII (vigencia 30 días)",
  "Recibo de pago del 2% de transferencia DGII",
  "Inspección física CENARVE: chasis y motor visibles y limpios",
  "Fotos del vehículo (frontal, lateral, trasera, chasis)",
  "Marbete vigente o constancia de pago",
  "Formulario IR-17 de la DGII completado",
  "Poder notarizado del apoderado (si aplica)",
];


export default function GestorTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const advanceStatus = useAdvanceStatus(id!);
  const advancing = advanceStatus.isPending;

  const { data: traspaso, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["gestor-traspaso", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspasos").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ["gestor-timeline", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspaso_timeline").select("*").eq("traspaso_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // ---------- Estado: panel de margen ----------
  const [commissionPctInput, setCommissionPctInput] = useState<string>("");
  const [costsInput, setCostsInput] = useState<string>("");
  const [savingMargen, setSavingMargen] = useState(false);

  // Hidrata los inputs al cargar el traspaso
  useEffect(() => {
    if (!traspaso) return;
    const t = traspaso as any;
    setCommissionPctInput(String(Math.round(Number(t.gestor_commission_pct ?? 0.3) * 100)));
    setCostsInput(String(Number(t.gestor_costs_rd ?? 0)));
  }, [traspaso]);

  // ---------- Estado: agente CENARVE / DGII ----------
  const proposedSlots = useMemo(() => proposeCenarveSlots(), []);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [checklistDone, setChecklistDone] = useState<Record<number, boolean>>({});
  const checklistProgress = useMemo(() => {
    const done = Object.values(checklistDone).filter(Boolean).length;
    return Math.round((done / RADICACION_CHECKLIST.length) * 100);
  }, [checklistDone]);

  const saveMargen = async () => {
    if (!id) return;
    const pct = Math.max(0, Math.min(100, Number(commissionPctInput) || 0)) / 100;
    const costs = Math.max(0, Number(costsInput) || 0);
    setSavingMargen(true);
    const { error } = await supabase
      .from("traspasos")
      .update({ gestor_commission_pct: pct, gestor_costs_rd: costs })
      .eq("id", id);
    setSavingMargen(false);
    if (error) {
      toast.error("No se pudo guardar el margen: " + error.message);
      return;
    }
    toast.success("Margen actualizado");
    queryClient.invalidateQueries({ queryKey: ["gestor-traspaso", id] });
  };

  const copyRadicacionDraft = async (slotLabel: string | null) => {
    if (!traspaso) return;
    const tt = traspaso as any;
    const lines = [
      `Radicación CENARVE / DGII — ${tt.codigo ?? ""}`,
      `Vehículo: ${tt.vehiculo_marca ?? ""} ${tt.vehiculo_modelo ?? ""} ${tt.vehiculo_ano ?? ""} · Placa ${tt.vehiculo_placa ?? "—"}`,
      `Vendedor: ${tt.vendedor_nombre ?? "—"} · Comprador: ${tt.comprador_nombre ?? "—"}`,
      slotLabel ? `Inspección propuesta: ${slotLabel}` : `Inspección: por confirmar`,
      "",
      "Checklist de radicación:",
      ...RADICACION_CHECKLIST.map((item, i) => `${checklistDone[i] ? "[x]" : "[ ]"} ${item}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Borrador copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };



  const handleAdvanceStatus = async (nextStatus: string, nota: string) => {
    if (!traspaso || !user) return;
    try {
      await advanceStatus.mutateAsync({
        toStatus: nextStatus as any,
        actor: { id: user.id, role: "gestor" },
        nota,
      });
      toast.success(`Traspaso avanzado a ${STATUS_LABELS[nextStatus] || nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["gestor-traspaso", id] });
      queryClient.invalidateQueries({ queryKey: ["gestor-timeline", id] });
    } catch (err: any) {
      toast.error(err.message || "Error al avanzar");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={2} className="max-w-lg mx-auto px-4 pt-6 space-y-4" rowClassName="h-40 w-full rounded-xl" />;
  }

  if (isError) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <ErrorState
          message={(error as Error)?.message || "No se pudo cargar el traspaso."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!traspaso) {
    return (
      <NotFoundView
        title="Traspaso no encontrado"
        onBack={() => navigate("/gestor")}
      />
    );
  }

  const t = traspaso as any;

  const whatsappLink = (phone: string | null) => {
    if (!phone) return "#";
    return `https://wa.me/1${phone.replace(/\D/g, "")}`;
  };

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
      <button onClick={() => navigate("/gestor")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{t.vehiculo_marca} {t.vehiculo_modelo}</h1>
          <p className="text-sm text-muted-foreground">Código: {t.codigo}</p>
        </div>
        <Badge className={statusColor(t.status)} variant="secondary">
          {STATUS_LABELS[t.status] || t.status}
        </Badge>
      </div>

      <Progress value={getProgress(t.status)} className="h-2 mb-6" />

      {/* Vehicle */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" /> Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Tipo:</strong> {t.tipo_vehiculo === "motocicleta" ? "Motocicleta" : "Vehículo de Motor"}</p>
          <p><strong>Marca/Modelo:</strong> {t.vehiculo_marca} {t.vehiculo_modelo} {t.vehiculo_ano}</p>
          <p><strong>Placa:</strong> {t.vehiculo_placa}</p>
          <p><strong>Color:</strong> {t.vehiculo_color || "—"}</p>
          <p><strong>Chasis/VIN:</strong> {t.vehiculo_chasis || "—"}</p>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Vendedor</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>{t.vendedor_nombre || "—"}</p>
            <p className="text-muted-foreground">
              {t.vendedor_tipo_persona === "juridica" ? `RNC: ${t.vendedor_rnc || "—"}` : `Cédula: ${t.vendedor_cedula || "—"}`}
            </p>
            {t.vendedor_tipo_persona === "juridica" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Empresa</Badge>}
            {t.vendedor_telefono && (
              <a href={whatsappLink(t.vendedor_telefono)} target="_blank" className="flex items-center gap-1 text-accent hover:underline">
                <Phone className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Comprador</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>{t.comprador_nombre || "—"}</p>
            <p className="text-muted-foreground">
              {t.comprador_tipo_persona === "juridica" ? `RNC: ${t.comprador_rnc || "—"}` : `Cédula: ${t.comprador_cedula || "—"}`}
            </p>
            {t.comprador_tipo_persona === "juridica" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Empresa</Badge>}
            {t.comprador_telefono && (
              <a href={whatsappLink(t.comprador_telefono)} target="_blank" className="flex items-center gap-1 text-accent hover:underline">
                <Phone className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract details */}
      {(t.fecha_acto_venta || t.medio_pago || t.tiene_apoderado || t.es_traspaso_familiar) && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Datos del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {t.fecha_acto_venta && <p><strong>Fecha Acto:</strong> {t.fecha_acto_venta}</p>}
            {t.medio_pago && <p><strong>Medio de Pago:</strong> {t.medio_pago}</p>}
            {t.es_traspaso_familiar && <p>🏠 <strong>Traspaso entre familiares</strong></p>}
            {t.tiene_apoderado && <p>👤 <strong>Apoderado:</strong> {t.apoderado_nombre} · Cédula: {t.apoderado_cedula || "—"}</p>}
          </CardContent>
        </Card>
      )}

      {/* Contracts & Signatures */}
      <div className="mb-4">
        <ContractGenerator
          traspasoId={t.id}
          contractData={contractData}
        />

      </div>

      {/* Documents */}
      <div className="mb-4">
        <DocumentUpload traspasoId={t.id} />
      </div>

      {/* Gestor Actions */}
      {(() => {
        const next = getNextStatus(t.status, "gestor");
        if (!next) return null;
        return (
          <Button
            variant="teal"
            className="w-full mb-4"
            size="lg"
            onClick={() => handleAdvanceStatus(next, `Gestor avanzó a ${STATUS_LABELS[next]}`)}
            disabled={advancing}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {advancing ? "Avanzando..." : `Avanzar a ${STATUS_LABELS[next]}`}
          </Button>
        );
      })()}

      {/* Status */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Estado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between"><span>Antifraude:</span><Badge variant={t.antifraude_status === "aprobado" ? "default" : "secondary"}>{t.antifraude_status}</Badge></div>
          <div className="flex justify-between"><span>Escrow:</span><Badge variant="secondary">{t.escrow_status}</Badge></div>
          <div className="flex justify-between"><span>Pago servicio:</span><Badge variant="secondary">{t.pago_servicio_status}</Badge></div>
          <div className="flex justify-between"><span>Plan:</span><span className="font-medium">{t.plan} · RD$ {Number(t.precio_servicio).toLocaleString()}</span></div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                    {entry.nota && <p className="text-xs text-muted-foreground">{entry.nota}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString("es-DO")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat with client */}
      {t.status !== "completado" && t.status !== "cancelado" && (
        <div className="mb-4">
          <TraspasoChat traspasoId={t.id} />
        </div>
      )}
    </div>
  );
}
