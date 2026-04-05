import { useRef, useState, useEffect } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check, PenTool } from "lucide-react";

interface SignaturePadProps {
  title?: string;
  onSign: (signatureData: SignatureData) => void;
  onCancel?: () => void;
}

export interface SignatureData {
  imageDataUrl: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  geolocation: string | null;
}

export default function SignaturePad({ title = "Firma Electrónica", onSign, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")!.scale(ratio, ratio);

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
    });

    padRef.current.addEventListener("endStroke", () => {
      setIsEmpty(padRef.current?.isEmpty() ?? true);
    });

    return () => { padRef.current?.off(); };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    setSigning(true);

    const imageDataUrl = padRef.current.toDataURL("image/png");
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;

    // Get IP address
    let ipAddress = "unknown";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ipAddress = data.ip;
    } catch { /* fallback */ }

    // Get geolocation
    let geolocation: string | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      geolocation = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch { /* optional */ }

    onSign({ imageDataUrl, timestamp, ipAddress, userAgent, geolocation });
    setSigning(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Firma electrónica válida conforme a la Ley 126-02 de RD. 
          Se registrará IP, fecha/hora y dispositivo como audit trail.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full touch-none"
            style={{ height: 180 }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
            <Eraser className="h-4 w-4 mr-1" /> Limpiar
          </Button>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button
            variant="cta"
            size="sm"
            onClick={handleSign}
            disabled={isEmpty || signing}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" /> {signing ? "Firmando..." : "Confirmar Firma"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
