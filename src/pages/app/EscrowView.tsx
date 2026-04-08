import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, CheckCircle, Clock, ShieldCheck, Info, QrCode, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const ESCROW_STEPS = [
  {
    key: "depositado",
    label: "Comprador depositó fondos",
    desc: "Completado ayer, 2:45 PM",
    icon: CheckCircle,
  },
  {
    key: "en_custodia",
    label: "Fondos verificados y en custodia",
    desc: "Seguridad de nivel bancario activa",
    icon: ShieldCheck,
  },
  {
    key: "en_proceso",
    label: "Traspaso en proceso",
    desc: "Estamos validando los documentos en DGII",
    icon: Clock,
  },
  {
    key: "liberado",
    label: "Liberación al vendedor",
    desc: "Esperando confirmación de entrega",
    icon: Lock,
  },
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
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!traspaso) return null;

  const escrowIdx = ESCROW_STEPS.findIndex((s) => s.key === traspaso.escrow_status);
  const progressPct = ((Math.max(escrowIdx, 0) + 1) / ESCROW_STEPS.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <button
        onClick={() => navigate(`/app/traspaso/${id}`)}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al traspaso
      </button>

      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Tu dinero está seguro.
        </h1>
        <p className="text-sm text-muted-foreground">
          Estado de tu pago en custodia (Escrow).
        </p>
      </motion.div>

      {/* Amount card with ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6 rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            {/* Progress ring */}
            <div className="relative h-28 w-28 mx-auto mb-4">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <motion.circle
                  cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--accent))" strokeWidth="6"
                  strokeDasharray={`${(progressPct / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 301.6" }}
                  animate={{ strokeDasharray: `${(progressPct / 100) * 301.6} 301.6` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-accent" />
                </div>
              </div>
            </div>

            {/* Status badge */}
            <Badge className="bg-accent/10 text-accent border-accent/20 font-bold text-xs mb-3">
              EN CUSTODIA — PENDIENTE DE TRASPASO
            </Badge>

            {/* Amount */}
            <p className="text-3xl font-extrabold text-foreground">
              RD${traspaso.precio_vehiculo ? Number(traspaso.precio_vehiculo).toLocaleString() : "0"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">💰 Pago del vehículo</p>

            {/* Verified badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">VERIFICADO POR TRASPASA.DO</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Progreso del Proceso
        </h2>
        <Card className="mb-6 rounded-2xl">
          <CardContent className="p-5">
            {ESCROW_STEPS.map((s, i) => {
              const done = i <= escrowIdx;
              const isCurrent = i === escrowIdx;
              const isLast = i === ESCROW_STEPS.length - 1;
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                      done ? "bg-green-500 text-white" : isCurrent ? "bg-cta/20 text-cta" : "bg-muted text-muted-foreground"
                    }`}>
                      {done && !isCurrent ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <s.icon className="h-4 w-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-10 ${done ? "bg-green-500" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm ${done || isCurrent ? "font-bold" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex gap-3">
          <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Los fondos se liberan automáticamente cuando el traspaso se complete y el comprador confirme la entrega del vehículo con <strong>código QR</strong>.
          </p>
        </div>
      </motion.div>

      {/* QR Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="mb-6 rounded-2xl bg-muted/30">
          <CardContent className="p-6 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Escanea al recibir el vehículo
            </h3>
            <div className="h-40 w-40 mx-auto bg-card border-2 border-dashed border-border rounded-xl flex items-center justify-center mb-3">
              <QrCode className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo muestra este código al vendedor cuando tengas las llaves y el vehículo en tu poder.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help button */}
      <Button
        variant="destructive"
        className="w-full rounded-xl h-12 font-bold"
        onClick={() => window.open("https://wa.me/18092001234?text=Necesito ayuda con mi pago en custodia", "_blank")}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Necesito ayuda con mi pago
      </Button>
    </div>
  );
}
