import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Scale, FileText, PenTool, CheckCircle, ShieldCheck, User, Eye } from "lucide-react";
import SignaturePad from "@/components/gestor/SignaturePad";
import { motion } from "framer-motion";

const STEPS = [
  { key: "identity", label: "Identidad Verificada", icon: ShieldCheck },
  { key: "review", label: "Revisión del Documento", icon: Eye },
  { key: "sign", label: "Finalizar Firma", icon: PenTool },
];

export default function NotarioTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [traspaso, setTraspaso] = useState<any>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [firmas, setFirmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showSignature, setShowSignature] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, cRes, fRes] = await Promise.all([
      supabase.from("traspasos").select("*").eq("id", id!).single(),
      supabase.from("traspaso_contratos").select("*").eq("traspaso_id", id!).order("created_at", { ascending: false }),
      supabase.from("traspaso_firmas").select("*").eq("traspaso_id", id!).order("created_at", { ascending: false }),
    ]);
    setTraspaso(tRes.data);
    setContratos(cRes.data || []);
    setFirmas(fRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleSign = async (signatureData: { imageDataUrl: string; userAgent: string; geolocation: string | null }) => {
    if (!traspaso || !user) return;
    setSigning(true);
    try {
      const blob = await (await fetch(signatureData.imageDataUrl)).blob();
      const fileName = `firmas/${traspaso.id}/notario_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, blob, { contentType: "image/png" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(fileName);

      const { error } = await supabase.from("traspaso_firmas").insert({
        traspaso_id: traspaso.id,
        contrato_id: contratos[0]?.id || null,
        tipo_firmante: "notario",
        nombre_firmante: "Notario Certificador",
        firma_hash: btoa(signatureData.imageDataUrl.slice(0, 100)),
        firma_imagen_url: urlData.publicUrl,
        user_agent: signatureData.userAgent,
        geolocation: signatureData.geolocation,
      });
      if (error) throw error;

      toast.success("Firma del notario registrada");
      setShowSignature(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error al firmar");
    } finally {
      setSigning(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!traspaso) return;
    setAdvancing(true);
    try {
      const nextStatus = "verificacion_antifraude";
      const { error } = await supabase
        .from("traspasos")
        .update({ status: nextStatus })
        .eq("id", traspaso.id);
      if (error) throw error;

      await supabase.from("traspaso_timeline").insert({
        traspaso_id: traspaso.id,
        status: nextStatus,
        nota: "Contrato certificado por notario — pasa a verificación antifraude",
        created_by: user?.id,
      });

      toast.success("Traspaso avanzado a verificación antifraude");
      navigate("/notario");
    } catch (err: any) {
      toast.error(err.message || "Error al avanzar");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!traspaso) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center text-muted-foreground">
        Traspaso no encontrado
      </div>
    );
  }

  const notarioFirma = firmas.find((f) => f.tipo_firmante === "notario");

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
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
          {traspaso.status.replace(/_/g, " ")}
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
                    ? "bg-green-100 text-green-700"
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

      {/* Step 0: Identity */}
      {activeStep === 0 && !notarioFirma && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Identidad Verificada</p>
                  <p className="text-xs text-muted-foreground">Biometría facial confirmada</p>
                </div>
                <Badge className="ml-auto bg-green-50 text-green-700 border-green-200 text-[10px]">✓ OK</Badge>
              </div>

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedor</span>
                  <span className="font-medium">{traspaso.vendedor_nombre || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cédula</span>
                  <span className="font-medium">{traspaso.vendedor_cedula || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comprador</span>
                  <span className="font-medium">{traspaso.comprador_nombre || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cédula</span>
                  <span className="font-medium">{traspaso.comprador_cedula || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5 text-sm space-y-2">
              <p className="font-bold">Vehículo</p>
              <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculo_marca} {traspaso.vehiculo_modelo}</p>
              <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculo_placa || "—"}</p>
              <p><span className="text-muted-foreground">Chasis:</span> {traspaso.vehiculo_chasis || "—"}</p>
              <p><span className="text-muted-foreground">Año:</span> {traspaso.vehiculo_ano || "—"}</p>
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
                  {contratos.map((c) => (
                    <div key={c.id} className="border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm capitalize">{c.tipo.replace(/_/g, " ")}</span>
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

          {/* Existing signatures */}
          {firmas.length > 0 && (
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <PenTool className="h-4 w-4" /> Firmas Existentes ({firmas.length})
                </h2>
                <div className="space-y-2">
                  {firmas.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 border border-border rounded-xl p-2">
                      <img src={f.firma_imagen_url} alt="Firma" className="h-10 w-20 object-contain border rounded" />
                      <div>
                        <p className="font-medium text-sm capitalize">{f.tipo_firmante}</p>
                        <p className="text-xs text-muted-foreground">{f.nombre_firmante}</p>
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
                  <Button
                    variant="cta"
                    className="w-full font-bold h-14 text-base"
                    size="lg"
                    onClick={() => setShowSignature(true)}
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
          <Card className="rounded-xl bg-green-50 border-green-200">
            <CardContent className="p-5 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h2 className="font-extrabold text-lg text-green-800 mb-1">Contrato Certificado</h2>
              <p className="text-sm text-green-700">
                La firma del notario ha sido registrada exitosamente.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-1.5">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">VERIFICADO POR TRASPASA.DO</span>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="teal"
            className="w-full font-bold"
            size="lg"
            onClick={handleAdvanceStatus}
            disabled={advancing}
          >
            {advancing ? "Avanzando..." : "Avanzar a Verificación Antifraude →"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
