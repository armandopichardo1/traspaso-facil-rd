import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTraspasosForRole } from "@/hooks/useTraspasoServices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, ArrowRight, RefreshCw, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/StateView";

export default function MensajeroDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useTraspasosForRole("mensajero", profile?.id);
  const traspasos = data ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["traspasos", "mensajero", profile?.id] });
    refetch();
  };

  const pendientes = traspasos.filter(t => t.status !== "completado" && t.status !== "cancelado");
  const completados = traspasos.filter(t => t.status === "completado");

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            Entregas
          </h1>
          <p className="text-sm text-muted-foreground">Recogida y entrega de matrículas</p>
        </div>
        <Button variant="ghost" size="icon" onClick={refresh}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <Truck className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold">{traspasos.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-cta" />
            <p className="text-lg font-bold">{pendientes.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{completados.length}</p>
            <p className="text-[10px] text-muted-foreground">Entregados</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} className="space-y-3" rowClassName="h-28 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message || "No se pudo cargar la lista de entregas."}
          onRetry={() => refetch()}
        />
      ) : traspasos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No hay entregas pendientes"
          description="Cuando un traspaso esté listo para recogida, aparecerá aquí."
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
                onClick={() => navigate(`/mensajero/traspaso/${t.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="font-semibold">
                          {t.vehiculoMarca} {t.vehiculoModelo}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        Placa: {t.vehiculoPlaca || "—"} · {t.codigo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vendedor: {t.vendedorNombre || "—"}
                        {t.vendedorTelefono && (
                          <a
                            href={`tel:${t.vendedorTelefono}`}
                            className="ml-2 text-accent font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t.vendedorTelefono}
                          </a>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className={`text-xs ${isPending ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
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
