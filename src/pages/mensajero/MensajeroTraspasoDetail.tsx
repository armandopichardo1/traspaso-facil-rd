import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Truck, MapPin, Phone, Camera, CheckCircle, Package } from "lucide-react";

export default function MensajeroTraspasoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [traspaso, setTraspaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("traspasos").select("*").eq("id", id!).single();
    setTraspaso(data);

    // Check if evidence was already uploaded
    if (data) {
      const { data: docs } = await supabase
        .from("traspaso_documentos")
        .select("*")
        .eq("traspaso_id", data.id)
        .eq("tipo", "evidencia_recogida")
        .limit(1);
      if (docs && docs.length > 0) {
        setEvidenceUrl(docs[0].file_url);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !traspaso) return;
    setUploading(true);
    try {
      const fileName = `evidencias/${traspaso.id}/recogida_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(fileName);

      const { error } = await supabase.from("traspaso_documentos").insert({
        traspaso_id: traspaso.id,
        tipo: "evidencia_recogida",
        file_url: urlData.publicUrl,
      });
      if (error) throw error;

      setEvidenceUrl(urlData.publicUrl);
      toast.success("Evidencia de recogida subida");
    } catch (err: any) {
      toast.error(err.message || "Error al subir evidencia");
    } finally {
      setUploading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!traspaso) return;
    setAdvancing(true);
    try {
      const nextStatus = "dgii_proceso";
      const { error } = await supabase
        .from("traspasos")
        .update({ status: nextStatus })
        .eq("id", traspaso.id);
      if (error) throw error;

      await supabase.from("traspaso_timeline").insert({
        traspaso_id: traspaso.id,
        status: nextStatus,
        nota: "Matrícula recogida y entregada por mensajero",
        created_by: user?.id,
      });

      toast.success("Traspaso avanzado a DGII");
      navigate("/mensajero");
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

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate("/mensajero")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Truck className="h-5 w-5 text-accent" />
          Entrega
        </h1>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {traspaso.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Vehicle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Marca/Modelo:</span> {traspaso.vehiculo_marca} {traspaso.vehiculo_modelo}</p>
          <p><span className="text-muted-foreground">Placa:</span> {traspaso.vehiculo_placa || "—"}</p>
          <p><span className="text-muted-foreground">Color:</span> {traspaso.vehiculo_color || "—"}</p>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Contacto Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="text-muted-foreground">Nombre:</span> {traspaso.vendedor_nombre || "—"}</p>
          {traspaso.vendedor_telefono && (
            <a
              href={`tel:${traspaso.vendedor_telefono}`}
              className="flex items-center gap-2 text-accent hover:underline"
            >
              <Phone className="h-4 w-4" />
              {traspaso.vendedor_telefono}
            </a>
          )}
        </CardContent>
      </Card>

      {/* Evidence upload */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" /> Evidencia de Recogida
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evidenceUrl ? (
            <div className="space-y-2">
              <img src={evidenceUrl} alt="Evidencia" className="w-full rounded-lg border" />
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Evidencia subida
              </div>
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
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? "Subiendo..." : "Tomar Foto de Matrícula"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance */}
      {evidenceUrl && traspaso.status === "matricula_recogida" && (
        <Button
          variant="teal"
          className="w-full"
          size="lg"
          onClick={handleAdvanceStatus}
          disabled={advancing}
        >
          <Package className="h-4 w-4 mr-2" />
          {advancing ? "Avanzando..." : "Confirmar Entrega → DGII"}
        </Button>
      )}
    </div>
  );
}
