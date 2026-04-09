import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlusCircle, Car, ArrowRight, FileText, ShieldCheck, CheckCircle, Clock, Phone } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { STATUS_STEPS, STATUS_LABELS, getProgress, CLIENT_PROGRESS_LABELS } from "@/lib/traspaso-status";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [placa, setPlaca] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: traspasos, isLoading: loadingTraspasos } = useQuery({
    queryKey: ["my-traspasos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: historiales, isLoading: loadingHistoriales } = useQuery({
    queryKey: ["my-historiales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_consultas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const needsTelefono = !profile?.telefono;

  const handleHistorial = async () => {
    if (!placa.trim()) return;
    if (needsTelefono && !telefono.trim()) {
      toast.error("Ingresa tu número de WhatsApp para recibir el informe");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("historial_consultas")
        .insert({
          placa: placa.trim().toUpperCase(),
          user_id: profile?.id,
          telefono: needsTelefono ? telefono.trim() : profile?.telefono,
        });

      if (error) throw error;

      setSubmitted(true);
      setPlaca("");
      setTelefono("");
      toast.success("¡Solicitud recibida! Te enviaremos el informe por WhatsApp en menos de 30 minutos.");
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
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
          <Card className="rounded-2xl border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-green-800">¡Solicitud Recibida!</h3>
              <p className="text-sm text-green-700 mt-1">
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
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
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
        <Skeleton className="h-52 w-full mb-4 rounded-2xl" />
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
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
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
                    {activeOne.vehiculo_marca || "Vehículo"}{" "}
                    {activeOne.vehiculo_modelo || ""}{" "}
                    {activeOne.vehiculo_ano || ""}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    PLACA: {activeOne.vehiculo_placa || "—"}
                  </p>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] font-bold whitespace-nowrap">
                  {STATUS_LABELS[activeOne.status] || activeOne.status} ✅
                </Badge>
              </div>

              {/* Segmented progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Progreso del Traspaso</span>
                  <span className="text-sm font-bold text-accent">{getProgressPercent(activeOne.status)}%</span>
                </div>
                <div className="flex gap-1">
                  {CLIENT_PROGRESS_LABELS.map((label, i) => {
                    const step = getProgressStep(activeOne.status);
                    const filled = i <= step;
                    return (
                      <div key={label} className="flex-1">
                        <div
                          className={`h-2 rounded-full ${
                            filled ? "bg-accent" : "bg-muted"
                          }`}
                        />
                        <p className={`text-[8px] mt-1 text-center font-medium ${
                          filled ? "text-accent" : "text-muted-foreground"
                        }`}>
                          {label}
                        </p>
                      </div>
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
                    {t.vehiculo_marca} {t.vehiculo_modelo} · {t.vehiculo_placa}
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
          <Skeleton className="h-32 w-full rounded-xl" />
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
                    {t.vehiculo_marca} {t.vehiculo_modelo} {t.vehiculo_ano}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PLACA: {t.vehiculo_placa || "—"}
                  </p>
                  <Badge className={`mt-2 text-[10px] ${
                    t.status === "completado"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
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
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
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
