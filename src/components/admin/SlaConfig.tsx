import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Save, Loader2 } from "lucide-react";

type SlaRow = {
  id: string;
  etapa: string;
  horas_objetivo: number;
  descripcion: string | null;
};

export default function SlaConfig() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: slas, isLoading } = useQuery({
    queryKey: ["sla_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_config")
        .select("*")
        .order("etapa");
      if (error) throw error;
      return data as SlaRow[];
    },
  });

  const handleChange = (etapa: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setEdits((prev) => ({ ...prev, [etapa]: num }));
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [etapa, horas] of Object.entries(edits)) {
        const { error } = await supabase
          .from("sla_config")
          .update({ horas_objetivo: horas, updated_at: new Date().toISOString() })
          .eq("etapa", etapa);
        if (error) throw error;
      }
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["sla_config"] });
      toast.success("SLAs actualizados correctamente");
    } catch {
      toast.error("Error al guardar SLAs");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Cargando SLAs...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          Configuración de SLAs por Etapa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {slas?.map((sla) => {
            const currentValue = edits[sla.etapa] ?? sla.horas_objetivo;
            const isEdited = edits[sla.etapa] !== undefined;

            return (
              <div key={sla.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sla.descripcion || sla.etapa}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{sla.etapa}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={currentValue}
                    onChange={(e) => handleChange(sla.etapa, e.target.value)}
                    className={`w-20 h-8 text-sm text-right ${isEdited ? "border-accent ring-1 ring-accent/30" : ""}`}
                  />
                  <span className="text-xs text-muted-foreground w-6">hrs</span>
                </div>
              </div>
            );
          })}
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full mt-4" size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar Cambios
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
