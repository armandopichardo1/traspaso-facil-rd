import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DocumentCameraGuide from "./DocumentCameraGuide";

export type OcrResult = {
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  color: string;
  chasis: string;
  tipo_persona: "fisica" | "juridica";
  propietario_nombre: string;
  propietario_cedula: string;
  propietario_rnc: string;
};

interface MatriculaScannerProps {
  onAccept: (data: OcrResult) => void;
  onSkip: () => void;
}

export default function MatriculaScanner({ onAccept, onSkip }: MatriculaScannerProps) {
  const { toast } = useToast();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleCameraCapture = (base64: string) => {
    setImageBase64(base64);
    setImagePreview(`data:image/jpeg;base64,${base64}`);
    setShowCamera(false);
    setResult(null);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-matricula", {
        body: { image_base64: imageBase64 },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        setResult(data.data);
        toast({ title: "¡Matrícula escaneada!", description: "Revisa los datos extraídos" });
      } else {
        toast({ title: "No se pudo leer", description: data?.error || "Intenta con otra foto", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error al escanear", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  if (showCamera) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="h-4 w-4" /> Capturar Matrícula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentCameraGuide
              onCapture={handleCameraCapture}
              onCancel={() => setShowCamera(false)}
              label="Coloca la matrícula dentro del marco"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="h-4 w-4" /> Escanear Matrícula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toma una foto de la matrícula del vehículo para auto-rellenar los datos del formulario.
          </p>

          {!imagePreview ? (
            <Button
              variant="cta"
              className="w-full"
              onClick={() => setShowCamera(true)}
            >
              <ScanLine className="h-4 w-4 mr-2" /> Abrir cámara / Subir foto
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border">
                <img src={imagePreview} alt="Matrícula" className="w-full max-h-64 object-contain bg-muted" />
                <button
                  onClick={() => { setImagePreview(null); setImageBase64(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-1 text-xs"
                >
                  Cambiar
                </button>
              </div>

              {!result && (
                <Button variant="cta" className="w-full" onClick={handleScan} disabled={scanning}>
                  {scanning ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Escaneando con IA...</>
                  ) : (
                    <><ScanLine className="h-4 w-4" /> Escanear con IA</>
                  )}
                </Button>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Datos extraídos</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                <Field label="Marca" value={result.marca} />
                <Field label="Modelo" value={result.modelo} />
                <Field label="Año" value={result.ano} />
                <Field label="Placa" value={result.placa} />
                <Field label="Color" value={result.color} />
                <Field label="Tipo" value={result.tipo_persona === "juridica" ? "Empresa" : "Persona Física"} />
                <Field label="Propietario" value={result.propietario_nombre} />
                {result.tipo_persona === "juridica" ? (
                  <Field label="RNC" value={result.propietario_rnc} />
                ) : (
                  <Field label="Cédula" value={result.propietario_cedula} />
                )}
              </div>
              {Object.values(result).some(v => !v) && (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">Algunos campos no se pudieron leer. Podrás editarlos manualmente.</p>
                </div>
              )}
              <Button variant="cta" className="w-full" onClick={() => onAccept(result)}>
                Aceptar y continuar
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setResult(null); setShowCamera(true); }}>
                Retomar foto
              </Button>
            </div>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onSkip}>
            Saltar · Ingresar datos manualmente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${value ? "" : "text-amber-600 italic"}`}>
        {value || "No detectado"}
      </span>
    </div>
  );
}
