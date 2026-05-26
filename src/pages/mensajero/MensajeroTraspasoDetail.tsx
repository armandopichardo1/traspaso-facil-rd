import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Truck, MapPin, Phone, Camera, CheckCircle, Package, Navigation, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { STATUS_LABELS, getNextStatus } from "@/lib/traspaso-status";
import {
  useTraspaso,
  useDocumentos,
  useUploadDocumento,
  useAdvanceStatus,
  useDocumentoSignedUrl,
} from "@/hooks/useTraspasoServices";
import { ErrorState, LoadingSkeleton, NotFoundView } from "@/components/shared/StateView";

type GeoCoords = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export default function MensajeroTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: traspaso, isLoading, isError, error, refetch } = useTraspaso(id);
  const { data: documentos = [] } = useDocumentos(id);
  const uploadMutation = useUploadDocumento(id ?? "");
  const advanceMutation = useAdvanceStatus(id ?? "");

  const [geo, setGeo] = useState<GeoCoords | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [forceWithoutGeo, setForceWithoutGeo] = useState(false);

  const isRecogida = traspaso?.status === "matricula_recogida";
  const isEntrega = traspaso?.status === "matricula_entregada";

  const evidenciaTipo = isEntrega ? "evidencia_entrega" : "evidencia_recogida";
  const tituloPaso = isEntrega ? "Entrega de Matrícula Nueva" : "Recogida de Matrícula";
  const tituloEvidencia = isEntrega ? "Evidencia de Entrega" : "Evidencia de Recogida";
  const labelAccion = isEntrega ? "Confirmar Entrega →" : "Confirmar Recogida →";
  const labelFoto = isEntrega ? "Tomar Foto de Entrega" : "Tomar Foto de Matrícula";
  const contactoLabel = isEntrega ? "Contacto Comprador" : "Contacto Vendedor";
  const contactoNombre = isEntrega ? traspaso?.compradorNombre : traspaso?.vendedorNombre;
  const contactoTelefono = isEntrega ? traspaso?.compradorTelefono : traspaso?.vendedorTelefono;

  const evidencia = useMemo(
    () => documentos.find((d) => d.tipo === evidenciaTipo),
    [documentos, evidenciaTipo],
  );
  const { data: evidenciaUrl } = useDocumentoSignedUrl(evidencia?.id);

  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      toast.error("Tu dispositivo no soporta geolocalización");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setGeoDenied(false);
        setGeoLoading(false);
        toast.success("Ubicación capturada");
      },
      (err) => {
        setGeoLoading(false);
        setGeoDenied(true);
        toast.error(err.code === 1 ? "Permiso de ubicación denegado" : "No se pudo capturar la ubicación");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !traspaso) return;
    try {
      await uploadMutation.mutateAsync({ tipo: evidenciaTipo as never, file });
      toast.success("Evidencia subida");
      // Intentar capturar geolocalización inmediatamente después de la foto
      if (!geo) captureGeolocation();
    } catch (err: any) {
      toast.error(err.message || "Error al subir evidencia");
    }
  };

  const handleAdvanceStatus = async () => {
    if (!traspaso || !user) return;
    const next = getNextStatus(traspaso.status, "mensajero");
    if (!next) {
      toast.error("No se puede avanzar desde el estado actual");
      return;
    }
    const geoNota = geo
      ? `GPS: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)} (±${Math.round(geo.accuracy)}m) @ ${new Date(geo.timestamp).toISOString()}`
      : "GPS: no disponible (confirmado manualmente por el mensajero)";
    try {
      await advanceMutation.mutateAsync({
        toStatus: next,
        actor: { id: user.id, role: "mensajero" },
        nota: `${isEntrega ? "Matrícula entregada al comprador" : "Matrícula recogida del vendedor"} — ${geoNota}`,
      });
      toast.success(`Traspaso avanzado a ${STATUS_LABELS[next]}`);
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

  const nextStatus = getNextStatus(traspaso.status, "mensajero");
  const canAdvance = !!evidencia && (geo !== null || (geoDenied && forceWithoutGeo)) && !!nextStatus;

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
          <Truck className="h-5 w-5 text-teal" />
          {tituloPaso}
        </h1>
        <Badge variant="secondary" className="bg-teal/10 text-teal">
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
            <MapPin className="h-4 w-4" /> {contactoLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="text-muted-foreground">Nombre:</span> {contactoNombre || "—"}</p>
          {contactoTelefono && (
            <a
              href={`tel:${contactoTelefono}`}
              className="flex items-center gap-2 text-teal hover:underline font-medium"
            >
              <Phone className="h-4 w-4" />
              {contactoTelefono}
            </a>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" /> {tituloEvidencia}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evidencia ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Evidencia subida</span>
              </div>
              {evidenciaUrl ? (
                <a href={evidenciaUrl} target="_blank" rel="noopener">
                  <img
                    src={evidenciaUrl}
                    alt={tituloEvidencia}
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
                {uploadMutation.isPending ? "Subiendo..." : labelFoto}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                La foto se almacena de forma privada y solo es visible para el equipo TRASPASA.DO.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geolocalización */}
      {evidencia && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="h-4 w-4" /> Ubicación GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {geo ? (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Ubicación capturada</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Lat: <span className="font-mono text-foreground">{geo.lat.toFixed(6)}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  Lng: <span className="font-mono text-foreground">{geo.lng.toFixed(6)}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  Precisión: ±{Math.round(geo.accuracy)} m · {new Date(geo.timestamp).toLocaleString("es-DO")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={captureGeolocation}
                  disabled={geoLoading}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Volver a capturar
                </Button>
              </div>
            ) : geoDenied ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-warning/10 text-warning text-xs p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    No pudimos capturar tu ubicación. Activa los permisos de GPS o confirma manualmente que estás en el punto correcto antes de continuar.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={captureGeolocation}
                    disabled={geoLoading}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Reintentar GPS
                  </Button>
                  <Button
                    variant={forceWithoutGeo ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setForceWithoutGeo((v) => !v)}
                  >
                    {forceWithoutGeo ? "✓ Confirmado sin GPS" : "Confirmar sin GPS"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={captureGeolocation}
                disabled={geoLoading}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {geoLoading ? "Capturando ubicación..." : "Capturar mi ubicación"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {(isRecogida || isEntrega) && nextStatus && (
        <>
          <Button
            variant="default"
            className="w-full font-bold bg-emerald hover:bg-emerald-light text-white"
            size="lg"
            onClick={handleAdvanceStatus}
            disabled={advanceMutation.isPending || !canAdvance}
          >
            <Package className="h-4 w-4 mr-2" />
            {advanceMutation.isPending ? "Avanzando..." : labelAccion}
          </Button>
          {!canAdvance && (
            <p className="text-xs text-muted-foreground text-center">
              {!evidencia
                ? "Debes subir la foto de evidencia antes de continuar."
                : "Captura tu ubicación GPS o confirma manualmente para continuar."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
