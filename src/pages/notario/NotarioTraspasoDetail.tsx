import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Scale, FileText, PenTool, CheckCircle } from "lucide-react";
import SignaturePad from "@/components/gestor/SignaturePad";

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
      const nextStatus = "matricula_recogida";
      const { error } = await supabase
        .from("traspasos")
        .update({ status: nextStatus })
        .eq("id", traspaso.id);
      if (error) throw error;

      await supabase.from("traspaso_timeline").insert({
        traspaso_id: traspaso.id,
        status: nextStatus,
        nota: "Contrato certificado por notario",
        created_by: user?.id,
      });

      toast.success("Traspaso avanzado a recogida de matrícula");
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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate("/notario")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          Certificar Traspaso
        </h1>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          {traspaso.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Vehicle info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculo_marca} {traspaso.vehiculo_modelo}</p>
          <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculo_placa || "—"}</p>
          <p><span className="text-muted-foreground">Chasis:</span> {traspaso.vehiculo_chasis || "—"}</p>
          <p><span className="text-muted-foreground">Año:</span> {traspaso.vehiculo_ano || "—"}</p>
        </CardContent>
      </Card>

      {/* Parties */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Partes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <p className="font-medium">Vendedor</p>
            <p>{traspaso.vendedor_nombre || "—"} · {traspaso.vendedor_cedula || "—"}</p>
          </div>
          <div>
            <p className="font-medium">Comprador</p>
            <p>{traspaso.comprador_nombre || "—"} · {traspaso.comprador_cedula || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Contratos ({contratos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {contratos.length === 0 ? (
            <p className="text-muted-foreground">No hay contratos generados</p>
          ) : (
            <div className="space-y-2">
              {contratos.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{c.tipo.replace(/_/g, " ")}</span>
                    <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                  </div>
                  <div
                    className="text-xs bg-muted p-2 rounded max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: c.contenido_html }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing signatures */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenTool className="h-4 w-4" /> Firmas ({firmas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {firmas.length === 0 ? (
            <p className="text-muted-foreground">No hay firmas registradas</p>
          ) : (
            <div className="space-y-2">
              {firmas.map((f) => (
                <div key={f.id} className="flex items-center gap-3 border border-border rounded-lg p-2">
                  <img src={f.firma_imagen_url} alt="Firma" className="h-10 w-20 object-contain border rounded" />
                  <div>
                    <p className="font-medium capitalize">{f.tipo_firmante}</p>
                    <p className="text-xs text-muted-foreground">{f.nombre_firmante}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notary signature */}
      {!notarioFirma ? (
        <div className="space-y-3">
          {showSignature ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Firma del Notario</CardTitle>
              </CardHeader>
              <CardContent>
                <SignaturePad
                  onSign={handleSign}
                  title="Firma del Notario"
                />
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="cta"
              className="w-full"
              size="lg"
              onClick={() => setShowSignature(true)}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Certificar y Firmar
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Contrato certificado por notario</span>
          </div>
          <Button
            variant="teal"
            className="w-full"
            size="lg"
            onClick={handleAdvanceStatus}
            disabled={advancing}
          >
            {advancing ? "Avanzando..." : "Avanzar a Recogida de Matrícula"}
          </Button>
        </div>
      )}
    </div>
  );
}
