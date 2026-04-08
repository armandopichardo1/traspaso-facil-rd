import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, CheckCircle, Image, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import DocumentCameraGuide from "@/components/gestor/DocumentCameraGuide";

interface MarbeteCaptureProps {
  onCapture: (imageBase64: string) => void;
  captured?: boolean;
}

export default function MarbeteCapture({ onCapture, captured }: MarbeteCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = (base64: string) => {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setShowCamera(false);
    onCapture(base64);
    toast.success("Foto del marbete capturada");
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
      toast.success("Foto del marbete cargada");
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPreview(null);
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
