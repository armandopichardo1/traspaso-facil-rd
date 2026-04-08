import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle, UserCircle, RotateCcw } from "lucide-react";
import DocumentCameraGuide from "@/components/gestor/DocumentCameraGuide";

interface SelfieCaptureProps {
  label: string;
  onCapture: (imageBase64: string) => void;
}

export default function SelfieCapture({ label, onCapture }: SelfieCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string>("");

  const handleCapture = (base64: string) => {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setCapturedBase64(base64);
    setShowCamera(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setPreview(`data:image/jpeg;base64,${b64}`);
      setCapturedBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onCapture(capturedBase64);
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedBase64("");
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <DocumentCameraGuide
        onCapture={handleCapture}
        onCancel={() => setShowCamera(false)}
        aspectRatio={0.75}
        label={label}
        facingMode="user"
      />
    );
  }

  if (!preview) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-accent" />
            {label}
          </h3>
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center mb-3">
            <UserCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Toma una selfie para verificación antifraude
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCamera(true)}>
              <Camera className="h-4 w-4 mr-1" /> Tomar Selfie
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

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-accent" />
          {label}
        </h3>
        <div className="rounded-xl overflow-hidden border">
          <img src={preview} alt="Selfie" className="w-full object-contain bg-muted max-h-48" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-1" /> Retomar
          </Button>
          <Button variant="cta" className="flex-1" onClick={handleConfirm}>
            <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
