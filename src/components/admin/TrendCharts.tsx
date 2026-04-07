import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

type Granularity = "week" | "month";

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: "Solicitud",
  verificacion_antifraude: "Antifraude",
  contrato_firmado: "Contrato",
  matricula_recogida: "Matrícula",
  plan_piloto: "Plan Piloto",
  dgii_proceso: "Nueva Matrícula",
  completado: "Completado",
};

const STATUS_COLORS: Record<string, string> = {
  solicitud_recibida: "hsl(199, 89%, 48%)",
  verificacion_antifraude: "hsl(38, 92%, 50%)",
  contrato_firmado: "hsl(142, 71%, 45%)",
  matricula_recogida: "hsl(262, 83%, 58%)",
  plan_piloto: "hsl(330, 81%, 60%)",
  dgii_proceso: "hsl(210, 40%, 50%)",
  completado: "hsl(142, 76%, 36%)",
};

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const day = start.getDate();
  const month = start.toLocaleString("es-DO", { month: "short" });
  return `${day} ${month}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("es-DO", { month: "short", year: "2-digit" });
}

function getBucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function getBucketLabel(key: string, granularity: Granularity): string {
  const date = new Date(key + "T00:00:00");
  return granularity === "month" ? getMonthLabel(date) : getWeekLabel(date);
}

export default function TrendCharts() {
  const [granularity, setGranularity] = useState<Granularity>("week");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trends"],
    queryFn: async () => {
      const { data: traspasos, error } = await supabase
        .from("traspasos")
        .select("id, created_at, status")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return traspasos as { id: string; created_at: string; status: string }[];
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando tendencias...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No hay traspasos suficientes para generar gráficos.
      </div>
    );
  }

  // Volume by time bucket
  const volumeBuckets: Record<string, number> = {};
  // Status breakdown by bucket
  const statusBuckets: Record<string, Record<string, number>> = {};
  // Cumulative
  let cumulative = 0;
  const cumulativeBuckets: Record<string, number> = {};

  data.forEach((t) => {
    const date = new Date(t.created_at);
    const key = getBucketKey(date, granularity);
    volumeBuckets[key] = (volumeBuckets[key] || 0) + 1;

    if (!statusBuckets[key]) statusBuckets[key] = {};
    statusBuckets[key][t.status] = (statusBuckets[key][t.status] || 0) + 1;
  });

  const sortedKeys = Object.keys(volumeBuckets).sort();

  const volumeData = sortedKeys.map((key) => {
    cumulative += volumeBuckets[key];
    cumulativeBuckets[key] = cumulative;
    return {
      label: getBucketLabel(key, granularity),
      count: volumeBuckets[key],
      cumulative,
    };
  });

  // All statuses present
  const allStatuses = [...new Set(data.map((t) => t.status))];

  const statusData = sortedKeys.map((key) => {
    const entry: Record<string, string | number> = {
      label: getBucketLabel(key, granularity),
    };
    allStatuses.forEach((s) => {
      entry[s] = statusBuckets[key]?.[s] || 0;
    });
    return entry;
  });

  const volumeConfig: ChartConfig = {
    count: { label: "Nuevos", color: "hsl(199, 89%, 48%)" },
  };

  const cumulativeConfig: ChartConfig = {
    cumulative: { label: "Total acumulado", color: "hsl(142, 71%, 45%)" },
  };

  const statusConfig: ChartConfig = {};
  allStatuses.forEach((s) => {
    statusConfig[s] = {
      label: STATUS_LABELS[s] || s,
      color: STATUS_COLORS[s] || "hsl(210, 40%, 50%)",
    };
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={granularity === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setGranularity("week")}
        >
          Semanal
        </Button>
        <Button
          variant={granularity === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setGranularity("month")}
        >
          Mensual
        </Button>
      </div>

      {/* Volume bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Nuevos Traspasos por {granularity === "week" ? "Semana" : "Mes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={volumeConfig} className="h-[250px] w-full">
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Cumulative area chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Acumulado de Traspasos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cumulativeConfig} className="h-[250px] w-full">
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                fill="var(--color-cumulative)"
                fillOpacity={0.2}
                stroke="var(--color-cumulative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status breakdown stacked bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Distribución por Estado ({granularity === "week" ? "Semanal" : "Mensual"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="h-[300px] w-full">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {allStatuses.map((s) => (
                <Bar
                  key={s}
                  dataKey={s}
                  stackId="status"
                  fill={`var(--color-${s})`}
                  radius={0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
