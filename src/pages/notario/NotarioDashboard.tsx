import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTraspasosForRole } from "@/hooks/useTraspasoServices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Car, ArrowRight, RefreshCw, FileCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/StateView";

export default function NotarioDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useTraspasosForRole("notario", profile?.id);
  const traspasos = data ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["traspasos", "notario", profile?.id] });
    refetch();
  };

  const pendientes = traspasos.filter(t => t.status !== "completado" && t.status !== "cancelado");
  const completados = traspasos.filter(t => t.status === "completado");

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-accent" />
            Firmas Pendientes
          </h1>
          <p className="text-sm text-muted-foreground">Traspasos pendientes de certificación</p>
        </div>
        <Button variant="ghost" size="icon" onClick={refresh}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <Scale className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold">{traspasos.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-cta" />
            <p className="text-lg font-bold">{pendientes.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <FileCheck className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{completados.length}</p>
            <p className="text-[10px] text-muted-foreground">Certificados</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} className="space-y-3" rowClassName="h-28 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message || "No se pudo cargar la cola."}
          onRetry={() => refetch()}
        />
      ) : traspasos.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No hay traspasos pendientes de firma"
          description="Cuando un gestor envíe un contrato a certificar, aparecerá aquí."
        />
      ) : (
        <div className="space-y-3">
          {traspasos.map((t) => {
            const isPending = t.status !== "completado" && t.status !== "cancelado";
            return (
              <Card
                key={t.id}
                className={`cursor-pointer hover:border-accent/50 transition-colors border-l-4 ${
                  isPending ? "border-l-cta" : "border-l-green-500"
                }`}
                onClick={() => navigate(`/notario/traspaso/${t.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {t.vehiculoMarca} {t.vehiculoModelo}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {t.vehiculoPlaca || "Sin placa"} · {t.codigo}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>Vendedor: {t.vendedorNombre || "—"}</span>
                        <span className="mx-2">→</span>
                        <span>Comprador: {t.compradorNombre || "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className={`text-xs ${isPending ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
