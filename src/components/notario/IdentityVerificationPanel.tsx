import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ImageOff,
  ScanFace,
  History,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
} from "lucide-react";
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

function toAi(r: {
  match: boolean;
  confidence: "alta" | "media" | "baja";
  rasgos_coincidentes: string[];
  rasgos_diferentes: string[];
  notas: string | null;
}): AiResult {
  return {
    match: r.match,
    confidence: r.confidence,
    rasgos_coincidentes: r.rasgos_coincidentes ?? [],
    rasgos_diferentes: r.rasgos_diferentes ?? [],
    notas: r.notas ?? "",
  };
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

function RasgosDetailView({
  rasgosCoincidentes,
  rasgosDiferentes,
  notas,
  compact = false,
}: {
  rasgosCoincidentes: string[];
  rasgosDiferentes: string[];
  notas?: string | null;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(!compact);
  const hasContent =
    rasgosCoincidentes.length > 0 || rasgosDiferentes.length > 0 || !!notas;
  if (!hasContent) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-teal" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
            Análisis facial detallado
          </span>
          {rasgosDiferentes.length > 0 && (
            <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
              {rasgosDiferentes.length} alerta{rasgosDiferentes.length > 1 ? "s" : ""}
            </Badge>
          )}
          {rasgosCoincidentes.length > 0 && rasgosDiferentes.length === 0 && (
            <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/20">
              Coincidencia total
            </Badge>
          )}
        </div>
        {compact && (
          expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Rasgos coincidentes */}
          {rasgosCoincidentes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-success">
                  Rasgos coincidentes
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({rasgosCoincidentes.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rasgosCoincidentes.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success border border-success/20 px-2.5 py-1 text-[11px] font-medium"
                  >
                    <Check className="h-3 w-3" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rasgos diferentes */}
          {rasgosDiferentes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-5 w-5 rounded-full bg-destructive/15 flex items-center justify-center">
                  <X className="h-3 w-3 text-destructive" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">
                  Rasgos con discrepancia
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({rasgosDiferentes.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rasgosDiferentes.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-1 text-[11px] font-medium"
                  >
                    <X className="h-3 w-3" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas del modelo */}
          {notas && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-warning mb-1">
                Notas del modelo IA
              </p>
              <p className="text-[11px] text-foreground leading-relaxed">{notas}</p>
            </div>
          )}
        </div>
      )}
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
    if (!canRun) {
      const faltan: string[] = [];
      if (!cedulaDocId) faltan.push("cédula");
      if (!selfieDocId) faltan.push("selfie");
      toast.error(
        `Faltan documentos del ${party}: ${faltan.join(" y ")}. Súbelos antes de verificar.`,
      );
      return;
    }
    setRunning(true);
    try {
      // 1. Buscar rutas de archivo en la base
      const [selfieRow, cedulaRow] = await Promise.all([
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
      if (selfieRow.error) {
        throw new Error(`No se pudo leer la selfie del ${party}: ${selfieRow.error.message}`);
      }
      if (cedulaRow.error) {
        throw new Error(`No se pudo leer la cédula del ${party}: ${cedulaRow.error.message}`);
      }
      const selfiePath = selfieRow.data?.file_url as string | undefined;
      const cedulaPath = cedulaRow.data?.file_url as string | undefined;
      if (!selfiePath) throw new Error(`La selfie del ${party} no existe en la base de datos.`);
      if (!cedulaPath) throw new Error(`La cédula del ${party} no existe en la base de datos.`);

      // 2. Firmar URLs en Storage
      const [selfieSigned, cedulaSigned] = await Promise.all([
        supabase.storage.from("documentos").createSignedUrl(selfiePath, 600),
        supabase.storage.from("documentos").createSignedUrl(cedulaPath, 600),
      ]);
      if (selfieSigned.error || !selfieSigned.data?.signedUrl) {
        throw new Error(
          `No se pudo firmar la selfie del ${party}: ${selfieSigned.error?.message ?? "URL vacía"}`,
        );
      }
      if (cedulaSigned.error || !cedulaSigned.data?.signedUrl) {
        throw new Error(
          `No se pudo firmar la cédula del ${party}: ${cedulaSigned.error?.message ?? "URL vacía"}`,
        );
      }
      const selfie_url = selfieSigned.data.signedUrl;
      const cedula_url = cedulaSigned.data.signedUrl;

      // 3. Invocar verify-face
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { selfie_url, cedula_url },
      });
      if (error) {
        throw new Error(
          `La función verify-face falló para el ${party}: ${error.message ?? "error desconocido"}`,
        );
      }
      if (!data) {
        throw new Error(`verify-face no devolvió datos para el ${party}.`);
      }
      if (!data.success) {
        throw new Error(
          `verify-face rechazó la verificación del ${party}: ${data.error ?? "sin detalle"}`,
        );
      }
      const ai = data.data as AiResult | undefined;
      if (!ai) {
        throw new Error(`verify-face devolvió una respuesta vacía para el ${party}.`);
      }
      setResult(ai);

      // 4. Persistir en identity_verifications
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
        toast.warning(
          `Verificación del ${party} realizada, pero no se guardó en el historial: ${insErr.message}`,
        );
      } else {
        onPersisted?.();
      }

      toast.success(
        ai.match
          ? `Identidad del ${party} coincide (confianza ${ai.confidence})`
          : `Identidad del ${party} NO coincide (confianza ${ai.confidence})`,
      );
    } catch (e: any) {
      console.error("verify-face flow error", e);
      toast.error(e?.message || `Error al verificar la identidad del ${party}.`);
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
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Confianza del modelo</span>
              <Badge variant="outline" className={`text-[10px] uppercase ${confidenceClass}`}>
                {result.confidence}
              </Badge>
            </div>
            <RasgosDetailView
              rasgosCoincidentes={result.rasgos_coincidentes ?? []}
              rasgosDiferentes={result.rasgos_diferentes ?? []}
              notas={result.notas}
              compact={false}
            />
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
          <p className="text-[10px] text-warning text-center">
            Faltan documentos del {party}:{" "}
            {[!cedulaDocId && "cédula", !selfieDocId && "selfie"].filter(Boolean).join(" y ")}.
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
      <div className="rounded-2xl overflow-hidden border border-navy/20 shadow-sm">
        <div className="bg-navy text-navy-foreground p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-navy-foreground/10 backdrop-blur-sm flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-navy-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-foreground/70">
              Panel de verificación notarial
            </p>
            <h2 className="text-base font-extrabold leading-tight text-navy-foreground">
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
        onPersisted={handlePersisted}
      />
      <PartyVerification
        traspasoId={traspasoId}
        party="comprador"
        nombre={compradorNombre}
        cedulaDocId={cedComp}
        selfieDocId={selComp}
        onResult={handleResult}
        onPersisted={handlePersisted}
      />

      {/* Historial de verificaciones IA guardadas */}
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Historial de verificaciones IA
            </p>
            <span className="ml-auto text-[10px] text-muted-foreground">{history.length}</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aún no se ha registrado ninguna verificación IA para este traspaso.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => {
                const confClass =
                  h.confidence === "alta"
                    ? "bg-success/15 text-success border-success/30"
                    : h.confidence === "media"
                      ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-destructive/15 text-destructive border-destructive/30";
                const matchClass = h.match
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30";
                return (
                  <li key={h.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {h.party}
                      </Badge>
                      <Badge variant="outline" className={`gap-1 text-[10px] uppercase ${matchClass}`}>
                        {h.match ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {h.match ? "Coincide" : "No coincide"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase ${confClass}`}>
                        Confianza {h.confidence}
                      </Badge>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("es-DO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <RasgosDetailView
                      rasgosCoincidentes={h.rasgos_coincidentes ?? []}
                      rasgosDiferentes={h.rasgos_diferentes ?? []}
                      notas={h.notas}
                      compact
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        La verificación facial es asistida por IA como apoyo al juicio del notario. El estatus
        antifraude oficial lo confirma el equipo TRASPASA.DO antes de habilitar la firma.
      </p>
    </div>
  );
}
