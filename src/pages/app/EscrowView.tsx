import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  Clock,
  ShieldCheck,
  Info,
  QrCode,
  HelpCircle,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCreateEscrowDeposit } from "@/hooks/useTraspasoServices";

type EscrowStatus = "no_aplica" | "pendiente" | "depositado" | "liberado" | "reembolsado";

const ESCROW_STEPS: Array<{ key: EscrowStatus; label: string; desc: string; icon: any }> = [
  {
    key: "pendiente",
    label: "Esperando tu depósito",
    desc: "Inicia el depósito en custodia para arrancar el traspaso",
    icon: Wallet,
  },
  {
    key: "depositado",
    label: "Fondos en custodia",
    desc: "Tu dinero está protegido por TRASPASA.DO",
    icon: ShieldCheck,
  },
  {
    key: "liberado",
    label: "Liberación al vendedor",
    desc: "Se libera cuando recibes la matrícula nueva",
    icon: Lock,
  },
];

const formatRD = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `RD$${v.toLocaleString("es-DO")}`;
};

export default function EscrowView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const depositMutation = useCreateEscrowDeposit(id ?? "");

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

  const escrowStatus = (traspaso.escrow_status as EscrowStatus) ?? "pendiente";
  const amount = Number(traspaso.precio_vehiculo ?? 0);
  const isDeposited = escrowStatus === "depositado" || escrowStatus === "liberado";
  const isReleased = escrowStatus === "liberado";
  const isRefunded = escrowStatus === "reembolsado";
  const canDeposit =
    !isDeposited && !isRefunded && amount > 0 && (escrowStatus === "pendiente" || escrowStatus === "no_aplica");

  const escrowIdx = ESCROW_STEPS.findIndex((s) => s.key === escrowStatus);
  const progressPct = ((Math.max(escrowIdx, 0) + 1) / ESCROW_STEPS.length) * 100;

  const handleDeposit = async () => {
    if (!id || amount <= 0) return;

    // Optimistic update — mover el stepper a "depositado" inmediatamente
    const previous = qc.getQueryData<any>(["traspaso-escrow", id]);
    qc.setQueryData(["traspaso-escrow", id], (old: any) =>
      old ? { ...old, escrow_status: "depositado" } : old,
    );

    try {
      await depositMutation.mutateAsync(amount);
      toast.success("Depósito en custodia confirmado");
      // Refrescar con datos reales del backend
      qc.invalidateQueries({ queryKey: ["traspaso-escrow", id] });
    } catch (err: any) {
      // Rollback
      qc.setQueryData(["traspaso-escrow", id], previous);
      toast.error(
        err?.message ||
          "No pudimos procesar tu depósito. Verifica tu conexión e inténtalo de nuevo.",
      );
    }
  };

  // Badge dinámico según estado
  const statusBadge = (() => {
    if (isRefunded) {
      return { label: "REEMBOLSADO", className: "bg-destructive/10 text-destructive border-destructive/20" };
    }
    if (isReleased) {
      return { label: "LIBERADO AL VENDEDOR", className: "bg-success/15 text-success border-success/30" };
    }
    if (isDeposited) {
      return { label: "EN CUSTODIA", className: "bg-warning/15 text-warning border-warning/50" };
    }
    return { label: "PENDIENTE DE DEPÓSITO", className: "bg-muted text-muted-foreground border-border" };
  })();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <button
        onClick={() => navigate(`/app/traspaso/${id}`)}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al traspaso
      </button>

      {/* Header */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          {isDeposited ? "Tu dinero está seguro." : "Deposita en custodia."}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDeposited
            ? "Estado de tu pago en custodia (Escrow)."
            : "Tu pago se mantiene bajo protección hasta que recibas la matrícula nueva."}
        </p>
      </motion.div>

      {/* Amount card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6 rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="relative h-28 w-28 mx-auto mb-4">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="6"
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

            <Badge className={`font-bold text-xs mb-3 border ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>

            <p className="text-3xl font-extrabold text-foreground">{formatRD(amount)}</p>
            <p className="text-sm text-muted-foreground mt-1">💰 Pago del vehículo</p>

            {isDeposited && (
              <div className="mt-4 inline-flex items-center gap-2 bg-success/10 border border-success/30 rounded-full px-4 py-1.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-xs font-bold text-success">VERIFICADO POR TRASPASA.DO</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA de depósito (antes de depositar) */}
      {canDeposit && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="mb-6 rounded-2xl border-2 border-accent/30 bg-accent/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-bold mb-1">Esto es un depósito en custodia, no un pago al vendedor.</p>
                  <p className="text-muted-foreground text-xs">
                    Tu dinero queda retenido por TRASPASA.DO y solo se libera al vendedor cuando recibes la matrícula nueva a tu nombre.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="w-full h-12 rounded-xl font-bold bg-success hover:bg-success text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {depositMutation.isPending
                  ? "Procesando depósito..."
                  : `Depositar ${formatRD(amount)} en custodia`}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Al continuar aceptas los términos del servicio de custodia de TRASPASA.DO.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Confirmación post-depósito */}
      {isDeposited && !isReleased && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="mb-6 rounded-2xl border-success/30 bg-success/10">
            <CardContent className="p-5 flex gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-bold text-success mb-1">Tus fondos están en custodia.</p>
                <p className="text-success/80 text-xs">
                  Se liberan al vendedor solo cuando recibes la matrícula nueva. Si el traspaso se cancela, te devolvemos el 100% del depósito.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Liberado */}
      {isReleased && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="mb-6 rounded-2xl border-success/30 bg-success/10">
            <CardContent className="p-5 flex gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-bold text-success mb-1">Fondos liberados al vendedor.</p>
                <p className="text-success/80 text-xs">
                  El traspaso se completó con éxito y el pago fue transferido al vendedor.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reembolsado */}
      {isRefunded && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="mb-6 rounded-2xl border-destructive/30 bg-destructive/5">
            <CardContent className="p-5 flex gap-3">
              <Info className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-bold text-destructive mb-1">Depósito reembolsado.</p>
                <p className="text-muted-foreground text-xs">
                  El traspaso fue cancelado y te devolvimos el 100% del monto depositado.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                        done
                          ? "bg-success text-white"
                          : isCurrent
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done && !isCurrent ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    {!isLast && <div className={`w-0.5 h-10 ${done ? "bg-success" : "bg-muted"}`} />}
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex gap-3">
          <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Los fondos se liberan automáticamente cuando recibes la matrícula nueva y confirmas la entrega con tu <strong>código QR</strong>.
          </p>
        </div>
      </motion.div>

      {/* QR Section (solo cuando ya está depositado) */}
      {isDeposited && !isReleased && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="mb-6 rounded-2xl bg-muted/30">
            <CardContent className="p-6 text-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Escanea al recibir la matrícula
              </h3>
              <div className="h-40 w-40 mx-auto bg-card border-2 border-dashed border-border rounded-xl flex items-center justify-center mb-3">
                <QrCode className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground">
                Muestra este código al mensajero cuando recibas tu nueva matrícula.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
