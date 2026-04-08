import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, CheckCircle, Loader2, Image, AlertTriangle, Calendar, Car, Hash } from "lucide-react";
import { toast } from "sonner";
import DocumentCameraGuide from "@/components/gestor/DocumentCameraGuide";

export interface MarbeteOcrResult {
  placa: string;
  fecha_vencimiento: string;
  ano_fiscal: string;
  tipo_vehiculo: string;
  vigente: boolean;
}

interface MarbeteUploadProps {
  traspasoId: string;
  existingUrl?: string | null;
  onUploaded: () => void;
  onOcrResult?: (result: MarbeteOcrResult) => void;
}

export default function MarbeteUpload({ traspasoId, existingUrl, onUploaded, onOcrResult }: MarbeteUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<MarbeteOcrResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAndOcr = async (base64: string) => {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setShowCamera(false);
    setUploading(true);
    setOcrLoading(true);

    try {
      // Convert base64 to blob for storage upload
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "image/jpeg" });

      const path = `${traspasoId}/marbete_${Date.now()}.jpg`;

      const { error: storageErr } = await supabase.storage
        .from("documentos")
        .upload(path, blob, { upsert: true });

      if (storageErr) throw storageErr;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);

      const { error: dbErr } = await supabase.from("traspaso_documentos").insert({
        traspaso_id: traspasoId,
        tipo: "marbete",
        file_url: urlData.publicUrl,
      });

      if (dbErr) throw dbErr;

      setUploading(false);
      toast.success("Marbete subido correctamente");
      onUploaded();

      // Run OCR in parallel
      try {
        const { data: ocrData, error: ocrErr } = await supabase.functions.invoke("ocr-marbete", {
          body: { image_base64: base64 },
        });

        if (ocrErr) throw ocrErr;

        if (ocrData?.success && ocrData.data) {
          setOcrResult(ocrData.data);
          onOcrResult?.(ocrData.data);
          toast.success("Datos del marbete extraídos");
        } else {
          toast.error(ocrData?.error || "No se pudieron extraer los datos");
        }
      } catch (ocrE: any) {
        console.error("OCR error:", ocrE);
        toast.error("Error al procesar OCR del marbete");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el marbete");
      setPreview(null);
    } finally {
      setUploading(false);
      setOcrLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      uploadAndOcr(b64);
    };
    reader.readAsDataURL(file);
  };

  const displayUrl = preview || existingUrl;

  if (showCamera) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Image className="h-4 w-4 text-accent" />
            Marbete del Vehículo
          </h2>
          <DocumentCameraGuide
            onCapture={(base64) => uploadAndOcr(base64)}
            onCancel={() => setShowCamera(false)}
            aspectRatio={1.5}
            label="Coloca el marbete dentro del marco"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Image className="h-4 w-4 text-accent" />
          Marbete del Vehículo
        </h2>

        {displayUrl ? (
          <div className="mb-3">
            <img
              src={displayUrl}
              alt="Marbete"
              className="w-full max-h-48 object-contain rounded-lg border"
            />
            {existingUrl && !preview && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3" /> Marbete cargado
              </p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center mb-3">
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Sube una foto del marbete de tu vehículo
            </p>
          </div>
        )}

        {/* OCR Results */}
        {ocrLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20 mb-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm text-accent font-medium">Analizando marbete...</span>
          </div>
        )}

        {ocrResult && !ocrLoading && (
          <div className="rounded-lg border p-3 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Datos Extraídos</span>
              <Badge className={ocrResult.vigente
                ? "bg-green-100 text-green-700 border-green-200 text-[10px]"
                : "bg-red-100 text-red-700 border-red-200 text-[10px]"
              }>
                {ocrResult.vigente ? (
                  <><CheckCircle className="h-3 w-3 mr-0.5" /> VIGENTE</>
                ) : (
                  <><AlertTriangle className="h-3 w-3 mr-0.5" /> VENCIDO</>
                )}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Placa</p>
                  <p className="font-bold">{ocrResult.placa || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Vencimiento</p>
                  <p className="font-bold">{ocrResult.fecha_vencimiento || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Tipo</p>
                  <p className="font-bold">{ocrResult.tipo_vehiculo || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Año Fiscal</p>
                  <p className="font-bold">{ocrResult.ano_fiscal || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowCamera(true)}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
            Tomar Foto
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Galería
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
