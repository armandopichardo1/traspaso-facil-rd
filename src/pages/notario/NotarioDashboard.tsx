import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Car, ArrowRight, RefreshCw, FileCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Traspaso = {
  id: string;
  codigo: string | null;
  status: string;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  vendedor_nombre: string | null;
  comprador_nombre: string | null;
  created_at: string;
};

export default function NotarioDashboard() {
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTraspasos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("traspasos")
      .select("*")
      .order("created_at", { ascending: false });
    setTraspasos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTraspasos();
  }, []);

  const pendientes = traspasos.filter(t => t.status !== "completado" && t.status !== "cancelado");
  const completados = traspasos.filter(t => t.status === "completado");

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-accent" />
            Queue de Firma
          </h1>
          <p className="text-sm text-muted-foreground">Traspasos pendientes de certificación</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchTraspasos}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats */}
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : traspasos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay traspasos pendientes de firma</p>
          </CardContent>
        </Card>
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
                          {t.vehiculo_marca} {t.vehiculo_modelo}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {t.vehiculo_placa || "Sin placa"} · {t.codigo}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>Vendedor: {t.vendedor_nombre || "—"}</span>
                        <span className="mx-2">→</span>
                        <span>Comprador: {t.comprador_nombre || "—"}</span>
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
