import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTraspasosForRole } from "@/hooks/useTraspasoServices";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle, Car, FileText, CheckCircle, Clock, DollarSign, Search, ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/StateView";

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "SOLICITUD",
  verificacion_antifraude: "ANTIFRAUDE",
  documentos_completos: "DOCUMENTOS",
  documentos_pendientes: "DOCS PENDIENTES",
  contrato_generado: "CONTRATO",
  contrato_firmado: "FIRMADO",
  matricula_recogida: "RECOGIDA",
  plan_piloto: "PLAN PILOTO",
  dgii_proceso: "DGII",
  completado: "COMPLETADO",
  cancelado: "CANCELADO",
};

const statusDot = (s: string) => {
  if (s === "completado") return "bg-success/100";
  if (s === "cancelado") return "bg-destructive/100";
  if (s === "contrato_firmado") return "bg-orange/100";
  return "bg-teal/100";
};

const statusBadgeColor = (s: string) => {
  if (s === "completado") return "bg-success/10 text-success border-success/30";
  if (s === "cancelado") return "bg-destructive/10 text-destructive border-destructive/30";
  if (s === "contrato_firmado") return "bg-orange/10 text-orange border-orange/30";
  return "bg-teal/10 text-teal border-teal/30";
};

export default function GestorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: traspasos, isLoading, isError, error, refetch } = useTraspasosForRole("gestor", profile?.id);

  const activos = traspasos?.filter(t => t.status !== "completado" && t.status !== "cancelado") || [];
  const completados = traspasos?.filter(t => t.status === "completado") || [];
  const totalGastado = traspasos?.reduce((sum, t) => sum + (t.precioServicio || 0), 0) || 0;

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Hace minutos";
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground">Hola, {profile?.nombre || "Gestor"} · TRASPASA.DO</p>
        </div>
        <Button variant="cta" onClick={() => navigate("/gestor/nuevo")}>
          <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Traspaso
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-accent" />
              <Badge className="bg-success/15 text-success text-[10px]">↑ 12%</Badge>
            </div>
            <p className="text-2xl font-extrabold">{activos.length}</p>
            <p className="text-xs text-muted-foreground">Traspasos Activos</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <CheckCircle className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-extrabold">{completados.length}</p>
            <p className="text-xs text-muted-foreground">Completados (Mes)</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-cta mb-2" />
            <p className="text-2xl font-extrabold">2.4h</p>
            <p className="text-xs text-muted-foreground">Tiempo Promedio</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-accent mb-2" />
            <p className="text-2xl font-extrabold">RD${(totalGastado / 1000).toFixed(0)}k</p>
            <p className="text-xs text-muted-foreground">Gastado (Mes)</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Table */}
        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Traspasos Recientes</h2>
            <select className="text-xs border rounded-lg px-3 py-1.5 bg-card text-muted-foreground">
              <option>Todos los estatus</option>
            </select>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={3} className="space-y-3" rowClassName="h-16 w-full rounded-xl" />
          ) : isError ? (
            <ErrorState
              message={(error as Error)?.message || "No se pudieron cargar los traspasos."}
              onRetry={() => refetch()}
            />
          ) : traspasos && traspasos.length > 0 ? (
            <Card className="rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-4">VEHÍCULO</div>
                  <div className="col-span-2">PLACA</div>
                  <div className="col-span-3">CLIENTE</div>
                  <div className="col-span-2">ESTATUS</div>
                  <div className="col-span-1"></div>
                </div>
                {traspasos.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(`/gestor/traspaso/${t.id}`)}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <Car className="h-4 w-4 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium truncate">
                          {t.vehiculoMarca} {t.vehiculoModelo}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{timeSince(t.createdAt)}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm font-mono">{t.vehiculoPlaca || "—"}</div>
                    <div className="col-span-3 text-sm truncate">{t.compradorNombre || "—"}</div>
                    <div className="col-span-2">
                      <Badge className={`text-[9px] font-bold border ${statusBadgeColor(t.status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot(t.status)} mr-1`} />
                        {STATUS_LABELS[t.status] || t.status}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-accent text-xs font-semibold cursor-pointer hover:underline">Ver</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={Car}
              title="No hay traspasos aún"
              description="Comienza creando tu primer traspaso desde el botón arriba."
              action={
                <Button variant="cta" size="sm" onClick={() => navigate("/gestor/nuevo")}>
                  <PlusCircle className="h-4 w-4 mr-1.5" /> Nuevo Traspaso
                </Button>
              }
            />
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* History reports */}
          <Card className="rounded-xl bg-accent/5 border-accent/20">
            <CardContent className="p-5">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-bold text-sm mb-1">Informes de Historial</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Verifica el estatus legal de cualquier vehículo antes de iniciar un traspaso.
              </p>
              <Button variant="teal" className="w-full" size="sm">
                Solicitar Acceso
              </Button>
            </CardContent>
          </Card>

          {/* Dealer badge */}
          <Card className="rounded-xl border-success/30 bg-success/10/50">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-success">Dealer Verificado</p>
                <p className="text-xs text-success/80 mt-0.5">
                  Acceso prioritario y precios mayoristas en traspasos.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
