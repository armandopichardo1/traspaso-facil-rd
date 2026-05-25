import { useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Truck, MapPin, Phone, Camera, CheckCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { STATUS_LABELS } from "@/lib/traspaso-status";
import {
  useTraspaso,
  useDocumentos,
  useUploadDocumento,
  useAdvanceStatus,
  useDocumentoSignedUrl,
} from "@/hooks/useTraspasoServices";
import { ErrorState, LoadingSkeleton, NotFoundView } from "@/components/shared/StateView";

export default function MensajeroTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: traspaso, isLoading, isError, error, refetch } = useTraspaso(id);
  const { data: documentos = [] } = useDocumentos(id);
  const uploadMutation = useUploadDocumento(id ?? "");
  const advanceMutation = useAdvanceStatus(id ?? "");

  const evidencia = useMemo(
    () => documentos.find((d) => d.tipo === "evidencia_recogida"),
    [documentos],
  );
  const { data: evidenciaUrl } = useDocumentoSignedUrl(evidencia?.id);

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !traspaso) return;
    try {
      await uploadMutation.mutateAsync({ tipo: "evidencia_recogida" as never, file });
      toast.success("Evidencia de recogida subida");
    } catch (err: any) {
      toast.error(err.message || "Error al subir evidencia");
    }
  };

  const handleAdvanceStatus = async () => {
    if (!traspaso || !user) return;
    try {
      await advanceMutation.mutateAsync({
        toStatus: "dgii_proceso",
        actor: { id: user.id, role: "mensajero" },
        nota: "Matrícula recogida y entregada por mensajero",
      });
      toast.success("Traspaso avanzado a DGII");
      navigate("/mensajero");
    } catch (err: any) {
      toast.error(err.message || "Error al avanzar");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={2} className="p-4 max-w-lg mx-auto space-y-4" rowClassName="h-40 w-full rounded-2xl" />;
  }

  if (isError) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <ErrorState
          message={(error as Error)?.message || "No se pudo cargar el traspaso."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!traspaso) {
    return (
      <NotFoundView
        title="Traspaso no encontrado"
        description="Este traspaso no existe o ya no está asignado a ti."
        onBack={() => navigate("/mensajero")}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <button onClick={() => navigate("/mensajero")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Truck className="h-5 w-5 text-accent" />
          Entrega
        </h1>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {STATUS_LABELS[traspaso.status] || traspaso.status}
        </Badge>
      </motion.div>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculoMarca} {traspaso.vehiculoModelo}</p>
          <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculoPlaca || "—"}</p>
          <p><span className="text-muted-foreground">Color:</span> {traspaso.vehiculoColor || "—"}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Contacto Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="text-muted-foreground">Nombre:</span> {traspaso.vendedorNombre || "—"}</p>
          {traspaso.vendedorTelefono && (
            <a
              href={`tel:${traspaso.vendedorTelefono}`}
              className="flex items-center gap-2 text-accent hover:underline font-medium"
            >
              <Phone className="h-4 w-4" />
              {traspaso.vendedorTelefono}
            </a>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" /> Evidencia de Recogida
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evidencia ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Evidencia subida</span>
              </div>
              {evidenciaUrl ? (
                <a href={evidenciaUrl} target="_blank" rel="noopener">
                  <img
                    src={evidenciaUrl}
                    alt="Evidencia de recogida"
                    className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted/30"
                  />
                </a>
              ) : (
                <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
              )}
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleUploadEvidence}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? "Subiendo..." : "Tomar Foto de Matrícula"}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                La foto se almacena de forma privada y solo es visible para el equipo TRASPASA.DO.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {evidencia && traspaso.status === "matricula_recogida" && (
        <Button
          variant="teal"
          className="w-full font-bold"
          size="lg"
          onClick={handleAdvanceStatus}
          disabled={advanceMutation.isPending}
        >
          <Package className="h-4 w-4 mr-2" />
          {advanceMutation.isPending ? "Avanzando..." : "Confirmar Entrega → DGII"}
        </Button>
      )}
    </div>
  );
}
