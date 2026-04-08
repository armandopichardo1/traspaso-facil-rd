import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle, Edit2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import DocumentCameraGuide from "@/components/gestor/DocumentCameraGuide";

export interface CedulaOcrResult {
  nombre_completo: string;
  cedula: string;
  fecha_nacimiento?: string;
  nacionalidad?: string;
  sexo?: string;
  lado?: string;
}

interface CedulaCaptureProps {
  label: string;
  onResult: (result: CedulaOcrResult, imageBase64: string) => void;
}

export default function CedulaCapture({ label, onResult }: CedulaCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<CedulaOcrResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<CedulaOcrResult>({ nombre_completo: "", cedula: "" });
  const [capturedBase64, setCapturedBase64] = useState<string>("");

  const processImage = async (base64: string) => {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setCapturedBase64(base64);
    setShowCamera(false);
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ocr-cedula", {
        body: { image_base64: base64 },
      });

      if (error) throw error;

      if (data?.success && data.data) {
        const result: CedulaOcrResult = data.data;
        setOcrData(result);
        setEditForm(result);
        toast.success(`Datos extraídos (${result.lado === "reverso" ? "reverso" : "frente"})`);
      } else {
        toast.error(data?.error || "No se pudieron extraer los datos");
        setEditing(true);
        setEditForm({ nombre_completo: "", cedula: "" });
      }
    } catch (err: any) {
      console.error("OCR error:", err);
      toast.error("Error al procesar la cédula. Ingresa los datos manualmente.");
      setEditing(true);
      setEditForm({ nombre_completo: "", cedula: "" });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      processImage(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    const finalData = editing ? editForm : (ocrData || editForm);
    onResult(finalData, capturedBase64);
  };

  const handleRetake = () => {
    setPreview(null);
    setOcrData(null);
    setEditing(false);
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <DocumentCameraGuide
        onCapture={processImage}
        onCancel={() => setShowCamera(false)}
        aspectRatio={1.586}
        label={label}
      />
    );
  }

  // Initial state - no capture yet
  if (!preview) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            {label}
          </h3>
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center mb-3">
            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Toma una foto de la cédula para extraer los datos automáticamente
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCamera(true)}>
              <Camera className="h-4 w-4 mr-1" /> Tomar Foto
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-1" /> Galería
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    if (e.target) e.target.value = "";
                  }}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing or showing results
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          {label}
        </h3>

        <div className="rounded-xl overflow-hidden border">
          <img src={preview} alt="Cédula" className="w-full object-contain bg-muted max-h-40" />
        </div>

        {processing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm text-accent font-medium">Analizando cédula...</span>
          </div>
        )}

        {!processing && (ocrData || editing) && (
          <div className="space-y-3">
            {!editing ? (
              <>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Datos Extraídos</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>
                      <Edit2 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Nombre:</span> <span className="font-semibold">{ocrData?.nombre_completo || "—"}</span></p>
                    <p><span className="text-muted-foreground">Cédula:</span> <span className="font-semibold">{ocrData?.cedula || "—"}</span></p>
                    {ocrData?.fecha_nacimiento && <p><span className="text-muted-foreground">Nacimiento:</span> {ocrData.fecha_nacimiento}</p>}
                    {ocrData?.sexo && <p><span className="text-muted-foreground">Sexo:</span> {ocrData.sexo}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleRetake}>Retomar</Button>
                  <Button variant="cta" className="flex-1" onClick={handleConfirm}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div><Label>Nombre Completo</Label><Input value={editForm.nombre_completo} onChange={(e) => setEditForm(prev => ({ ...prev, nombre_completo: e.target.value }))} /></div>
                  <div><Label>Cédula</Label><Input value={editForm.cedula} onChange={(e) => setEditForm(prev => ({ ...prev, cedula: e.target.value }))} placeholder="001-0000000-0" /></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleRetake}>Retomar</Button>
                  <Button variant="cta" className="flex-1" onClick={handleConfirm} disabled={!editForm.nombre_completo && !editForm.cedula}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Usar Datos
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
