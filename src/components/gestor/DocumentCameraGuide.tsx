import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw, ImagePlus } from "lucide-react";

interface DocumentCameraGuideProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  label?: string;
}

export default function DocumentCameraGuide({
  onCapture,
  onCancel,
  aspectRatio = 1.586,
  label = "Coloca el documento dentro del marco",
}: DocumentCameraGuideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const getGuideRect = () => {
    if (!containerRef.current) return { x: 0, y: 0, w: 0, h: 0 };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const padding = 24;
    const guideW = cw - padding * 2;
    const guideH = guideW / aspectRatio;
    const x = padding;
    const y = (ch - guideH) / 2;
    return { x, y, w: guideW, h: guideH };
  };

  const cropToGuide = (source: HTMLVideoElement | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return null;

    const guide = getGuideRect();
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    let sourceW: number, sourceH: number;
    if (source instanceof HTMLVideoElement) {
      sourceW = source.videoWidth;
      sourceH = source.videoHeight;
    } else {
      sourceW = source.naturalWidth;
      sourceH = source.naturalHeight;
    }

    const scaleX = sourceW / cw;
    const scaleY = sourceH / ch;

    const sx = guide.x * scaleX;
    const sy = guide.y * scaleY;
    const sw = guide.w * scaleX;
    const sh = guide.h * scaleY;

    const targetW = Math.min(sw, 1920);
    const targetH = targetW / aspectRatio;

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetW, targetH);

    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const base64 = cropToGuide(videoRef.current);
    if (base64) {
      setCaptured(`data:image/jpeg;base64,${base64}`);
      stopCamera();
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // For file uploads, crop to center with aspect ratio
        const canvas = canvasRef.current;
        if (!canvas) return;
        const targetW = Math.min(img.naturalWidth, 1920);
        const targetH = targetW / aspectRatio;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;

        // Center crop
        const imgAR = img.naturalWidth / img.naturalHeight;
        const targetAR = aspectRatio;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgAR > targetAR) {
          sw = img.naturalHeight * targetAR;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / targetAR;
          sy = (img.naturalHeight - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        const b64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
        setCaptured(`data:image/jpeg;base64,${b64}`);
        stopCamera();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleAccept = () => {
    if (captured) {
      onCapture(captured.split(",")[1]);
    }
  };

  const guide = getGuideRect();

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {!captured ? (
        <div
          ref={containerRef}
          className="relative bg-black rounded-xl overflow-hidden"
          style={{ aspectRatio: "3/4" }}
        >
          {!cameraError && stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3">
              <Camera className="h-12 w-12" />
              <p className="text-sm text-center px-4">
                {cameraError ? "No se pudo acceder a la cámara" : "Iniciando cámara..."}
              </p>
              {cameraError && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/30"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-1" /> Subir desde galería
                </Button>
              )}
            </div>
          )}

          {/* Guide overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay with transparent center */}
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <mask id="guide-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x="24" y={`calc(50% - ${(100 / (2 * aspectRatio))}%)`}
                    width="calc(100% - 48px)"
                    height={`${100 / aspectRatio}%`}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
            </svg>
            <div className="absolute inset-0 bg-black/50" style={{
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 24px calc(50% - ${guide.h / 2}px), 24px calc(50% + ${guide.h / 2}px), calc(100% - 24px) calc(50% + ${guide.h / 2}px), calc(100% - 24px) calc(50% - ${guide.h / 2}px), 24px calc(50% - ${guide.h / 2}px))`,
            }} />
            {/* Guide border */}
            <div
              className="absolute border-2 border-white/80 rounded-xl"
              style={{
                left: "24px",
                right: "24px",
                top: "50%",
                transform: "translateY(-50%)",
                aspectRatio: `${aspectRatio}`,
              }}
            >
              {/* Corner markers */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-[3px] border-l-[3px] border-accent rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-[3px] border-r-[3px] border-accent rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-[3px] border-l-[3px] border-accent rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-[3px] border-r-[3px] border-accent rounded-br-lg" />
            </div>
            {/* Label */}
            <p className="absolute bottom-16 left-0 right-0 text-center text-white/90 text-xs font-medium">
              {label}
            </p>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white h-10 w-10"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
            </Button>
            {!cameraError && stream && (
              <button
                onClick={handleCapture}
                className="h-16 w-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:bg-white/50 transition-colors"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white h-10 w-10"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border">
            <img src={captured} alt="Captura" className="w-full object-contain bg-muted" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleRetake}>
              <RotateCcw className="h-4 w-4 mr-1" /> Retomar
            </Button>
            <Button variant="cta" className="flex-1" onClick={handleAccept}>
              Usar esta foto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
