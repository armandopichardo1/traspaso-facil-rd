import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, CheckCircle, Image, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DocumentCameraGuide from "@/components/gestor/DocumentCameraGuide";

interface MarbeteOcrData {
  placa: string;
  fecha_vencimiento: string;
  ano_fiscal: string;
  tipo_vehiculo: string;
  vigente: boolean;
}

interface MarbeteCaptureProps {
  onCapture: (imageBase64: string) => void;
  onOcrResult?: (data: MarbeteOcrData) => void;
  captured?: boolean;
}

export default function MarbeteCapture({ onCapture, onOcrResult, captured }: MarbeteCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState<MarbeteOcrData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runOcr = async (base64: string) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrData(null);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-marbete", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        setOcrData(data.data);
        onOcrResult?.(data.data);
        toast.success("Datos del marbete extraídos");
      } else {
        setOcrError(data?.error || "No se pudo leer el marbete");
      }
    } catch (e: any) {
      console.error("OCR marbete error:", e);
      setOcrError("Error al procesar la imagen");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCapture = (base64: string) => {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setShowCamera(false);
    onCapture(base64);
    runOcr(base64);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setPreview(`data:image/jpeg;base64,${b64}`);
      onCapture(b64);
      runOcr(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPreview(null);
    setOcrData(null);
    setOcrError(null);
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <DocumentCameraGuide
        onCapture={handleCapture}
        onCancel={() => setShowCamera(false)}
        aspectRatio={1.5}
        label="Coloca el marbete dentro del marco"
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Image className="h-4 w-4 text-accent" />
          Marbete del Vehículo
        </h3>

        {preview ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border">
              <img src={preview} alt="Marbete" className="w-full object-contain bg-muted max-h-40" />
            </div>

            {ocrLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Extrayendo datos del marbete…
              </div>
            )}

            {ocrData && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-accent mb-1">Datos extraídos</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Placa:</span>
                  <span className="font-medium">{ocrData.placa || "—"}</span>
                  <span className="text-muted-foreground">Vencimiento:</span>
                  <span className="font-medium">{ocrData.fecha_vencimiento || "—"}</span>
                  <span className="text-muted-foreground">Año fiscal:</span>
                  <span className="font-medium">{ocrData.ano_fiscal || "—"}</span>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{ocrData.tipo_vehiculo || "—"}</span>
                  <span className="text-muted-foreground">Vigente:</span>
                  <span className={`font-medium ${ocrData.vigente ? "text-green-600" : "text-red-500"}`}>
                    {ocrData.vigente ? "Sí ✓" : "No ✗"}
                  </span>
                </div>
              </div>
            )}

            {ocrError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {ocrError}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Marbete capturado
            </div>
            <Button variant="outline" size="sm" onClick={handleRetake}>
              <RotateCcw className="h-4 w-4 mr-1" /> Retomar
            </Button>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center mb-3">
              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Toma una foto del marbete del vehículo
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (e.target) e.target.value = "";
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCamera(true)}>
                <Camera className="h-4 w-4 mr-1" /> Tomar Foto
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Galería
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
