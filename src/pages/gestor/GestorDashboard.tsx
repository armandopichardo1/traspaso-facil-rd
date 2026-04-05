import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Car, ArrowRight, FileText, CheckCircle, AlertTriangle } from "lucide-react";

const STATUS_STEPS = [
  "solicitud_recibida", "verificacion_antifraude", "contrato_firmado",
  "matricula_recogida", "plan_piloto", "dgii_proceso", "completado"
];

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "Solicitud Recibida",
  documentos_pendientes: "Docs Pendientes",
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

export default function GestorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: traspasos, isLoading } = useQuery({
    queryKey: ["gestor-traspasos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activos = traspasos?.filter(t => t.status !== "completado" && t.status !== "cancelado") || [];
  const completados = traspasos?.filter(t => t.status === "completado") || [];

  const getProgress = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    if (idx === -1) return 0;
    return ((idx + 1) / STATUS_STEPS.length) * 100;
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-foreground">
        Hola, {profile?.nombre || "Gestor"} 👋
      </h1>
      <p className="text-sm text-muted-foreground mb-4">Panel de Gestor · TRASPASA.DO</p>

      {/* Stats */}
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
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-cta" />
            <p className="text-lg font-bold">{activos.length}</p>
            <p className="text-[10px] text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{completados.length}</p>
            <p className="text-[10px] text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
      </div>

      <Button variant="cta" className="w-full mb-6" size="lg" onClick={() => navigate("/gestor/nuevo")}>
        <PlusCircle className="h-5 w-5 mr-2" />
        Nuevo Traspaso (Precio Mayorista)
      </Button>

      {/* Active transfers */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Traspasos Activos
      </h2>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : activos.length > 0 ? (
        <div className="space-y-3 mb-8">
          {activos.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/gestor/traspaso/${t.id}`)}
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
                <p className="text-xs text-muted-foreground mb-1">
                  Placa: {t.vehiculo_placa} · Código: {t.codigo}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Comprador: {t.comprador_nombre || "—"} · Vendedor: {t.vendedor_nombre || "—"}
                </p>
                <Progress value={getProgress(t.status)} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No tienes traspasos activos asignados.
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completados.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Completados
          </h2>
          <div className="space-y-2 mb-8">
            {completados.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/gestor/traspaso/${t.id}`)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {t.vehiculo_marca} {t.vehiculo_modelo} · {t.vehiculo_placa}
                    </span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
