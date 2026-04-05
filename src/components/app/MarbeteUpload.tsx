import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, CheckCircle, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

interface MarbeteUploadProps {
  traspasoId: string;
  existingUrl?: string | null;
  onUploaded: () => void;
}

export default function MarbeteUpload({ traspasoId, existingUrl, onUploaded }: MarbeteUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${traspasoId}/marbete_${Date.now()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("documentos")
        .upload(path, file, { upsert: true });

      if (storageErr) throw storageErr;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);

      const { error: dbErr } = await supabase.from("traspaso_documentos").insert({
        traspaso_id: traspasoId,
        tipo: "marbete",
        file_url: urlData.publicUrl,
      });

      if (dbErr) throw dbErr;

      toast.success("Marbete subido correctamente");
      onUploaded();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el marbete");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const openPicker = (capture?: boolean) => {
    if (fileRef.current) {
      if (capture) {
        fileRef.current.setAttribute("capture", "environment");
      } else {
        fileRef.current.removeAttribute("capture");
      }
      fileRef.current.click();
    }
  };

  const displayUrl = preview || existingUrl;

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
            onClick={() => openPicker(true)}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
            Tomar Foto
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => openPicker(false)}
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
