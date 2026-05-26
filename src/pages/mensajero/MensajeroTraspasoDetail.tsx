import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  Camera,
  CheckCircle,
  Package,
  Navigation,
  AlertTriangle,
  ScanLine,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

type GeoCoords = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

type OcrResult = {
  placaExtraida: string;
  marca?: string;
  modelo?: string;
  match: boolean;
};

// Coordenadas por defecto: Santo Domingo
const DEFAULT_CENTER = { lat: 18.4861, lng: -69.9312 };

function normalizePlaca(p: string | null | undefined) {
  return (p ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip data:*;base64, prefix
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function StaticMapThumb({
  lat,
  lng,
  label,
  approximate,
}: {
  lat: number;
  lng: number;
  label: string;
  approximate?: boolean;
}) {
  const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=600x260&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
  const openUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <div className="space-y-2">
      <a
        href={openUrl}
        target="_blank"
        rel="noopener"
        className="block rounded-lg overflow-hidden border border-border bg-muted/30 relative"
      >
        <img
          src={src}
          alt={`Mapa de ${label}`}
          className="w-full h-40 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute bottom-2 right-2 bg-background/90 text-foreground text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow">
          <ExternalLink className="h-3 w-3" /> Abrir en Maps
        </div>
      </a>
      {approximate && (
        <p className="text-[10px] text-muted-foreground">
          Ubicación referencial. Coordina el punto exacto por teléfono o WhatsApp.
        </p>
      )}
    </div>
  );
}

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

  // OCR de placa
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [overridePlaca, setOverridePlaca] = useState(false);
  const ocrRanFor = useRef<string | null>(null);

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
  const mapaTitulo = isEntrega ? "Punto de Entrega (Comprador)" : "Punto de Recogida (Vendedor)";

  const evidencia = useMemo(
    () => documentos.find((d) => d.tipo === evidenciaTipo),
    [documentos, evidenciaTipo],
  );
  const { data: evidenciaUrl } = useDocumentoSignedUrl(evidencia?.id);

  const placaEsperada = normalizePlaca(traspaso?.vehiculoPlaca);

  const runOcr = async () => {
    if (!evidenciaUrl) {
      toast.error("Aún no hay foto disponible para escanear.");
      return;
    }
    if (!placaEsperada) {
      setOcrError("Este traspaso no tiene placa registrada para verificar.");
      return;
    }
    setOcrLoading(true);
    setOcrError(null);
    try {
      const base64 = await urlToBase64(evidenciaUrl);
      const { data, error } = await supabase.functions.invoke("ocr-matricula", {
        body: { image_base64: base64 },
      });
      if (error) throw new Error(error.message ?? "Error al invocar OCR");
      if (!data?.success || !data?.data) {
        throw new Error(data?.error ?? "No se pudo extraer información de la matrícula.");
      }
      const extracted = data.data as { placa?: string; marca?: string; modelo?: string };
      const placaExtraida = normalizePlaca(extracted.placa);
      const match = !!placaExtraida && placaExtraida === placaEsperada;
      setOcrResult({
        placaExtraida: extracted.placa ?? "",
        marca: extracted.marca,
        modelo: extracted.modelo,
        match,
      });
      if (match) {
        toast.success("Placa verificada: coincide con el traspaso.");
      } else {
        toast.warning("La placa de la foto NO coincide con la registrada.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido al escanear la placa.";
      setOcrError(msg);
      toast.error(msg);
    } finally {
      setOcrLoading(false);
    }
  };

  // Ejecutar OCR automáticamente al subir evidencia (solo en recogida)
  useEffect(() => {
    if (!isRecogida) return;
    if (!evidencia?.id || !evidenciaUrl) return;
    if (ocrRanFor.current === evidencia.id) return;
    ocrRanFor.current = evidencia.id;
    runOcr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecogida, evidencia?.id, evidenciaUrl]);

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
      // reset estado de OCR para que se re-ejecute con la nueva imagen
      setOcrResult(null);
      setOcrError(null);
      setOverridePlaca(false);
      ocrRanFor.current = null;

      await uploadMutation.mutateAsync({ tipo: evidenciaTipo as never, file });
      toast.success("Evidencia subida");
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
    const ocrNota = isRecogida
      ? ocrResult
        ? ocrResult.match
          ? `Placa verificada por OCR: ${ocrResult.placaExtraida}`
          : `⚠ Placa NO coincide (foto: ${ocrResult.placaExtraida || "ilegible"} · esperada: ${placaEsperada}) — avance forzado por mensajero`
        : "OCR de placa: no ejecutado"
      : "";
    const notaBase = isEntrega
      ? "Matrícula entregada al comprador"
      : "Matrícula recogida del vendedor";
    try {
      await advanceMutation.mutateAsync({
        toStatus: next,
        actor: { id: user.id, role: "mensajero" },
        nota: [notaBase, geoNota, ocrNota].filter(Boolean).join(" — "),
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
  // En recogida exigimos verificación de placa (OCR coincide o override explícito).
  const placaOk = !isRecogida || (ocrResult?.match ?? false) || overridePlaca;
  const canAdvance =
    !!evidencia &&
    (geo !== null || (geoDenied && forceWithoutGeo)) &&
    !!nextStatus &&
    placaOk;

  const mapCoords = geo ?? DEFAULT_CENTER;
  const mapApproximate = !geo;

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
          <p>
            <span className="text-muted-foreground">Placa esperada:</span>{" "}
            <span className="font-mono font-bold text-teal">{traspaso.vehiculoPlaca || "—"}</span>
          </p>
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

      {/* Mapa estático del punto de recogida/entrega */}
      <Card className="rounded-xl border-teal/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-teal">
            <MapPin className="h-4 w-4" /> {mapaTitulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StaticMapThumb
            lat={mapCoords.lat}
            lng={mapCoords.lng}
            label={mapaTitulo}
            approximate={mapApproximate}
          />
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
              <div className="flex items-center gap-2 text-emerald text-sm">
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

      {/* Verificación OCR de placa (solo en recogida) */}
      {isRecogida && evidencia && (
        <Card
          className={`rounded-xl border ${
            ocrResult?.match
              ? "border-emerald/40 bg-emerald/5"
              : ocrResult && !ocrResult.match
                ? "border-destructive/40 bg-destructive/5"
                : "border-teal/20"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-teal" />
              Verificación de Placa (IA)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ocrLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Escaneando placa de la matrícula...
              </div>
            )}

            {!ocrLoading && ocrError && (
              <div className="rounded-md bg-warning/10 text-warning text-xs p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{ocrError}</span>
              </div>
            )}

            {!ocrLoading && ocrResult && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-muted-foreground">Esperada</div>
                    <div className="font-mono font-bold text-foreground">
                      {placaEsperada || "—"}
                    </div>
                  </div>
                  <div
                    className={`rounded-md p-2 ${
                      ocrResult.match ? "bg-emerald/10" : "bg-destructive/10"
                    }`}
                  >
                    <div className="text-muted-foreground">Detectada en foto</div>
                    <div
                      className={`font-mono font-bold ${
                        ocrResult.match ? "text-emerald" : "text-destructive"
                      }`}
                    >
                      {ocrResult.placaExtraida || "ilegible"}
                    </div>
                  </div>
                </div>

                {ocrResult.match ? (
                  <div className="flex items-center gap-2 text-emerald font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Placa coincide con el traspaso.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-destructive">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold">No coincide con la placa registrada</div>
                        <p className="text-xs text-destructive/80">
                          Verifica que estés fotografiando la matrícula correcta antes de avanzar.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={overridePlaca ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setOverridePlaca((v) => !v)}
                    >
                      {overridePlaca
                        ? "✓ Avance forzado (quedará registrado)"
                        : "Forzar avance pese a la discrepancia"}
                    </Button>
                  </div>
                )}

                {(ocrResult.marca || ocrResult.modelo) && (
                  <p className="text-[10px] text-muted-foreground">
                    Detectado: {ocrResult.marca} {ocrResult.modelo}
                  </p>
                )}
              </div>
            )}

            {!ocrLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={runOcr}
                disabled={!evidenciaUrl}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {ocrResult ? "Volver a verificar" : "Verificar placa con IA"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
                <div className="flex items-center gap-2 text-emerald">
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
                : isRecogida && !placaOk
                  ? "Verifica la placa con IA o marca el avance forzado para continuar."
                  : "Captura tu ubicación GPS o confirma manualmente para continuar."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
