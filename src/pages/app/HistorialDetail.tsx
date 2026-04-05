import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle, AlertTriangle, Share2, Car } from "lucide-react";

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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Car className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Placa: {consulta.placa}</h1>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {consulta.status === "pendiente" ? "⏳ Procesando..." : consulta.status === "completado" ? "✅ Completado" : consulta.status}
              </Badge>
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-800">
              <CheckCircle className="h-4 w-4" />
              Verificado por TRASPASA.DO ✅
            </div>
          )}
        </CardContent>
      </Card>

      {!isCompleted ? (
        <Card>
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
        <>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="datos" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Datos del Vehículo</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Marca:</span> {resultado?.marca || "N/A"}</div>
                  <div><span className="text-muted-foreground">Modelo:</span> {resultado?.modelo || "N/A"}</div>
                  <div><span className="text-muted-foreground">Año:</span> {resultado?.ano || "N/A"}</div>
                  <div><span className="text-muted-foreground">Color:</span> {resultado?.color || "N/A"}</div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="propietarios" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Historial de Propietarios</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{resultado?.propietarios || "Sin información disponible"}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="oposiciones" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Oposiciones y Alertas
                {resultado?.oposiciones && (
                  <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                )}
              </AccordionTrigger>
              <AccordionContent>
                {resultado?.oposiciones ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    {resultado.oposiciones}
                  </div>
                ) : (
                  <p className="text-sm text-green-700">✅ Sin oposiciones registradas</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="valor" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Valor DGII</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">{resultado?.valor_dgii ? `RD$ ${resultado.valor_dgii.toLocaleString()}` : "N/A"}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="marbete" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Estado del Marbete</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">{resultado?.marbete || "N/A"}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="traspasos" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Traspasos Anteriores</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{resultado?.traspasos_anteriores || "Sin traspasos registrados"}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="multas" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">Multas Pendientes</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">{resultado?.multas || "Sin multas pendientes"}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 mt-6">
            <Button variant="cta" className="flex-1" onClick={() => navigate("/app/nuevo")}>
              ¿Todo bien? Inicia el traspaso →
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
