import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, CheckCircle, Clock, Loader2 } from "lucide-react";
import { STATUS_STEPS } from "@/lib/traspaso-status";
import { useTraspasoByCodigo, useTimeline } from "@/hooks/useTraspasoServices";

export default function Seguimiento() {
  const { code } = useParams();

  const { data: traspaso, isLoading, error } = useTraspasoByCodigo(code);
  const { data: timeline } = useTimeline(traspaso?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !traspaso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Código no encontrado</h1>
          <p className="text-muted-foreground">Verifica el código de seguimiento e intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === traspaso.status);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-primary">TRASPASA.DO</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de Traspaso</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Car className="h-5 w-5 text-accent" />
              <div>
                <p className="font-bold">
                  {traspaso.vehiculoMarca} {traspaso.vehiculoModelo} {traspaso.vehiculoAno}
                </p>
                <p className="text-sm text-muted-foreground">
                  Placa: {traspaso.vehiculoPlaca} · {traspaso.codigo}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-sm mb-4">Estado del Traspaso</h2>
            {STATUS_STEPS.map((s, i) => {
              const isDone = i <= currentIdx && traspaso.status !== "cancelado";
              const isCurrent = i === currentIdx;
              const entry = timeline?.find((t) => t.status === s.key);
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      isDone ? "bg-green-500 text-white" : isCurrent ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone && !isCurrent ? <CheckCircle className="h-3.5 w-3.5" /> :
                       isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                       <Clock className="h-3 w-3" />}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isDone ? "bg-green-500" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm ${isDone || isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                    {entry?.nota && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.nota}</p>
                    )}
                    {entry && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("es-DO")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by TRASPASA.DO · Verificado ✅
        </p>
      </div>
    </div>
  );
}
