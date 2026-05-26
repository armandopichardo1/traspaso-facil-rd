import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isTerminal } from "@/lib/traspaso-status";

interface TimelineLike {
  status: string;
  nota?: string | null;
  createdAt: string;
}

interface Params {
  traspasoId: string | undefined;
  status: string | undefined;
  codigo?: string | null;
  vehiculo?: string | null;
  timeline?: TimelineLike[];
}

/**
 * Resumen corto generado por IA del estado del traspaso.
 * Se cachea ~5 min y se invalida cuando cambia el status.
 */
export function useTraspasoSummary({
  traspasoId,
  status,
  codigo,
  vehiculo,
  timeline,
}: Params) {
  return useQuery({
    queryKey: ["traspaso", traspasoId, "ai-summary", status, timeline?.length ?? 0],
    enabled: !!traspasoId && !!status && !isTerminal(status),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("traspaso-summary", {
        body: {
          status,
          codigo: codigo ?? undefined,
          vehiculo: vehiculo ?? undefined,
          timeline: (timeline ?? []).map((t) => ({
            status: t.status,
            nota: t.nota,
            createdAt: t.createdAt,
          })),
        },
      });
      if (error) throw new Error(error.message);
      return (data?.summary as string) ?? "";
    },
  });
}
