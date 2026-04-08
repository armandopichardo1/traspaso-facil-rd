import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ShieldCheck, FileText, Car } from "lucide-react";
import { motion } from "framer-motion";

export default function TraspasoFirmado() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: traspaso, isLoading } = useQuery({
    queryKey: ["traspaso-firmado", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("traspasos").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 space-y-4">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!traspaso) return null;

  const t = traspaso as any;

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24 text-center">
      {/* Success icon */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <CheckCircle className="h-14 w-14 text-green-500" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-2">
          ¡Contrato Firmado Exitosamente!
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tu firma digital ha sido registrada de forma segura bajo la Ley 126-02
          sobre comercio electrónico y firmas digitales.
        </p>
      </motion.div>

      {/* Document details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="rounded-2xl mb-6 text-left">
          <CardContent className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Detalles del Documento
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Documento</span>
                </div>
                <span className="text-sm font-bold">Acto de Venta Vehicular</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Vehículo</span>
                </div>
                <span className="text-sm font-bold">
                  {t.vehiculo_marca} {t.vehiculo_modelo}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground pl-6">Placa</span>
                <span className="text-sm font-bold font-mono">{t.vehiculo_placa || "—"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground pl-6">Fecha</span>
                <span className="text-sm font-bold">
                  {new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground pl-6">ID de Firma</span>
                <span className="text-xs font-mono text-accent">{t.id.slice(0, 20)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Verified badge */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span className="text-xs font-bold text-green-700">VERIFICADO POR TRASPASA.DO</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="cta"
          className="w-full font-bold h-12"
          size="lg"
          onClick={() => navigate(`/app/traspaso/${id}`)}
        >
          Ver Progreso del Traspaso
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => navigate("/app")}
        >
          Ir al Inicio
        </Button>
      </motion.div>
    </div>
  );
}
