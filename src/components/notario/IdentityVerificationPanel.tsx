import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, Loader2, ImageOff, ScanFace, History } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDocumentos, useDocumentoSignedUrl } from "@/hooks/useTraspasoServices";

type Party = "vendedor" | "comprador";

interface AiResult {
  match: boolean;
  confidence: "alta" | "media" | "baja";
  rasgos_coincidentes: string[];
  rasgos_diferentes: string[];
  notas: string;
}

function Thumb({ docId, label }: { docId: string | undefined; label: string }) {
  const { data: url, isLoading } = useDocumentoSignedUrl(docId);
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="h-5 w-5" />
            <span className="text-[10px]">Sin documento</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PartyVerification({
  traspasoId,
  party,
  nombre,
  cedulaDocId,
  selfieDocId,
  onResult,
  onPersisted,
}: {
  traspasoId: string;
  party: Party;
  nombre: string;
  cedulaDocId?: string;
  selfieDocId?: string;
  onResult?: (party: Party, result: AiResult | null) => void;
  onPersisted?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResultState] = useState<AiResult | null>(null);
  const setResult = (r: AiResult | null) => {
    setResultState(r);
    onResult?.(party, r);
  };
  const canRun = !!cedulaDocId && !!selfieDocId;

  const run = async () => {
    if (!canRun) return;
    setRunning(true);
    try {
      // Get fresh signed URLs for AI call
      const [{ data: selfieUrlRes }, { data: cedulaUrlRes }] = await Promise.all([
        supabase
          .from("traspaso_documentos")
          .select("file_url")
          .eq("id", selfieDocId!)
          .maybeSingle(),
        supabase
          .from("traspaso_documentos")
          .select("file_url")
          .eq("id", cedulaDocId!)
          .maybeSingle(),
      ]);
      const [selfieSigned, cedulaSigned] = await Promise.all([
        supabase.storage.from("documentos").createSignedUrl(selfieUrlRes!.file_url as string, 600),
        supabase.storage.from("documentos").createSignedUrl(cedulaUrlRes!.file_url as string, 600),
      ]);
      const selfie_url = selfieSigned.data?.signedUrl;
      const cedula_url = cedulaSigned.data?.signedUrl;
      if (!selfie_url || !cedula_url) throw new Error("No se pudieron firmar las URLs");

      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { selfie_url, cedula_url },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error de verificación");
      const ai = data.data as AiResult;
      setResult(ai);

      // Persist to identity_verifications
      const { data: userRes } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("identity_verifications").insert({
        traspaso_id: traspasoId,
        party,
        match: ai.match,
        confidence: ai.confidence,
        rasgos_coincidentes: ai.rasgos_coincidentes ?? [],
        rasgos_diferentes: ai.rasgos_diferentes ?? [],
        notas: ai.notas ?? null,
        created_by: userRes.user?.id ?? null,
      });
      if (insErr) {
        console.error("identity_verifications insert error", insErr);
        toast.warning("Verificación realizada pero no se guardó el historial");
      } else {
        onPersisted?.();
      }

      toast.success(
        ai.match
          ? `Identidad ${party} coincide (${ai.confidence})`
          : `Identidad ${party} NO coincide`,
      );
    } catch (e: any) {
      toast.error(e?.message || "Error al verificar identidad");
    } finally {
      setRunning(false);
    }
  };

  const confidenceClass =
    result?.confidence === "alta"
      ? "bg-success/15 text-success border-success/30"
      : result?.confidence === "media"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-destructive/15 text-destructive border-destructive/30";

  return (
    <Card className="rounded-xl border-border/70">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {party === "vendedor" ? "Vendedor" : "Comprador"}
            </p>
            <p className="font-bold text-sm">{nombre || "—"}</p>
          </div>
          {result && (
            <Badge
              variant="outline"
              className={`gap-1 text-[10px] uppercase tracking-wide ${
                result.match
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              }`}
            >
              {result.match ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {result.match ? "Coincide" : "No coincide"}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Thumb docId={cedulaDocId} label="Cédula" />
          <Thumb docId={selfieDocId} label="Selfie" />
        </div>

        {result && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Confianza del modelo</span>
              <Badge variant="outline" className={`text-[10px] uppercase ${confidenceClass}`}>
                {result.confidence}
              </Badge>
            </div>
            {result.rasgos_coincidentes?.length > 0 && (
              <p className="text-[11px] text-foreground">
                <span className="font-bold">Coinciden:</span> {result.rasgos_coincidentes.join(", ")}
              </p>
            )}
            {result.rasgos_diferentes?.length > 0 && (
              <p className="text-[11px] text-foreground">
                <span className="font-bold">Dudas:</span> {result.rasgos_diferentes.join(", ")}
              </p>
            )}
            {result.notas && (
              <p className="text-[11px] italic text-muted-foreground">{result.notas}</p>
            )}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={run}
          disabled={!canRun || running}
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando…
            </>
          ) : (
            <>
              <ScanFace className="h-4 w-4 mr-2" />
              {result ? "Volver a verificar" : "Verificar identidad con IA"}
            </>
          )}
        </Button>
        {!canRun && (
          <p className="text-[10px] text-muted-foreground text-center">
            Faltan documentos (cédula o selfie) para esta parte.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface Props {
  traspasoId: string;
  vendedorNombre: string;
  compradorNombre: string;
  antifraudeStatus: string;
  antifraudeNotas?: string | null;
  onVerificationChange?: (state: { vendedorVerified: boolean; compradorVerified: boolean }) => void;
}

export default function IdentityVerificationPanel({
  traspasoId,
  vendedorNombre,
  compradorNombre,
  antifraudeStatus,
  antifraudeNotas,
  onVerificationChange,
}: Props) {
  const { data: docs } = useDocumentos(traspasoId);
  const queryClient = useQueryClient();
  const [results, setResults] = useState<{ vendedor: AiResult | null; comprador: AiResult | null }>({
    vendedor: null,
    comprador: null,
  });

  type VerificationRow = {
    id: string;
    party: Party;
    match: boolean;
    confidence: "alta" | "media" | "baja";
    rasgos_coincidentes: string[];
    rasgos_diferentes: string[];
    notas: string | null;
    created_at: string;
  };

  const historyKey = ["identity_verifications", traspasoId];
  const { data: history = [] } = useQuery<VerificationRow[]>({
    queryKey: historyKey,
    enabled: !!traspasoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("identity_verifications")
        .select("id, party, match, confidence, rasgos_coincidentes, rasgos_diferentes, notas, created_at")
        .eq("traspaso_id", traspasoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VerificationRow[];
    },
  });

  // Hidrata estado de verificación a partir del historial guardado (último por parte)
  useEffect(() => {
    if (!history.length) return;
    const latestBy = (p: Party) => history.find((r) => r.party === p);
    const v = latestBy("vendedor");
    const c = latestBy("comprador");
    setResults((prev) => {
      const next = {
        vendedor: prev.vendedor ?? (v ? toAi(v) : null),
        comprador: prev.comprador ?? (c ? toAi(c) : null),
      };
      onVerificationChange?.({
        vendedorVerified: !!next.vendedor,
        compradorVerified: !!next.comprador,
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  const handleResult = (party: Party, r: AiResult | null) => {
    setResults((prev) => {
      const next = { ...prev, [party]: r };
      onVerificationChange?.({
        vendedorVerified: !!next.vendedor,
        compradorVerified: !!next.comprador,
      });
      return next;
    });
  };

  const handlePersisted = () => {
    queryClient.invalidateQueries({ queryKey: historyKey });
  };

  const { cedVend, selVend, cedComp, selComp } = useMemo(() => {
    const byTipo = (tipo: string) => docs?.find((d) => d.tipo === tipo)?.id;
    return {
      cedVend: byTipo("cedula_vendedor"),
      selVend: byTipo("selfie_vendedor"),
      cedComp: byTipo("cedula_comprador"),
      selComp: byTipo("selfie_comprador"),
    };
  }, [docs]);

  const aprobado = antifraudeStatus === "aprobado";
  const rechazado = antifraudeStatus === "rechazado";

  return (
    <div className="space-y-4">
      {/* Institutional navy header */}
      <div className="rounded-2xl overflow-hidden border border-[hsl(var(--navy))]/20 shadow-sm">
        <div className="bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground,0_0%_100%))] p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Panel de verificación notarial
            </p>
            <h2 className="text-base font-extrabold leading-tight text-white">
              Identidad de las partes
            </h2>
          </div>
          <Badge className="bg-gold text-gold-foreground border-0 text-[10px] font-bold gap-1 shadow-sm">
            <ShieldCheck className="h-3 w-3" />
            Certificación Ley 126-02
          </Badge>
        </div>

        <div
          className={`p-3 text-xs flex items-start gap-2 ${
            aprobado
              ? "bg-success/10 text-success"
              : rechazado
                ? "bg-destructive/10 text-destructive"
                : "bg-warning/10 text-warning"
          }`}
        >
          {aprobado ? (
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold">
              Antifraude: {aprobado ? "Aprobado" : rechazado ? "Rechazado" : "Pendiente del equipo"}
            </p>
            {antifraudeNotas && <p className="italic opacity-80 mt-0.5">{antifraudeNotas}</p>}
          </div>
        </div>
      </div>

      <PartyVerification
        traspasoId={traspasoId}
        party="vendedor"
        nombre={vendedorNombre}
        cedulaDocId={cedVend}
        selfieDocId={selVend}
        onResult={handleResult}
      />
      <PartyVerification
        traspasoId={traspasoId}
        party="comprador"
        nombre={compradorNombre}
        cedulaDocId={cedComp}
        selfieDocId={selComp}
        onResult={handleResult}
      />

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        La verificación facial es asistida por IA como apoyo al juicio del notario. El estatus
        antifraude oficial lo confirma el equipo TRASPASA.DO antes de habilitar la firma.
      </p>
    </div>
  );
}
