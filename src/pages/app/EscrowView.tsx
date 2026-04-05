import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, CheckCircle, Clock, ShieldCheck } from "lucide-react";

const ESCROW_STEPS = [
  { key: "depositado", label: "Fondos Depositados", icon: Lock },
  { key: "en_custodia", label: "En Custodia", icon: ShieldCheck },
  { key: "liberado", label: "Liberado al Vendedor", icon: CheckCircle },
];

export default function EscrowView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: traspaso, isLoading } = useQuery({
    queryKey: ["traspaso-escrow", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!traspaso) return null;

  const escrowIdx = ESCROW_STEPS.findIndex((s) => s.key === traspaso.escrow_status);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => navigate(`/app/traspaso/${id}`)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver al traspaso
      </button>

      <h1 className="text-xl font-bold mb-6">Pago Seguro (Escrow)</h1>

      {/* Amount */}
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 relative">
            <Lock className="h-10 w-10 text-accent" />
            {/* Progress ring visual */}
            <svg className="absolute inset-0 h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--accent))" strokeWidth="4"
                strokeDasharray={`${((escrowIdx + 1) / ESCROW_STEPS.length) * 226} 226`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Monto en custodia</p>
          <p className="text-3xl font-bold text-foreground">
            RD$ {traspaso.precio_vehiculo ? Number(traspaso.precio_vehiculo).toLocaleString() : "0"}
          </p>
          <p className="text-sm text-accent font-medium capitalize mt-1">
            {traspaso.escrow_status.replace(/_/g, " ")}
          </p>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-semibold text-sm mb-4">Estado del Pago</h2>
          {ESCROW_STEPS.map((s, i) => {
            const done = i <= escrowIdx;
            return (
              <div key={s.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  {i < ESCROW_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 ${done ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm text-center text-accent">
        Los fondos se liberan cuando confirmes la entrega del vehículo
      </div>
    </div>
  );
}
