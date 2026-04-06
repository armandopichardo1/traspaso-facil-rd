import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle, BarChart3, Loader2,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "Solicitud Recibida",
  verificacion_antifraude: "Verificación Antifraude",
  contrato_firmado: "Contrato Firmado",
  matricula_recogida: "Matrícula Recogida",
  plan_piloto: "Plan Piloto + DGII",
  dgii_proceso: "Nueva Matrícula Lista",
  completado: "Completado",
};

type TimelineEntry = { traspaso_id: string; status: string; created_at: string };
type SlaRow = { etapa: string; horas_objetivo: number };
type TraspasoRow = { id: string; created_at: string; status: string };

export default function MetricsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [tRes, tlRes, slaRes] = await Promise.all([
        supabase.from("traspasos").select("id, created_at, status"),
        supabase.from("traspaso_timeline").select("traspaso_id, status, created_at").order("created_at", { ascending: true }),
        supabase.from("sla_config").select("etapa, horas_objetivo"),
      ]);
      if (tRes.error) throw tRes.error;
      if (tlRes.error) throw tlRes.error;
      if (slaRes.error) throw slaRes.error;

      const slaMap: Record<string, number> = {};
      (slaRes.data as SlaRow[]).forEach((r) => { slaMap[r.etapa] = Number(r.horas_objetivo); });

      const traspasos = tRes.data as TraspasoRow[];
      const timeline = tlRes.data as TimelineEntry[];

      // Group timeline by traspaso
      const tlByTraspaso: Record<string, TimelineEntry[]> = {};
      timeline.forEach((e) => {
        if (!tlByTraspaso[e.traspaso_id]) tlByTraspaso[e.traspaso_id] = [];
        tlByTraspaso[e.traspaso_id].push(e);
      });

      // Per-stage stats
      const stageStats: Record<string, { durations: number[]; overdue: number }> = {};
      let totalOnTime = 0;
      let totalWithTimeline = 0;

      traspasos.forEach((t) => {
        const entries = tlByTraspaso[t.id];
        if (!entries || entries.length === 0) return;
        totalWithTimeline++;

        let allOnTime = true;
        entries.forEach((entry, idx) => {
          const prevTime = idx === 0
            ? new Date(t.created_at).getTime()
            : new Date(entries[idx - 1].created_at).getTime();
          const dur = (new Date(entry.created_at).getTime() - prevTime) / (1000 * 60 * 60);
          const sla = slaMap[entry.status] || 24;

          if (!stageStats[entry.status]) stageStats[entry.status] = { durations: [], overdue: 0 };
          stageStats[entry.status].durations.push(dur);
          if (dur > sla) {
            stageStats[entry.status].overdue++;
            allOnTime = false;
          }
        });

        if (allOnTime) totalOnTime++;
      });

      const onTimePct = totalWithTimeline > 0 ? Math.round((totalOnTime / totalWithTimeline) * 100) : 0;

      // Build stage metrics sorted by avg duration desc (bottleneck first)
      const stageMetrics = Object.entries(stageStats).map(([stage, stats]) => {
        const avg = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
        const sla = slaMap[stage] || 24;
        const onTimePctStage = Math.round(((stats.durations.length - stats.overdue) / stats.durations.length) * 100);
        return { stage, avg, sla, count: stats.durations.length, overdue: stats.overdue, onTimePct: onTimePctStage };
      }).sort((a, b) => (b.avg / b.sla) - (a.avg / a.sla));

      // Active by status
      const statusCounts: Record<string, number> = {};
      traspasos.forEach((t) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });

      return {
        totalTraspasos: traspasos.length,
        totalWithTimeline,
        onTimePct,
        stageMetrics,
        statusCounts,
      };
    },
  });

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculando métricas...
      </div>
    );
  }

  if (!data || data.totalTraspasos === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No hay traspasos suficientes para generar métricas.
      </div>
    );
  }

  const bottleneck = data.stageMetrics.length > 0 ? data.stageMetrics[0] : null;

  return (
    <div className="p-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-accent mb-1" />
            <p className="text-2xl font-extrabold">{data.totalTraspasos}</p>
            <p className="text-xs text-muted-foreground">Total Traspasos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-extrabold">{data.onTimePct}%</p>
            <p className="text-xs text-muted-foreground">On-Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-accent mb-1" />
            <p className="text-2xl font-extrabold">{data.totalWithTimeline}</p>
            <p className="text-xs text-muted-foreground">Con Timeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {bottleneck && (bottleneck.avg / bottleneck.sla) > 1 ? (
              <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
            ) : (
              <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            )}
            <p className="text-sm font-bold truncate">
              {bottleneck ? (STATUS_LABELS[bottleneck.stage] || bottleneck.stage) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Cuello de Botella</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tiempo Promedio por Etapa vs SLA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.stageMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos de etapas aún.</p>
          ) : data.stageMetrics.map((m) => {
            const ratio = m.avg / m.sla;
            const isOver = ratio > 1;
            return (
              <div key={m.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1">{STATUS_LABELS[m.stage] || m.stage}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] ${isOver ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {m.onTimePct}% on-time
                    </Badge>
                    <span className={`text-xs font-mono font-medium ${isOver ? "text-red-600" : "text-foreground"}`}>
                      {formatDuration(m.avg)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {formatDuration(m.sla)}</span>
                  </div>
                </div>
                <Progress
                  value={Math.min(ratio * 100, 100)}
                  className={`h-2 ${isOver ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Distribution by status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribución por Status Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="text-xs px-3 py-1">
                {STATUS_LABELS[status] || status.replace(/_/g, " ")}: <span className="font-bold ml-1">{count}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
