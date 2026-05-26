import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/shared/StateView";
import { Search, PlusCircle, Car, ArrowRight, FileText, ShieldCheck, CheckCircle, Clock, Phone, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { STATUS_STEPS, STATUS_LABELS, getProgress, CLIENT_PROGRESS_LABELS, isTerminal } from "@/lib/traspaso-status";
import {
  useTraspasosForRole,
  useHistorialesForUser,
  useCreateHistorialRequest,
  useTimeline,
} from "@/hooks/useTraspasoServices";
import { useTraspasoSummary } from "@/hooks/useTraspasoSummary";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [placa, setPlaca] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: traspasos, isLoading: loadingTraspasos } = useTraspasosForRole(
    "customer",
    user?.id,
    undefined,
    { refetchInterval: 15000 },
  );
  const { data: historiales, isLoading: loadingHistoriales } = useHistorialesForUser(user?.id);
  const createHistorial = useCreateHistorialRequest();

  const needsTelefono = !profile?.telefono;
  const submitting = createHistorial.isPending;

  const handleHistorial = async () => {
    if (!placa.trim()) return;
    if (needsTelefono && !telefono.trim()) {
      toast.error("Ingresa tu número de WhatsApp para recibir el informe");
      return;
    }
    try {
      await createHistorial.mutateAsync({
        placa: placa.trim().toUpperCase(),
        userId: profile?.id ?? null,
        telefono: needsTelefono ? telefono.trim() : profile?.telefono ?? undefined,
      });
      setSubmitted(true);
      setPlaca("");
      setTelefono("");
      toast.success("¡Solicitud recibida! Te enviaremos el informe por WhatsApp en menos de 30 minutos.");
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar la solicitud");
    }
  };

  const getProgressPercent = (status: string) => Math.round(getProgress(status));

  const getProgressStep = (status: string) => {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    if (idx === -1) return 0;
    return idx;
  };

  const activeTraspasos = traspasos?.filter(t => t.status !== "completado" && t.status !== "cancelado") || [];
  const recentActivity = traspasos?.filter(t => t.status === "completado" || t.status === "cancelado").slice(0, 4) || [];
  const activeOne = activeTraspasos[0];

  const { data: activeTimeline } = useTimeline(activeOne?.id, {
    refetchInterval: activeOne ? 20000 : false,
  });
  const { data: aiSummary, isLoading: loadingSummary } = useTraspasoSummary({
    traspasoId: activeOne?.id,
    status: activeOne?.status,
    codigo: activeOne?.codigo,
    vehiculo: activeOne
      ? `${activeOne.vehiculoMarca ?? ""} ${activeOne.vehiculoModelo ?? ""} ${activeOne.vehiculoAno ?? ""}`.trim()
      : null,
    timeline: activeTimeline,
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Welcome */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground">
          Hola, {profile?.nombre?.split(" ")[0] || "Usuario"} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Tu gestión vehicular a máxima velocidad.
        </p>
      </motion.div>

      {/* Historial Vehicular — Hero Card */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {submitted ? (
          <Card className="rounded-2xl border-success/30 bg-success/10">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="font-bold text-lg text-success">¡Solicitud Recibida!</h3>
              <p className="text-sm text-success mt-1">
                Te enviaremos el informe del historial por WhatsApp en menos de 30 minutos.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSubmitted(false)}
              >
                Solicitar otro informe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-0 overflow-hidden shadow-lg">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[hsl(var(--navy))] via-[hsl(var(--accent))] to-[hsl(var(--navy))] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white leading-tight">
                      Consulta Historial Vehicular
                    </h2>
                    <p className="text-white/70 text-xs">
                      Conoce todo sobre un vehículo antes de comprar — RD$350
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Ingresa la placa (ej: A123456)"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    className="h-14 text-base font-semibold rounded-xl border-0 bg-white/95 text-foreground placeholder:text-muted-foreground/60 shadow-md focus-visible:ring-2 focus-visible:ring-white/50"
                    onKeyDown={(e) => e.key === "Enter" && handleHistorial()}
                  />

                  {needsTelefono && placa.trim() && (
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tu WhatsApp (ej: 809-555-1234)"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="pl-11 h-12 rounded-xl border-0 bg-white/95 text-foreground text-sm shadow-md"
                      />
                    </div>
                  )}

                  <Button
                    className="w-full h-14 rounded-xl font-bold text-base bg-white text-[hsl(var(--accent))] hover:bg-white/90 shadow-md transition-all relative overflow-hidden group"
                    onClick={handleHistorial}
                    disabled={submitting}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-shimmer" />
                    <Search className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">{submitting ? "Enviando..." : "Obtener Informe"}</span>
                  </Button>
                </div>

                <p className="text-white/60 text-[11px] text-center mt-3">
                  ✅ Propietarios · Oposiciones · Valor DGII · Multas · Marbete
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Active transfer */}
      {loadingTraspasos ? (
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-16 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      ) : activeOne ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Traspaso Activo
            </h2>
            <Badge className="bg-success/15 text-success border-success/30 text-xs gap-1">
              <ShieldCheck className="h-3 w-3" /> Verificado
            </Badge>
          </div>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-border/50 rounded-2xl overflow-hidden"
            onClick={() => navigate(`/app/traspaso/${activeOne.id}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground leading-tight">
                    {activeOne.vehiculoMarca || "Vehículo"}{" "}
                    {activeOne.vehiculoModelo || ""}{" "}
                    {activeOne.vehiculoAno || ""}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    PLACA: {activeOne.vehiculoPlaca || "—"}
                  </p>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] font-bold whitespace-nowrap">
                  {STATUS_LABELS[activeOne.status] || activeOne.status} ✅
                </Badge>
              </div>

              {/* AI summary */}
              {!isTerminal(activeOne.status) && (
                <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 flex gap-2">
                  <Sparkles className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  {loadingSummary || !aiSummary ? (
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-xs text-foreground leading-snug">{aiSummary}</p>
                  )}
                </div>
              )}

              {/* Pills progress: emerald done, gold current, muted future */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progreso del Traspaso</span>
                  <span className="text-sm font-bold text-accent">{getProgressPercent(activeOne.status)}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CLIENT_PROGRESS_LABELS.map((label, i) => {
                    const step = getProgressStep(activeOne.status);
                    const isDone = i < step;
                    const isCurrent = i === step;
                    const cls = isDone
                      ? "bg-success/15 text-success border-success/30"
                      : isCurrent
                        ? "bg-gold/20 text-gold border-gold/40 ring-2 ring-gold/20"
                        : "bg-muted text-muted-foreground border-transparent";
                    return (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${cls}`}
                      >
                        {isDone && <CheckCircle className="h-2.5 w-2.5" />}
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <Button variant="cta" className="w-full mt-4 font-bold text-sm h-12" size="lg">
                CONTINUAR TRASPASO →
              </Button>

            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Additional active */}
      {activeTraspasos.length > 1 && (
        <div className="space-y-2 mb-4">
          {activeTraspasos.slice(1).map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow rounded-xl"
              onClick={() => navigate(`/app/traspaso/${t.id}`)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-accent" />
                  <span className="font-medium text-sm">
                    {t.vehiculoMarca} {t.vehiculoModelo} · {t.vehiculoPlaca}
                  </span>
                </div>
                <Badge className="bg-accent/10 text-accent text-[10px]">
                  {STATUS_LABELS[t.status] || t.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New transfer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Card
          className="mb-6 cursor-pointer bg-foreground text-background hover:bg-foreground/95 transition-colors rounded-2xl border-0"
          onClick={() => navigate("/app/nuevo")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-cta flex items-center justify-center flex-shrink-0">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Iniciar Nuevo Traspaso</h3>
              <p className="text-sm opacity-70">Completa tu trámite en minutos</p>
            </div>
            <ArrowRight className="h-5 w-5 opacity-50" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Actividad Reciente
            </h2>
            <p className="text-sm text-foreground font-medium">Reportes e Historial</p>
          </div>
          <button
            className="text-sm font-semibold text-accent hover:underline"
            onClick={() => navigate("/app/historial")}
          >
            Ver todo
          </button>
        </div>

        {loadingHistoriales && loadingTraspasos ? (
          <LoadingSkeleton rows={1} showHeader={false} className="space-y-1" rowClassName="h-32 w-full rounded-xl" />
        ) : (recentActivity.length > 0 || (historiales && historiales.length > 0)) ? (
          <div className="grid grid-cols-2 gap-3">
            {recentActivity.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:shadow-md transition-shadow rounded-xl"
                onClick={() => navigate(`/app/traspaso/${t.id}`)}
              >
                <CardContent className="p-4">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                    <FileText className="h-4 w-4 text-accent" />
                  </div>
                  <p className="font-bold text-sm leading-tight">
                    {t.vehiculoMarca} {t.vehiculoModelo} {t.vehiculoAno}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PLACA: {t.vehiculoPlaca || "—"}
                  </p>
                  <Badge className={`mt-2 text-[10px] ${
                    t.status === "completado"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}>
                    ● {t.status === "completado" ? "COMPLETADO" : "CANCELADO"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {historiales?.slice(0, Math.max(0, 4 - recentActivity.length)).map((h: any) => (
              <Card
                key={h.id}
                className="cursor-pointer hover:shadow-md transition-shadow rounded-xl"
                onClick={() => navigate(`/app/historial/${h.id}`)}
              >
                <CardContent className="p-4">
                  <div className="h-8 w-8 rounded-lg bg-cta/10 flex items-center justify-center mb-2">
                    <Search className="h-4 w-4 text-cta" />
                  </div>
                  <p className="font-bold text-sm">{h.placa}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Historial vehicular</p>
                  <Badge className={`mt-2 text-[10px] gap-1 ${
                    h.status === "completado"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }`}>
                    {h.status === "completado" ? (
                      <><CheckCircle className="h-3 w-3" /> COMPLETADO</>
                    ) : (
                      <><Clock className="h-3 w-3" /> EN PROCESO</>
                    )}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tienes actividad reciente. ¡Crea tu primer traspaso!</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
