import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Car, User, Shield, CreditCard, Clock, Phone } from "lucide-react";
import DocumentUpload from "@/components/gestor/DocumentUpload";

const STATUS_STEPS = [
  "solicitud_recibida", "documentos_pendientes", "verificacion_antifraude", "contrato_firmado",
  "matricula_recogida", "plan_piloto", "dgii_proceso", "completado"
];

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "Solicitud Recibida",
  documentos_pendientes: "Docs Pendientes",
  verificacion_antifraude: "Verificación Antifraude",
  contrato_firmado: "Contrato Firmado",
  matricula_recogida: "Matrícula Recogida",
  plan_piloto: "Plan Piloto",
  dgii_proceso: "DGII en Proceso",
  completado: "Completado",
  cancelado: "Cancelado",
};

const statusColor = (s: string) => {
  if (s === "completado") return "bg-green-100 text-green-800";
  if (s === "cancelado") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export default function GestorTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: traspaso, isLoading } = useQuery({
    queryKey: ["gestor-traspaso", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ["gestor-timeline", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_timeline")
        .select("*")
        .eq("traspaso_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!traspaso) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <p className="text-muted-foreground">Traspaso no encontrado</p>
      </div>
    );
  }

  const getProgress = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    if (idx === -1) return 0;
    return ((idx + 1) / STATUS_STEPS.length) * 100;
  };

  const whatsappLink = (phone: string | null) => {
    if (!phone) return "#";
    const clean = phone.replace(/\D/g, "");
    return `https://wa.me/1${clean}`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => navigate("/gestor")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{traspaso.vehiculo_marca} {traspaso.vehiculo_modelo}</h1>
          <p className="text-sm text-muted-foreground">Código: {traspaso.codigo}</p>
        </div>
        <Badge className={statusColor(traspaso.status)} variant="secondary">
          {STATUS_LABELS[traspaso.status] || traspaso.status}
        </Badge>
      </div>

      <Progress value={getProgress(traspaso.status)} className="h-2 mb-6" />

      {/* Vehicle */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" /> Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Marca/Modelo:</strong> {traspaso.vehiculo_marca} {traspaso.vehiculo_modelo} {traspaso.vehiculo_ano}</p>
          <p><strong>Placa:</strong> {traspaso.vehiculo_placa}</p>
          <p><strong>Color:</strong> {traspaso.vehiculo_color || "—"}</p>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>{traspaso.vendedor_nombre || "—"}</p>
            <p>{traspaso.vendedor_cedula || "—"}</p>
            {traspaso.vendedor_telefono && (
              <a href={whatsappLink(traspaso.vendedor_telefono)} target="_blank" className="flex items-center gap-1 text-accent hover:underline">
                <Phone className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>{traspaso.comprador_nombre || "—"}</p>
            <p>{traspaso.comprador_cedula || "—"}</p>
            {traspaso.comprador_telefono && (
              <a href={whatsappLink(traspaso.comprador_telefono)} target="_blank" className="flex items-center gap-1 text-accent hover:underline">
                <Phone className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <div className="mb-4">
        <DocumentUpload traspasoId={traspaso.id} />
      </div>

      {/* Status badges */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" /> Estado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Antifraude:</span>
            <Badge variant={traspaso.antifraude_status === "aprobado" ? "default" : "secondary"}>
              {traspaso.antifraude_status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Escrow:</span>
            <Badge variant="secondary">{traspaso.escrow_status}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Pago servicio:</span>
            <Badge variant="secondary">{traspaso.pago_servicio_status}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Plan:</span>
            <span className="font-medium">{traspaso.plan} · RD$ {Number(traspaso.precio_servicio).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                    {entry.nota && <p className="text-xs text-muted-foreground">{entry.nota}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("es-DO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
