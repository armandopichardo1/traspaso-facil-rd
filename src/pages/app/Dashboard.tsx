import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlusCircle, Car, Clock, ArrowRight, FileText, Activity } from "lucide-react";
import { useState } from "react";

const STATUS_STEPS = [
  "solicitud_recibida", "verificacion_antifraude", "contrato_firmado",
  "matricula_recogida", "plan_piloto", "dgii_proceso", "completado"
];

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "Solicitud Recibida",
  verificacion_antifraude: "Verificación Antifraude",
  contrato_firmado: "Contrato Firmado",
  matricula_recogida: "Matrícula Recogida",
  plan_piloto: "Plan Piloto",
  dgii_proceso: "DGII en Proceso",
  completado: "Completado",
  cancelado: "Cancelado",
};

const statusColor = (s: string) => {
  if (s === "completado") return "bg-green-100 text-green-800";
  if (s === "cancelado") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [placa, setPlaca] = useState("");

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

  const handleHistorial = async () => {
    if (!placa.trim()) return;
    const { data, error } = await supabase
      .from("historial_consultas")
      .insert({ placa: placa.trim().toUpperCase(), user_id: profile?.id })
      .select()
      .single();
    if (!error && data) {
      navigate(`/app/historial/${data.id}`);
    }
  };

  const getProgress = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    if (idx === -1) return 0;
    return ((idx + 1) / STATUS_STEPS.length) * 100;
  };

  const activeTraspasos = traspasos?.filter(t => t.status !== "completado" && t.status !== "cancelado") || [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">
          Hola, {profile?.nombre || "Usuario"}
        </h1>
        <p className="text-sm text-muted-foreground">Bienvenido a TRASPASA.DO</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold">{traspasos?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-cta" />
            <p className="text-lg font-bold">{activeTraspasos.length}</p>
            <p className="text-[10px] text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Search className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{historiales?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Consultas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="space-y-3 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Consultar historial por placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleHistorial()}
            />
          </div>
          <Button variant="teal" onClick={handleHistorial}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="cta" className="w-full" size="lg" onClick={() => navigate("/app/nuevo")}>
          <PlusCircle className="h-5 w-5 mr-2" />
          Nuevo Traspaso
        </Button>
      </div>

      {/* Active transfers */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Traspasos Activos
        </h2>
        {loadingTraspasos ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : traspasos && traspasos.length > 0 ? (
          <div className="space-y-3">
            {traspasos.map((t: any) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/app/traspaso/${t.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-accent" />
                      <span className="font-medium text-sm">
                        {t.vehiculo_marca} {t.vehiculo_modelo} {t.vehiculo_ano}
                      </span>
                    </div>
                    <Badge className={statusColor(t.status)} variant="secondary">
                      {STATUS_LABELS[t.status] || t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Placa: {t.vehiculo_placa} · Código: {t.codigo}
                  </p>
                  <Progress value={getProgress(t.status)} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tienes traspasos activos. ¡Crea tu primer traspaso!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent historiales */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Consultas Recientes
        </h2>
        {loadingHistoriales ? (
          <Skeleton className="h-20 w-full" />
        ) : historiales && historiales.length > 0 ? (
          <div className="space-y-2">
            {historiales.map((h: any) => (
              <Card
                key={h.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/app/historial/${h.id}`)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{h.placa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={h.status === "completado" ? "default" : "secondary"} className="text-xs">
                      {h.status}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has consultado ningún historial.
          </p>
        )}
      </div>
    </div>
  );
}
