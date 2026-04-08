import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, AlertTriangle, Share2, Car, ChevronDown, ShieldCheck, DollarSign, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

function Section({ icon: Icon, title, children, defaultOpen = false, variant = "default" }: {
  icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean;
  variant?: "default" | "danger";
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`rounded-xl overflow-hidden ${variant === "danger" ? "border-red-200" : ""}`}>
        <CollapsibleTrigger className="w-full">
          <div className={`flex items-center justify-between p-4 ${variant === "danger" ? "bg-red-50" : ""}`}>
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${variant === "danger" ? "text-red-500" : "text-accent"}`} />
              <span className="font-bold text-sm">{title}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function HistorialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: consulta, isLoading } = useQuery({
    queryKey: ["historial", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_consultas")
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
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center">
        <p className="text-muted-foreground">Consulta no encontrada.</p>
        <Button variant="ghost" onClick={() => navigate("/app")} className="mt-4">
          ← Volver
        </Button>
      </div>
    );
  }

  const resultado = consulta.resultado as any;
  const isCompleted = consulta.status === "completado" && resultado;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {/* Vehicle hero card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="rounded-2xl overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-foreground to-foreground/80 p-6 relative">
            {/* Plate badge */}
            <Badge className="bg-accent text-white border-0 font-mono text-sm font-bold mb-4">
              {consulta.placa}
            </Badge>
            {/* Vehicle placeholder */}
            <div className="h-32 flex items-center justify-center">
              <Car className="h-20 w-20 text-white/20" />
            </div>
          </div>
          <CardContent className="p-4 text-center">
            <h1 className="text-xl font-extrabold text-foreground">
              {isCompleted && resultado?.marca
                ? `${resultado.marca} ${resultado.modelo || ""} ${resultado.ano || ""}`
                : `Placa: ${consulta.placa}`}
            </h1>
            {isCompleted && (
              <div className="mt-2 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">Verificado por TRASPASA.DO</span>
              </div>
            )}
            {!isCompleted && (
              <Badge variant="secondary" className="mt-2">⏳ Procesando...</Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {!isCompleted ? (
        <Card className="rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse mb-4">
              <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                <Car className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="font-semibold mb-2">Procesando tu consulta</h2>
            <p className="text-sm text-muted-foreground">
              Estamos verificando la información del vehículo. Te notificaremos cuando el reporte esté listo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Datos del vehículo */}
          <Section icon={Car} title="Datos del Vehículo" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Marca</p>
                <p className="font-bold">{resultado?.marca || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Modelo</p>
                <p className="font-bold">{resultado?.modelo || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Año</p>
                <p className="font-bold">{resultado?.ano || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Color</p>
                <p className="font-bold">{resultado?.color || "N/A"}</p>
              </div>
              {resultado?.chasis && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Chasis (VIN)</p>
                  <p className="font-bold font-mono text-xs">{resultado.chasis}</p>
                </div>
              )}
            </div>
          </Section>

          {/* Oposiciones */}
          <Section
            icon={AlertTriangle}
            title="Oposiciones y Alertas"
            variant={resultado?.oposiciones ? "danger" : "default"}
          >
            {resultado?.oposiciones ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                ⚠️ {resultado.oposiciones}
              </div>
            ) : (
              <p className="text-sm text-green-700 font-medium">✅ Sin oposiciones registradas</p>
            )}
          </Section>

          {/* Propietarios */}
          <Section icon={Users} title="Historial de Propietarios">
            <p className="text-sm text-muted-foreground">
              {resultado?.propietarios || "Sin información disponible"}
            </p>
          </Section>

          {/* Valor DGII */}
          <Section icon={DollarSign} title="Valor DGII">
            <p className="text-lg font-bold">
              {resultado?.valor_dgii ? `RD$ ${resultado.valor_dgii.toLocaleString()}` : "N/A"}
            </p>
          </Section>

          {/* Marbete */}
          <Section icon={FileText} title="Estado del Marbete">
            <p className="text-sm">{resultado?.marbete || "N/A"}</p>
          </Section>

          {/* Multas */}
          <Section icon={AlertTriangle} title="Multas Pendientes">
            <p className="text-sm">{resultado?.multas || "Sin multas pendientes"}</p>
          </Section>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button variant="cta" className="flex-1 font-bold" size="lg" onClick={() => navigate("/app/nuevo")}>
              ¿Todo bien? Inicia el traspaso →
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
