import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Scale, FileText, PenTool, CheckCircle, ShieldCheck, Eye } from "lucide-react";
import SignaturePad from "@/components/gestor/SignaturePad";
import IdentityVerificationPanel from "@/components/notario/IdentityVerificationPanel";
import { motion } from "framer-motion";
import { STATUS_LABELS, getNextStatus } from "@/lib/traspaso-status";
import { AlertTriangle } from "lucide-react";
import {
  useTraspaso,
  useContratos,
  useFirmas,
  useSaveFirma,
  useAdvanceStatus,
} from "@/hooks/useTraspasoServices";
import { ErrorState, LoadingSkeleton, NotFoundView } from "@/components/shared/StateView";

const STEPS = [
  { key: "identity", label: "Identidad Verificada", icon: ShieldCheck },
  { key: "review", label: "Revisión del Documento", icon: Eye },
  { key: "sign", label: "Finalizar Firma", icon: PenTool },
];

export default function NotarioTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: traspaso, isLoading, isError, error, refetch } = useTraspaso(id);
  const { data: contratos = [] } = useContratos(id);
  const { data: firmas = [] } = useFirmas(id);
  const saveFirmaMutation = useSaveFirma(id ?? "");
  const advanceMutation = useAdvanceStatus(id ?? "");

  const [activeStep, setActiveStep] = useState(0);
  const [showSignature, setShowSignature] = useState(false);

  const handleSign = async (signatureData: { imageDataUrl: string; userAgent: string; geolocation: string | null }) => {
    if (!traspaso || !user) return;
    try {
      const blob = await (await fetch(signatureData.imageDataUrl)).blob();
      await saveFirmaMutation.mutateAsync({
        contratoId: contratos[0]?.id ?? null,
        tipoFirmante: "notario",
        firmaImagenBlob: blob,
        nombre: profile?.nombre || "Notario Certificador",
      });
      toast.success("Firma del notario registrada");
      setShowSignature(false);
    } catch (err: any) {
      toast.error(err.message || "Error al firmar");
    }
  };

  const handleAdvanceStatus = async () => {
    if (!traspaso || !user) return;
    const next = getNextStatus(traspaso.status, "notario");
    if (!next) {
      toast.error("No se puede avanzar desde el estado actual");
      return;
    }
    try {
      await advanceMutation.mutateAsync({
        toStatus: next,
        actor: { id: user.id, role: "notario" },
        nota: `Contrato certificado por notario — pasa a ${STATUS_LABELS[next]}`,
      });
      toast.success(`Traspaso avanzado a ${STATUS_LABELS[next]}`);
      navigate("/notario");
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
        onBack={() => navigate("/notario")}
      />
    );
  }

  const notarioFirma = firmas.find((f) => f.tipoFirmante === "notario");
  const antifraudeAprobado = traspaso.antifraudeStatus === "aprobado";
  const antifraudeRechazado = traspaso.antifraudeStatus === "rechazado";
  const nextStatus = getNextStatus(traspaso.status, "notario");

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <button onClick={() => navigate("/notario")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          Certificar Traspaso
        </h1>
        <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/30">
          {STATUS_LABELS[traspaso.status] || traspaso.status}
        </Badge>
      </motion.div>

      {/* Step indicator */}
      {!notarioFirma && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2">
            {STEPS.map((step, i) => (
              <button
                key={step.key}
                className={`flex-1 p-3 rounded-xl text-center transition-all ${
                  i === activeStep
                    ? "bg-accent text-white shadow-md"
                    : i < activeStep
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setActiveStep(i)}
              >
                <step.icon className="h-5 w-5 mx-auto mb-1" />
                <p className="text-[10px] font-bold">{step.label}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 0: Identity verification */}
      {activeStep === 0 && !notarioFirma && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <IdentityVerificationPanel
            traspasoId={traspaso.id}
            vendedorNombre={traspaso.vendedorNombre || ""}
            compradorNombre={traspaso.compradorNombre || ""}
            antifraudeStatus={traspaso.antifraudeStatus}
            antifraudeNotas={traspaso.antifraudeNotas}
          />

          <Card className="rounded-xl">
            <CardContent className="p-5 text-sm space-y-2">
              <p className="font-bold">Vehículo</p>
              <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculoMarca} {traspaso.vehiculoModelo}</p>
              <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculoPlaca || "—"}</p>
              <p><span className="text-muted-foreground">Chasis:</span> {traspaso.vehiculoChasis || "—"}</p>
              <p><span className="text-muted-foreground">Año:</span> {traspaso.vehiculoAno || "—"}</p>
            </CardContent>
          </Card>

          <Button variant="teal" className="w-full font-bold" size="lg" onClick={() => setActiveStep(1)}>
            Continuar a Revisión →
          </Button>
        </motion.div>
      )}


      {/* Step 1: Review */}
      {activeStep === 1 && !notarioFirma && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" /> Contratos ({contratos.length})
              </h2>
              {contratos.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay contratos generados</p>
              ) : (
                <div className="space-y-3">
                  {contratos.map((c: any) => (
                    <div key={c.id} className="border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm capitalize">{String(c.tipo).replace(/_/g, " ")}</span>
                        <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                      </div>
                      <div
                        className="text-xs bg-muted/50 p-3 rounded-lg max-h-60 overflow-y-auto leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: c.contenido_html }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {firmas.length > 0 && (
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <PenTool className="h-4 w-4" /> Firmas Existentes ({firmas.length})
                </h2>
                <div className="space-y-2">
                  {firmas.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 border border-border rounded-xl p-2">
                      <img src={f.firmaImagenUrl} alt="Firma" className="h-10 w-20 object-contain border rounded" />
                      <div>
                        <p className="font-medium text-sm capitalize">{f.tipoFirmante}</p>
                        <p className="text-xs text-muted-foreground">{f.nombreFirmante}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setActiveStep(0)}>
              ← Atrás
            </Button>
            <Button variant="teal" className="flex-1 font-bold" onClick={() => setActiveStep(2)}>
              Continuar a Firma →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Sign */}
      {activeStep === 2 && !notarioFirma && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {showSignature ? (
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <h2 className="font-bold text-sm mb-3">Firma del Notario</h2>
                <SignaturePad onSign={handleSign} title="Firma del Notario" />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="rounded-xl bg-accent/5 border-accent/20">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <PenTool className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="font-extrabold text-lg mb-1">Listo para certificar</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Al firmar, certificas la validez legal de este traspaso vehicular.
                  </p>
                  {!antifraudeAprobado && (
                    <div className="mb-3 rounded-xl bg-warning/10 text-warning text-xs p-3 flex items-start gap-2 text-left">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        No puedes firmar hasta que la verificación antifraude esté aprobada por el equipo.
                      </span>
                    </div>
                  )}
                  <Button
                    variant="cta"
                    className="w-full font-bold h-14 text-base"
                    size="lg"
                    onClick={() => setShowSignature(true)}
                    disabled={!antifraudeAprobado}
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    Firmar con un toque
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Firma digital legal bajo Ley 126-02 sobre Comercio Electrónico y Firmas Digitales
                  </p>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={() => setActiveStep(1)}>
                ← Volver a Revisión
              </Button>
            </>
          )}
        </motion.div>
      )}

      {/* Already signed */}
      {notarioFirma && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="rounded-xl bg-success/10 border-success/30">
            <CardContent className="p-5 text-center">
              <CheckCircle className="h-12 w-12 text-success/100 mx-auto mb-3" />
              <h2 className="font-extrabold text-lg text-success mb-1">Contrato Certificado</h2>
              <p className="text-sm text-success">
                La firma del notario ha sido registrada exitosamente.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-success/15 rounded-full px-4 py-1.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-xs font-bold text-success">VERIFICADO POR TRASPASA.DO</span>
              </div>
            </CardContent>
          </Card>

          {nextStatus && (
            <Button
              variant="teal"
              className="w-full font-bold"
              size="lg"
              onClick={handleAdvanceStatus}
              disabled={advanceMutation.isPending || !antifraudeAprobado}
            >
              {advanceMutation.isPending
                ? "Avanzando..."
                : `Avanzar a ${STATUS_LABELS[nextStatus]} →`}
            </Button>
          )}
          {!antifraudeAprobado && (
            <p className="text-xs text-warning text-center">
              No puedes avanzar el traspaso hasta que la verificación antifraude esté aprobada.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
