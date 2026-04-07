import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowLeft, Car, Shield, CheckCircle, Clock, Loader2, Lock,
  MessageCircle, User, FileText, Download, ShieldCheck, ShieldAlert, ShieldX, PenTool,
  Timer, TrendingUp, AlertTriangle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ContractGenerator from "@/components/gestor/ContractGenerator";
import type { ContractData } from "@/lib/contract-templates";

const STATUS_STEPS = [
  { key: "solicitud_recibida", label: "Solicitud Recibida" },
  { key: "verificacion_antifraude", label: "Verificación Antifraude" },
  { key: "contrato_firmado", label: "Contrato Firmado" },
  { key: "matricula_recogida", label: "Matrícula Recogida" },
  { key: "plan_piloto", label: "Plan Piloto + DGII" },
  { key: "dgii_proceso", label: "Nueva Matrícula Lista" },
  { key: "completado", label: "Completado" },
];

const ESCROW_OPTIONS = ["no_aplica", "depositado", "en_custodia", "liberado", "reembolsado"];
const ANTIFRAUDE_OPTIONS = ["pendiente", "aprobado", "alerta", "rechazado"];

const antifraudeStyle = (s: string) => {
  if (s === "aprobado") return "bg-green-100 text-green-800";
  if (s === "alerta") return "bg-amber-100 text-amber-800";
  if (s === "rechazado") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export default function AdminTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [mensajero, setMensajero] = useState("");
  const [notasInternas, setNotasInternas] = useState("");
  const [antifraudeNotas, setAntifraudeNotas] = useState("");

  const { data: traspaso, isLoading } = useQuery({
    queryKey: ["admin-traspaso", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setMensajero(data.mensajero_nombre || "");
      setNotasInternas(data.notas_internas || "");
      setAntifraudeNotas(data.antifraude_notas || "");
      setNewStatus(data.status);
      return data;
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ["admin-timeline", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_timeline")
        .select("*")
        .eq("traspaso_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: slaConfig } = useQuery({
    queryKey: ["sla_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sla_config").select("etapa, horas_objetivo");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { map[r.etapa] = Number(r.horas_objetivo); });
      return map;
    },
  });


  const { data: docs } = useQuery({
    queryKey: ["admin-docs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_documentos")
        .select("*")
        .eq("traspaso_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: contratos } = useQuery({
    queryKey: ["admin-contratos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_contratos")
        .select("*")
        .eq("traspaso_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: firmas } = useQuery({
    queryKey: ["admin-firmas", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_firmas")
        .select("*")
        .eq("traspaso_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateTraspaso = useMutation({
    mutationFn: async (updates: Partial<Tables<"traspasos">>) => {
      const { error } = await supabase
        .from("traspasos")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-traspaso", id] });
      toast({ title: "Traspaso actualizado" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const addTimelineEntry = useMutation({
    mutationFn: async () => {
      // Update traspaso status
      const { error: e1 } = await supabase
        .from("traspasos")
        .update({ status: newStatus })
        .eq("id", id);
      if (e1) throw e1;

      // Add timeline entry
      const { data: { user } } = await supabase.auth.getUser();
      const { error: e2 } = await supabase
        .from("traspaso_timeline")
        .insert({
          traspaso_id: id,
          status: newStatus,
          nota: statusNote || null,
          created_by: user?.id,
        });
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-traspaso", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-timeline", id] });
      setStatusNote("");
      toast({ title: "Status actualizado" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleAntifraude = (status: string) => {
    updateTraspaso.mutate({
      antifraude_status: status,
      antifraude_notas: antifraudeNotas,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!traspaso) return <div className="container py-6">No encontrado</div>;

  // Group docs by type for antifraude review
  const cedulaComprador = docs?.find((d: any) => d.tipo === "cedula_comprador");
  const selfieComprador = docs?.find((d: any) => d.tipo === "selfie_comprador");
  const cedulaVendedor = docs?.find((d: any) => d.tipo === "cedula_vendedor");
  const selfieVendedor = docs?.find((d: any) => d.tipo === "selfie_vendedor");
  const matriculaFoto = docs?.find((d: any) => d.tipo === "matricula_foto");

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-4">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Admin
          </button>
          <span className="text-sm font-bold">{traspaso.codigo}</span>
        </div>
      </header>

      <div className="container py-6 grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Vehicle + parties info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-accent" /> Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Tipo:</span> {traspaso.tipo_vehiculo === 'motocicleta' ? 'Motocicleta' : 'Vehículo de Motor'}</p>
              <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculo_marca} {traspaso.vehiculo_modelo}</p>
              <p><span className="text-muted-foreground">Año:</span> {traspaso.vehiculo_ano}</p>
              <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculo_placa}</p>
              <p><span className="text-muted-foreground">Chasis/VIN:</span> {traspaso.vehiculo_chasis || '—'}</p>
              <p><span className="text-muted-foreground">Color:</span> {traspaso.vehiculo_color}</p>
              {traspaso.fecha_acto_venta && (
                <p><span className="text-muted-foreground">Fecha Acto de Venta:</span> {new Date(traspaso.fecha_acto_venta).toLocaleDateString('es-DO')}</p>
              )}
              {traspaso.medio_pago && (
                <p><span className="text-muted-foreground">Medio de Pago:</span> {traspaso.medio_pago === 'efectivo' ? 'Efectivo' : traspaso.medio_pago === 'transferencia' ? 'Transferencia' : traspaso.medio_pago === 'cheque' ? 'Cheque' : traspaso.medio_pago === 'financiamiento' ? 'Financiamiento' : traspaso.medio_pago}</p>
              )}
              {traspaso.es_traspaso_familiar && <Badge variant="secondary" className="text-xs">Traspaso Familiar</Badge>}
              {traspaso.tiene_apoderado && (
                <p><span className="text-muted-foreground">Apoderado:</span> {traspaso.apoderado_nombre || '—'} · {traspaso.apoderado_cedula || '—'}</p>
              )}
              <p><span className="text-muted-foreground">Plan:</span> {traspaso.plan} · RD$ {traspaso.precio_servicio?.toLocaleString()}</p>
              <p><span className="text-muted-foreground">Pago servicio:</span> {traspaso.pago_servicio_status}</p>
              {traspaso.escrow_status !== "no_aplica" && (
                <p><span className="text-muted-foreground">Escrow:</span> {traspaso.escrow_status} · RD$ {Number(traspaso.precio_vehiculo || 0).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>{traspaso.vendedor_nombre}</p>
                <p className="text-muted-foreground">
                  {traspaso.vendedor_tipo_persona === "juridica"
                    ? `RNC: ${traspaso.vendedor_rnc || "—"}`
                    : `Cédula: ${traspaso.vendedor_cedula || "—"}`}
                </p>
                {traspaso.vendedor_tipo_persona === "juridica" && (
                  <Badge variant="secondary" className="text-xs">Empresa</Badge>
                )}
                <a href={`https://wa.me/${(traspaso.vendedor_telefono || "").replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-accent hover:underline text-xs flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {traspaso.vendedor_telefono}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Comprador
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>{traspaso.comprador_nombre}</p>
                <p className="text-muted-foreground">
                  {traspaso.comprador_tipo_persona === "juridica"
                    ? `RNC: ${traspaso.comprador_rnc || "—"}`
                    : `Cédula: ${traspaso.comprador_cedula || "—"}`}
                </p>
                {traspaso.comprador_tipo_persona === "juridica" && (
                  <Badge variant="secondary" className="text-xs">Empresa</Badge>
                )}
                <a href={`https://wa.me/${(traspaso.comprador_telefono || "").replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-accent hover:underline text-xs flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {traspaso.comprador_telefono}
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Antifraude Review Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Revisión Antifraude
                <Badge className={antifraudeStyle(traspaso.antifraude_status)} variant="secondary">
                  {traspaso.antifraude_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comprador: Selfie vs Cédula */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Comprador: Selfie vs Cédula</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    {selfieComprador ? (
                      <img src={selfieComprador.file_url} alt="Selfie comprador" className="object-cover w-full h-full" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin selfie</p>
                    )}
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    {cedulaComprador ? (
                      <img src={cedulaComprador.file_url} alt="Cédula comprador" className="object-cover w-full h-full" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin cédula</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendedor: Selfie vs Cédula */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Vendedor: Selfie vs Cédula</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    {selfieVendedor ? (
                      <img src={selfieVendedor.file_url} alt="Selfie vendedor" className="object-cover w-full h-full" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin selfie</p>
                    )}
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    {cedulaVendedor ? (
                      <img src={cedulaVendedor.file_url} alt="Cédula vendedor" className="object-cover w-full h-full" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin cédula</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Matrícula */}
              {matriculaFoto && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Matrícula</p>
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img src={matriculaFoto.file_url} alt="Matrícula" className="object-contain w-full max-h-48" />
                  </div>
                </div>
              )}

              {/* Notas antifraude */}
              <div>
                <Label className="text-xs">Notas Antifraude</Label>
                <Textarea
                  value={antifraudeNotas}
                  onChange={(e) => setAntifraudeNotas(e.target.value)}
                  placeholder="Observaciones sobre la verificación..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAntifraude("aprobado")}
                >
                  <ShieldCheck className="h-4 w-4 mr-1" /> Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={() => handleAntifraude("alerta")}
                >
                  <ShieldAlert className="h-4 w-4 mr-1" /> Alerta
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleAntifraude("rechazado")}
                >
                  <ShieldX className="h-4 w-4 mr-1" /> Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Documents */}
          {docs && docs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Todos los Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {docs.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                      <span className="capitalize">{d.tipo.replace(/_/g, " ")}</span>
                      <a href={d.file_url} target="_blank" rel="noopener" className="text-accent hover:underline text-xs flex items-center gap-1">
                        <Download className="h-3 w-3" /> Ver / Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Update status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actualizar Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_STEPS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Nota (opcional)..."
                rows={2}
              />
              <Button
                variant="cta"
                className="w-full"
                onClick={() => addTimelineEntry.mutate()}
                disabled={addTimelineEntry.isPending}
              >
                {addTimelineEntry.isPending ? "Actualizando..." : "Actualizar Status"}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {STATUS_STEPS.map((s, i) => {
                const currentIdx = STATUS_STEPS.findIndex((st) => st.key === traspaso.status);
                const isDone = i <= currentIdx && traspaso.status !== "cancelado";
                const isCurrent = i === currentIdx;
                const entry = timeline?.find((t: any) => t.status === s.key);
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        isDone ? "bg-green-500 text-white" : isCurrent ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone && !isCurrent ? <CheckCircle className="h-3.5 w-3.5" /> :
                         isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                         <Clock className="h-3 w-3" />}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-6 ${isDone ? "bg-green-500" : "bg-muted"}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm ${isDone || isCurrent ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                      {entry?.nota && <p className="text-xs text-muted-foreground">{entry.nota}</p>}
                      {entry && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString("es-DO")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* KPIs de Tiempo por Etapa */}
          {timeline && timeline.length > 0 && (() => {
            const sortedTimeline = [...timeline].sort(
              (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            const stageKpis = sortedTimeline.map((entry: any, idx: number) => {
              const prevTime = idx === 0
                ? new Date(traspaso.created_at).getTime()
                : new Date(sortedTimeline[idx - 1].created_at).getTime();
              const currentTime = new Date(entry.created_at).getTime();
              const durationMs = currentTime - prevTime;
              const durationHours = durationMs / (1000 * 60 * 60);
              const slaHours = (slaConfig && slaConfig[entry.status]) || 24;
              const pct = Math.min((durationHours / slaHours) * 100, 100);
              const isOverdue = durationHours > slaHours;

              return { status: entry.status, durationHours, slaHours, pct, isOverdue };
            });

            // Overall
            const totalHours = stageKpis.reduce((sum, k) => sum + k.durationHours, 0);
            const totalSla = stageKpis.reduce((sum, k) => sum + k.slaHours, 0);
            const overallOnTime = totalHours <= totalSla;

            // Current stage (if not completed)
            const currentIdx = STATUS_STEPS.findIndex(s => s.key === traspaso.status);
            const lastTimelineTime = sortedTimeline.length > 0
              ? new Date(sortedTimeline[sortedTimeline.length - 1].created_at).getTime()
              : new Date(traspaso.created_at).getTime();
            const currentElapsedHours = (Date.now() - lastTimelineTime) / (1000 * 60 * 60);
            const currentSla = (slaConfig && slaConfig[traspaso.status]) || 24;

            const formatDuration = (hours: number) => {
              if (hours < 1) return `${Math.round(hours * 60)}min`;
              if (hours < 24) return `${hours.toFixed(1)}h`;
              return `${(hours / 24).toFixed(1)}d`;
            };

            const statusLabel = (key: string) =>
              STATUS_STEPS.find(s => s.key === key)?.label || key.replace(/_/g, " ");

            return (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4 text-accent" /> KPIs de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall summary */}
                  <div className={`rounded-lg p-3 ${overallOnTime ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {overallOnTime
                          ? <TrendingUp className="h-4 w-4 text-green-600" />
                          : <AlertTriangle className="h-4 w-4 text-red-600" />}
                        <span className={`text-sm font-semibold ${overallOnTime ? "text-green-700" : "text-red-700"}`}>
                          {overallOnTime ? "En tiempo" : "Con retraso"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Total: {formatDuration(totalHours)} / {formatDuration(totalSla)} SLA
                      </span>
                    </div>
                  </div>

                  {/* Current stage indicator */}
                  {traspaso.status !== "completado" && traspaso.status !== "cancelado" && (
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Etapa actual: {statusLabel(traspaso.status)}</span>
                        <span className={`text-xs font-bold ${currentElapsedHours > currentSla ? "text-red-600" : "text-green-600"}`}>
                          {formatDuration(currentElapsedHours)} / {formatDuration(currentSla)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((currentElapsedHours / currentSla) * 100, 100)}
                        className={`h-2 ${currentElapsedHours > currentSla ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                      />
                    </div>
                  )}

                  {/* Per-stage breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Desglose por etapa</p>
                    {stageKpis.map((kpi) => (
                      <div key={kpi.status} className="flex items-center gap-3 text-xs">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${kpi.isOverdue ? "bg-red-500" : "bg-green-500"}`} />
                        <span className="flex-1 truncate">{statusLabel(kpi.status)}</span>
                        <span className={`font-mono font-medium ${kpi.isOverdue ? "text-red-600" : "text-foreground"}`}>
                          {formatDuration(kpi.durationHours)}
                        </span>
                        <span className="text-muted-foreground">/ {formatDuration(kpi.slaHours)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {traspaso.escrow_status !== "no_aplica" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Escrow / Pago Seguro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-lg font-bold">RD$ {Number(traspaso.precio_vehiculo || 0).toLocaleString()}</p>
                <Select
                  value={traspaso.escrow_status}
                  onValueChange={(v) => updateTraspaso.mutate({ escrow_status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESCROW_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Mensajero */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mensajero Asignado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                value={mensajero}
                onChange={(e) => setMensajero(e.target.value)}
                placeholder="Nombre del mensajero"
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => updateTraspaso.mutate({ mensajero_nombre: mensajero })}
              >
                Guardar Mensajero
              </Button>
            </CardContent>
          </Card>

          {/* Contract Generator - generate, preview, sign */}
          <Card>
            <CardContent className="pt-4">
              <ContractGenerator
                traspasoId={traspaso.id}
                contractData={{
                  vehiculo_marca: traspaso.vehiculo_marca || "",
                  vehiculo_modelo: traspaso.vehiculo_modelo || "",
                  vehiculo_ano: traspaso.vehiculo_ano || "",
                  vehiculo_placa: traspaso.vehiculo_placa || "",
                  vehiculo_color: traspaso.vehiculo_color || "",
                  vehiculo_chasis: traspaso.vehiculo_chasis || "",
                  tipo_vehiculo: traspaso.tipo_vehiculo || "vehiculo_motor",
                  vendedor_nombre: traspaso.vendedor_nombre || "",
                  vendedor_cedula: traspaso.vendedor_cedula || "",
                  vendedor_rnc: traspaso.vendedor_rnc || "",
                  vendedor_tipo_persona: traspaso.vendedor_tipo_persona || "fisica",
                  vendedor_telefono: traspaso.vendedor_telefono || "",
                  comprador_nombre: traspaso.comprador_nombre || "",
                  comprador_cedula: traspaso.comprador_cedula || "",
                  comprador_rnc: traspaso.comprador_rnc || "",
                  comprador_tipo_persona: traspaso.comprador_tipo_persona || "fisica",
                  comprador_telefono: traspaso.comprador_telefono || "",
                  precio_vehiculo: traspaso.precio_vehiculo ? Number(traspaso.precio_vehiculo) : null,
                  medio_pago: traspaso.medio_pago || "",
                  fecha_acto_venta: traspaso.fecha_acto_venta || "",
                  es_traspaso_familiar: traspaso.es_traspaso_familiar || false,
                  tiene_apoderado: traspaso.tiene_apoderado || false,
                  apoderado_nombre: traspaso.apoderado_nombre || "",
                  apoderado_cedula: traspaso.apoderado_cedula || "",
                  codigo: traspaso.codigo || "",
                } as ContractData}
                contracts={contratos || []}
                signatures={firmas || []}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ["admin-contratos", id] });
                  queryClient.invalidateQueries({ queryKey: ["admin-firmas", id] });
                }}
              />
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                placeholder="Notas internas..."
                rows={3}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => updateTraspaso.mutate({ notas_internas: notasInternas })}
              >
                Guardar Notas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
