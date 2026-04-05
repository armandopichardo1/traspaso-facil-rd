import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, ArrowRight, RefreshCw } from "lucide-react";
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
  vendedor_telefono: string | null;
  created_at: string;
};

export default function MensajeroDashboard() {
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            Entregas
          </h1>
          <p className="text-sm text-muted-foreground">Recogida y entrega de matrículas</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchTraspasos}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : traspasos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay entregas pendientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {traspasos.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => navigate(`/mensajero/traspaso/${t.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {t.vehiculo_marca} {t.vehiculo_modelo}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Placa: {t.vehiculo_placa || "—"} · {t.codigo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vendedor: {t.vendedor_nombre || "—"}
                      {t.vendedor_telefono && (
                        <a
                          href={`tel:${t.vendedor_telefono}`}
                          className="ml-2 text-accent hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.vendedor_telefono}
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {t.status.replace(/_/g, " ")}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
