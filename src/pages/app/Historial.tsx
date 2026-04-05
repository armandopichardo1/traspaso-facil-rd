import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  completado: "Completado",
};

export default function Historial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: consultas, isLoading } = useQuery({
    queryKey: ["my-historial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_consultas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = consultas?.filter(
    (c) => !search || c.placa.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-xl font-bold">Mis Consultas de Historial</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No tienes consultas de historial aún.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered?.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/app/historial/${c.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lg">{c.placa}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("es-DO")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      c.status === "completado"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {STATUS_LABELS[c.status] || c.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
