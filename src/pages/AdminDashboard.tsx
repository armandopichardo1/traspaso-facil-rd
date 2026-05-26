import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LogOut,
  RefreshCw,
  Car,
  FileText,
  Users,
  ArrowRight,
  UserCog,
  Clock,
  BarChart3,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Bell,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Session } from "@supabase/supabase-js";
import LeadFilters from "@/components/admin/LeadFilters";
import ConsultaFilters from "@/components/admin/ConsultaFilters";
import SlaConfig from "@/components/admin/SlaConfig";
import MetricsDashboard from "@/components/admin/MetricsDashboard";
import TrendCharts from "@/components/admin/TrendCharts";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---------- Tipos ----------
type Lead = {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  tipo_usuario: string;
  marca_modelo: string | null;
  ano: number | null;
  placa: string | null;
  plan: string | null;
  comentarios: string | null;
  status: string;
};

type Consulta = {
  id: string;
  created_at: string;
  placa: string;
  email: string | null;
  telefono: string | null;
  status: string;
};

type Traspaso = {
  id: string;
  created_at: string;
  updated_at: string;
  codigo: string | null;
  status: string;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  comprador_nombre: string | null;
  antifraude_status: string;
  plan: string;
  gestor_id: string | null;
  notario_id: string | null;
  mensajero_id: string | null;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  cedula: string | null;
  role: string;
};

type SlaRow = { etapa: string; horas_objetivo: number; descripcion: string | null };

const ROLE_LABELS: Record<string, string> = {
  customer: "Cliente",
  gestor: "Gestor",
  notario: "Notario",
  mensajero: "Mensajero",
  admin: "Admin",
};

// Estados terminales/no procesables por SLA
const TERMINAL_STATUSES = new Set(["completado", "cancelado"]);

// Mapa estado → rol responsable (para nudges SLA)
const STATUS_OWNER_ROLE: Record<string, "gestor" | "notario" | "mensajero"> = {
  solicitud_recibida: "gestor",
  documentos_recolectados: "gestor",
  contrato_generado: "notario",
  contrato_firmado: "mensajero",
  matricula_recogida: "mensajero",
  matricula_entregada: "gestor",
  legalizacion_pgr: "gestor",
  plan_piloto: "gestor",
  dgii_proceso: "gestor",
};

// ---------- Skeleton ----------
function TableSkeleton({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "traspasos" | "leads" | "consultas" | "equipo" | "sla" | "metricas" | "tendencias"
  >("traspasos");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { profile: currentProfile } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPlan, setFilterPlan] = useState("todos");

  // Consulta filters
  const [cDateFrom, setCDateFrom] = useState("");
  const [cDateTo, setCDateTo] = useState("");
  const [cFilterStatus, setCFilterStatus] = useState("todos");

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterStatus("todos");
    setFilterPlan("todos");
  };

  const clearConsultaFilters = () => {
    setCDateFrom("");
    setCDateTo("");
    setCFilterStatus("todos");
  };

  // ---------- Auth ----------
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setLoading(false);
      if (!sess) navigate("/admin/login");
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setLoading(false);
      if (!sess) navigate("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ---------- React Query: datasets con refetch en segundo plano ----------
  const traspasosQ = useQuery({
    queryKey: ["admin", "traspasos"],
    enabled: !!session,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspasos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Traspaso[];
    },
  });

  const leadsQ = useQuery({
    queryKey: ["admin", "leads"],
    enabled: !!session,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const consultasQ = useQuery({
    queryKey: ["admin", "consultas"],
    enabled: !!session,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_consultas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Consulta[];
    },
  });

  const profilesQ = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: !!session,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nombre, email, cedula, role")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const slaQ = useQuery({
    queryKey: ["admin", "sla_config"],
    enabled: !!session && tab === "traspasos",
    queryFn: async () => {
      const { data, error } = await supabase.from("sla_config").select("etapa, horas_objetivo, descripcion");
      if (error) throw error;
      return (data ?? []) as SlaRow[];
    },
  });

  const traspasos = traspasosQ.data ?? [];
  const leads = leadsQ.data ?? [];
  const consultas = consultasQ.data ?? [];
  const profiles = profilesQ.data ?? [];

  const fetching =
    traspasosQ.isFetching || leadsQ.isFetching || consultasQ.isFetching || profilesQ.isFetching;

  const refetchActive = () => {
    if (tab === "traspasos") traspasosQ.refetch();
    else if (tab === "leads") leadsQ.refetch();
    else if (tab === "consultas") consultasQ.refetch();
    else if (tab === "equipo") profilesQ.refetch();
  };

  // ---------- Filtros derivados ----------
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(l.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (filterStatus !== "todos" && l.status !== filterStatus) return false;
      if (filterPlan !== "todos" && l.plan !== filterPlan) return false;
      return true;
    });
  }, [leads, dateFrom, dateTo, filterStatus, filterPlan]);

  const filteredConsultas = useMemo(() => {
    return consultas.filter((c) => {
      if (cDateFrom && new Date(c.created_at) < new Date(cDateFrom)) return false;
      if (cDateTo && new Date(c.created_at) > new Date(cDateTo + "T23:59:59")) return false;
      if (cFilterStatus !== "todos" && c.status !== cFilterStatus) return false;
      return true;
    });
  }, [consultas, cDateFrom, cDateTo, cFilterStatus]);

  // ---------- Mutaciones optimistas ----------

  // Cambio de status de lead
  const leadStatusMut = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: string; newStatus: string }) => {
      const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
      if (error) throw error;
    },
    onMutate: async ({ leadId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "leads"] });
      const prev = queryClient.getQueryData<Lead[]>(["admin", "leads"]);
      queryClient.setQueryData<Lead[]>(["admin", "leads"], (old) =>
        (old ?? []).map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin", "leads"], ctx.prev);
      toast.error("Error al actualizar status");
    },
    onSuccess: () => toast.success("Status actualizado"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
  });

  // Cambio de rol de usuario
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    profileId: string;
    name: string;
    oldRole: string;
    newRole: string;
  } | null>(null);

  const requestRoleChange = (profileId: string, newRole: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile || profile.role === newRole) return;
    setPendingRoleChange({
      profileId,
      name: profile.nombre || profile.email || profileId,
      oldRole: profile.role,
      newRole,
    });
  };

  const roleChangeMut = useMutation({
    mutationFn: async ({
      profileId,
      oldRole,
      newRole,
    }: {
      profileId: string;
      oldRole: string;
      newRole: string;
    }) => {
      if (currentProfile?.role !== "admin") {
        throw new Error("No tienes permiso para cambiar roles");
      }
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
      if (error) throw error;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("role_audit_log" as any).insert({
          profile_id: profileId,
          old_role: oldRole,
          new_role: newRole,
          changed_by: user.id,
        });
      }
    },
    onMutate: async ({ profileId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "profiles"] });
      const prev = queryClient.getQueryData<ProfileRow[]>(["admin", "profiles"]);
      queryClient.setQueryData<ProfileRow[]>(["admin", "profiles"], (old) =>
        (old ?? []).map((p) => (p.id === profileId ? { ...p, role: newRole } : p)),
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin", "profiles"], ctx.prev);
      toast.error(err.message || "Error al cambiar rol");
    },
    onSuccess: () => toast.success("Rol actualizado"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] }),
  });

  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    roleChangeMut.mutate(pendingRoleChange);
    setPendingRoleChange(null);
  };

  // Aplicar recomendación de triage IA (antifraude_status)
  const triageApplyMut = useMutation({
    mutationFn: async ({
      traspasoId,
      decision,
      nota,
    }: {
      traspasoId: string;
      decision: "aprobado" | "alerta";
      nota: string;
    }) => {
      const { error } = await supabase
        .from("traspasos")
        .update({ antifraude_status: decision, antifraude_notas: nota })
        .eq("id", traspasoId);
      if (error) throw error;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("traspaso_timeline").insert({
          traspaso_id: traspasoId,
          status: "solicitud_recibida",
          actor_role: "admin",
          created_by: user.id,
          nota: `Triage IA aplicado: ${decision}. ${nota}`,
        });
      }
    },
    onMutate: async ({ traspasoId, decision }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "traspasos"] });
      const prev = queryClient.getQueryData<Traspaso[]>(["admin", "traspasos"]);
      queryClient.setQueryData<Traspaso[]>(["admin", "traspasos"], (old) =>
        (old ?? []).map((t) => (t.id === traspasoId ? { ...t, antifraude_status: decision } : t)),
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin", "traspasos"], ctx.prev);
      toast.error(err.message || "Error al aplicar triage");
    },
    onSuccess: (_d, vars) => toast.success(`Antifraude marcado como ${vars.decision}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "traspasos"] }),
  });

  // Nudge SLA: añade mensaje al chat del traspaso
  const nudgeMut = useMutation({
    mutationFn: async ({
      traspasoId,
      role,
      etapa,
      hoursOver,
    }: {
      traspasoId: string;
      role: string;
      etapa: string;
      hoursOver: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión inválida");
      const mensaje = `⏰ Recordatorio automático: el traspaso lleva ${hoursOver}h en la etapa "${etapa.replace(/_/g, " ")}" (responsable: ${role}). Por favor avanza el próximo paso.`;
      await supabase.from("traspaso_mensajes").insert({
        traspaso_id: traspasoId,
        sender_id: user.id,
        mensaje,
      });
      await supabase.from("traspaso_timeline").insert({
        traspaso_id: traspasoId,
        status: etapa,
        actor_role: "admin",
        created_by: user.id,
        nota: `SLA: nudge enviado al ${role} (${hoursOver}h sobre el objetivo).`,
      });
    },
    onSuccess: () => toast.success("Aviso enviado"),
    onError: (e: any) => toast.error(e.message || "No se pudo enviar el aviso"),
  });

  // ---------- AI Triage: detección y ejecución ----------
  const triageCandidates = useMemo(
    () =>
      traspasos.filter(
        (t) => t.status === "solicitud_recibida" && t.antifraude_status === "pendiente",
      ),
    [traspasos],
  );

  const [triageState, setTriageState] = useState<
    Record<
      string,
      | { loading: true }
      | { loading: false; error: string }
      | {
          loading: false;
          match: boolean;
          confidence: string;
          recomendacion: "aprobado" | "alerta";
          notas: string;
        }
    >
  >({});

  const runTriage = async (traspasoId: string) => {
    setTriageState((s) => ({ ...s, [traspasoId]: { loading: true } }));
    try {
      const { data: docs, error: docsErr } = await supabase
        .from("traspaso_documentos")
        .select("tipo, file_url")
        .eq("traspaso_id", traspasoId);
      if (docsErr) throw docsErr;

      const cedula = docs?.find((d) => d.tipo === "cedula_vendedor");
      const selfie = docs?.find((d) => d.tipo === "selfie_vendedor");

      if (!cedula || !selfie) {
        setTriageState((s) => ({
          ...s,
          [traspasoId]: { loading: false, error: "Faltan cédula o selfie del vendedor" },
        }));
        return;
      }

      const signed = await Promise.all([
        supabase.storage.from("documentos").createSignedUrl(selfie.file_url, 60 * 10),
        supabase.storage.from("documentos").createSignedUrl(cedula.file_url, 60 * 10),
      ]);
      const selfieUrl = signed[0].data?.signedUrl;
      const cedulaUrl = signed[1].data?.signedUrl;
      if (!selfieUrl || !cedulaUrl) throw new Error("No se pudieron firmar las URLs");

      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { selfie_url: selfieUrl, cedula_url: cedulaUrl },
      });
      if (error) throw new Error(error.message);
      const result = (data?.data ?? data) as {
        match?: boolean;
        confidence?: string;
        notas?: string;
      };
      const match = !!result?.match;
      const conf = (result?.confidence ?? "baja").toLowerCase();
      const recomendacion: "aprobado" | "alerta" =
        match && (conf === "alta" || conf === "high") ? "aprobado" : "alerta";

      setTriageState((s) => ({
        ...s,
        [traspasoId]: {
          loading: false,
          match,
          confidence: conf,
          recomendacion,
          notas: result?.notas ?? "",
        },
      }));
    } catch (e: any) {
      setTriageState((s) => ({
        ...s,
        [traspasoId]: { loading: false, error: e.message || "Error al ejecutar triage" },
      }));
    }
  };

  const runTriageAll = async () => {
    for (const t of triageCandidates) {
      // Solo si no se corrió antes
      if (!triageState[t.id]) {
        await runTriage(t.id);
      }
    }
  };

  // ---------- SLA breaches ----------
  const slaMap = useMemo(() => {
    const m: Record<string, number> = {};
    (slaQ.data ?? []).forEach((r) => {
      m[r.etapa] = Number(r.horas_objetivo);
    });
    return m;
  }, [slaQ.data]);

  const slaBreaches = useMemo(() => {
    const now = Date.now();
    return traspasos
      .filter((t) => !TERMINAL_STATUSES.has(t.status))
      .map((t) => {
        const target = slaMap[t.status];
        if (!target) return null;
        const last = new Date(t.updated_at || t.created_at).getTime();
        const hours = (now - last) / 36e5;
        if (hours <= target) return null;
        const role = STATUS_OWNER_ROLE[t.status] ?? "gestor";
        return { t, role, hoursOver: Math.round(hours - target), totalHours: Math.round(hours) };
      })
      .filter(Boolean) as {
      t: Traspaso;
      role: string;
      hoursOver: number;
      totalHours: number;
    }[];
  }, [traspasos, slaMap]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  if (!session) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <a href="/" className="text-lg font-extrabold">
              TRASPASA<span className="text-teal">.DO</span>
            </a>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refetchActive} disabled={fetching}>
              <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Traspasos</p>
            <p className="text-3xl font-extrabold text-foreground">
              {traspasos.length || (traspasosQ.isLoading ? "…" : "—")}
            </p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Leads</p>
            <p className="text-3xl font-extrabold text-foreground">
              {leads.length || (leadsQ.isLoading ? "…" : "—")}
            </p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Historiales</p>
            <p className="text-3xl font-extrabold text-foreground">
              {consultas.length || (consultasQ.isLoading ? "…" : "—")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(
            [
              { k: "traspasos", icon: Car, label: "Traspasos" },
              { k: "leads", icon: Users, label: "Leads" },
              { k: "consultas", icon: FileText, label: "Historiales" },
              { k: "equipo", icon: UserCog, label: "Equipo" },
              { k: "sla", icon: Clock, label: "SLAs" },
              { k: "metricas", icon: BarChart3, label: "Métricas" },
              { k: "tendencias", icon: TrendingUp, label: "Tendencias" },
            ] as const
          ).map(({ k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 inline mr-1" /> {label}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/historiales")}
            className="ml-auto"
          >
            Gestionar Historiales →
          </Button>
        </div>

        {/* ---------- Paneles de agentes (solo tab traspasos) ---------- */}
        {tab === "traspasos" && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* AI Triage */}
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal" />
                  <h3 className="font-semibold text-sm">Triage IA — Solicitudes nuevas</h3>
                </div>
                <Button
                  size="sm"
                  variant="teal"
                  disabled={triageCandidates.length === 0}
                  onClick={runTriageAll}
                >
                  Escanear {triageCandidates.length || ""}
                </Button>
              </div>
              {triageCandidates.length === 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" /> No hay solicitudes pendientes de
                  triage.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {triageCandidates.map((t) => {
                    const r = triageState[t.id];
                    return (
                      <div
                        key={t.id}
                        className="rounded-lg bg-card border border-border p-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-foreground">{t.codigo ?? t.id.slice(0, 8)}</span>
                          <span className="text-muted-foreground">
                            {t.vehiculo_marca} {t.vehiculo_modelo}
                          </span>
                        </div>
                        {!r && (
                          <Button size="sm" variant="outline" className="h-7 w-full" onClick={() => runTriage(t.id)}>
                            Ejecutar triage IA
                          </Button>
                        )}
                        {r && "loading" in r && r.loading && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Analizando rostro…
                          </p>
                        )}
                        {r && !("recomendacion" in r) && !r.loading && "error" in r && (
                          <p className="text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {r.error}
                          </p>
                        )}
                        {r && "recomendacion" in r && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  r.recomendacion === "aprobado"
                                    ? "bg-success/15 text-success"
                                    : "bg-warning/15 text-warning"
                                }
                              >
                                Recomendación: {r.recomendacion}
                              </Badge>
                              <span className="text-muted-foreground">
                                conf: {r.confidence} · match: {r.match ? "sí" : "no"}
                              </span>
                            </div>
                            {r.notas && (
                              <p className="text-muted-foreground italic line-clamp-2">{r.notas}</p>
                            )}
                            <div className="flex gap-1 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] flex-1"
                                onClick={() =>
                                  triageApplyMut.mutate({
                                    traspasoId: t.id,
                                    decision: "aprobado",
                                    nota: `Confianza ${r.confidence}, match=${r.match}. ${r.notas}`,
                                  })
                                }
                              >
                                Aplicar aprobado
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] flex-1"
                                onClick={() =>
                                  triageApplyMut.mutate({
                                    traspasoId: t.id,
                                    decision: "alerta",
                                    nota: `Confianza ${r.confidence}, match=${r.match}. ${r.notas}`,
                                  })
                                }
                              >
                                Marcar alerta
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SLA Breach Agent */}
            <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <h3 className="font-semibold text-sm">Agente SLA — Avisos automáticos</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {slaBreaches.length} fuera de SLA
                </Badge>
              </div>
              {slaBreaches.length === 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" /> Todo dentro del SLA.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {slaBreaches.map(({ t, role, hoursOver, totalHours }) => (
                    <div
                      key={t.id}
                      className="rounded-lg bg-card border border-border p-2 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono">{t.codigo ?? t.id.slice(0, 8)}</div>
                        <div className="text-muted-foreground truncate">
                          {t.status.replace(/_/g, " ")} · {role} · +{hoursOver}h ({totalHours}h totales)
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0"
                        disabled={nudgeMut.isPending}
                        onClick={() =>
                          nudgeMut.mutate({
                            traspasoId: t.id,
                            role,
                            etapa: t.status,
                            hoursOver,
                          })
                        }
                      >
                        <Bell className="h-3 w-3 mr-1" /> Avisar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "leads" && (
          <LeadFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            status={filterStatus}
            plan={filterPlan}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onStatusChange={setFilterStatus}
            onPlanChange={setFilterPlan}
            onClear={clearFilters}
          />
        )}

        {tab === "consultas" && (
          <ConsultaFilters
            dateFrom={cDateFrom}
            dateTo={cDateTo}
            status={cFilterStatus}
            onDateFromChange={setCDateFrom}
            onDateToChange={setCDateTo}
            onStatusChange={setCFilterStatus}
            onClear={clearConsultaFilters}
          />
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {tab === "traspasos" ? (
              traspasosQ.isLoading ? (
                <TableSkeleton cols={9} />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-left">
                    <tr>
                      <th className="p-3 font-medium">Fecha</th>
                      <th className="p-3 font-medium">Código</th>
                      <th className="p-3 font-medium">Vehículo</th>
                      <th className="p-3 font-medium">Placa</th>
                      <th className="p-3 font-medium">Comprador</th>
                      <th className="p-3 font-medium">Plan</th>
                      <th className="p-3 font-medium">Antifraude</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {traspasos.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          No hay traspasos
                        </td>
                      </tr>
                    ) : (
                      traspasos.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/admin/traspaso/${t.id}`)}
                        >
                          <td className="p-3 whitespace-nowrap">{formatDate(t.created_at)}</td>
                          <td className="p-3 font-mono text-xs">{t.codigo || "—"}</td>
                          <td className="p-3">
                            {t.vehiculo_marca} {t.vehiculo_modelo}
                          </td>
                          <td className="p-3 font-mono">{t.vehiculo_placa || "—"}</td>
                          <td className="p-3">{t.comprador_nombre || "—"}</td>
                          <td className="p-3 capitalize">{t.plan}</td>
                          <td className="p-3">
                            <Badge
                              variant="secondary"
                              className={
                                t.antifraude_status === "aprobado"
                                  ? "bg-success/15 text-success"
                                  : t.antifraude_status === "alerta"
                                    ? "bg-warning/15 text-warning"
                                    : t.antifraude_status === "rechazado"
                                      ? "bg-destructive/15 text-destructive"
                                      : "bg-teal/15 text-teal"
                              }
                            >
                              {t.antifraude_status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="secondary"
                              className={
                                t.status === "completado"
                                  ? "bg-success/15 text-success"
                                  : t.status === "cancelado"
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-teal/15 text-teal"
                              }
                            >
                              {t.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            ) : tab === "leads" ? (
              leadsQ.isLoading ? (
                <TableSkeleton cols={8} />
              ) : (
                <>
                  {filteredLeads.length !== leads.length && (
                    <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
                      Mostrando {filteredLeads.length} de {leads.length} leads
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground text-left">
                      <tr>
                        <th className="p-3 font-medium">Fecha</th>
                        <th className="p-3 font-medium">Nombre</th>
                        <th className="p-3 font-medium">Teléfono</th>
                        <th className="p-3 font-medium">Tipo</th>
                        <th className="p-3 font-medium">Vehículo</th>
                        <th className="p-3 font-medium">Placa</th>
                        <th className="p-3 font-medium">Plan</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            No hay leads con estos filtros
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((l) => (
                          <tr key={l.id} className="hover:bg-muted/30">
                            <td className="p-3 whitespace-nowrap">{formatDate(l.created_at)}</td>
                            <td className="p-3 font-medium text-foreground">{l.nombre}</td>
                            <td className="p-3">
                              <a
                                href={`https://wa.me/${l.telefono.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal hover:underline"
                              >
                                {l.telefono}
                              </a>
                            </td>
                            <td className="p-3 capitalize">{l.tipo_usuario}</td>
                            <td className="p-3">
                              {l.marca_modelo || "—"} {l.ano || ""}
                            </td>
                            <td className="p-3 font-mono">{l.placa || "—"}</td>
                            <td className="p-3 capitalize">{l.plan || "—"}</td>
                            <td className="p-3">
                              <Select
                                value={l.status}
                                onValueChange={(v) =>
                                  leadStatusMut.mutate({ leadId: l.id, newStatus: v })
                                }
                              >
                                <SelectTrigger
                                  className={`h-7 w-[130px] text-xs font-medium border-0 ${
                                    l.status === "nuevo"
                                      ? "bg-teal/10 text-teal"
                                      : l.status === "contactado"
                                        ? "bg-teal/10 text-teal"
                                        : l.status === "en_proceso"
                                          ? "bg-cta/10 text-cta"
                                          : l.status === "completado"
                                            ? "bg-success/10 text-success"
                                            : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nuevo">Nuevo</SelectItem>
                                  <SelectItem value="contactado">Contactado</SelectItem>
                                  <SelectItem value="en_proceso">En proceso</SelectItem>
                                  <SelectItem value="completado">Completado</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )
            ) : tab === "consultas" ? (
              consultasQ.isLoading ? (
                <TableSkeleton cols={5} />
              ) : (
                <>
                  {filteredConsultas.length !== consultas.length && (
                    <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
                      Mostrando {filteredConsultas.length} de {consultas.length} consultas
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground text-left">
                      <tr>
                        <th className="p-3 font-medium">Fecha</th>
                        <th className="p-3 font-medium">Placa</th>
                        <th className="p-3 font-medium">Teléfono</th>
                        <th className="p-3 font-medium">Email</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredConsultas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No hay consultas con estos filtros
                          </td>
                        </tr>
                      ) : (
                        filteredConsultas.map((c) => (
                          <tr key={c.id} className="hover:bg-muted/30">
                            <td className="p-3 whitespace-nowrap">{formatDate(c.created_at)}</td>
                            <td className="p-3 font-mono font-medium text-foreground">{c.placa}</td>
                            <td className="p-3">
                              {c.telefono ? (
                                <a
                                  href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal hover:underline"
                                >
                                  {c.telefono}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-3">{c.email || "—"}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  c.status === "pendiente"
                                    ? "bg-cta/10 text-cta"
                                    : "bg-teal/10 text-teal"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )
            ) : tab === "equipo" ? (
              profilesQ.isLoading ? (
                <TableSkeleton cols={4} />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 px-3 pt-3">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "customer", label: "Cliente" },
                      { value: "gestor", label: "Gestor" },
                      { value: "notario", label: "Notario" },
                      { value: "mensajero", label: "Mensajero" },
                      { value: "admin", label: "Admin" },
                    ].map((r) => (
                      <Button
                        key={r.value}
                        size="sm"
                        variant={roleFilter === r.value ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setRoleFilter(r.value)}
                      >
                        {r.label}
                        {r.value !== "all" && (
                          <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                            {profiles.filter((p) => p.role === r.value).length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground text-left">
                      <tr>
                        <th className="p-3 font-medium">Nombre</th>
                        <th className="p-3 font-medium">Email</th>
                        <th className="p-3 font-medium">Cédula</th>
                        <th className="p-3 font-medium">Rol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {profiles.filter((p) => roleFilter === "all" || p.role === roleFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            No hay perfiles con este rol
                          </td>
                        </tr>
                      ) : (
                        profiles
                          .filter((p) => roleFilter === "all" || p.role === roleFilter)
                          .map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30">
                              <td className="p-3 font-medium text-foreground">{p.nombre || "—"}</td>
                              <td className="p-3">{p.email || "—"}</td>
                              <td className="p-3 font-mono">{p.cedula || "—"}</td>
                              <td className="p-3">
                                <Select
                                  value={p.role}
                                  onValueChange={(v) => requestRoleChange(p.id, v)}
                                >
                                  <SelectTrigger className="h-7 w-[140px] text-xs font-medium">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="customer">Cliente</SelectItem>
                                    <SelectItem value="gestor">Gestor</SelectItem>
                                    <SelectItem value="notario">Notario</SelectItem>
                                    <SelectItem value="mensajero">Mensajero</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )
            ) : tab === "sla" ? (
              <div className="p-4">
                <SlaConfig />
              </div>
            ) : tab === "metricas" ? (
              <MetricsDashboard />
            ) : tab === "tendencias" ? (
              <TrendCharts />
            ) : null}
          </div>
        </div>
      </div>
      <AlertDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rol de usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cambiar el rol de <strong>{pendingRoleChange?.name}</strong> de{" "}
              <Badge variant="outline" className="mx-1">
                {ROLE_LABELS[pendingRoleChange?.oldRole || ""]}
              </Badge>{" "}
              a{" "}
              <Badge className="mx-1 bg-primary">
                {ROLE_LABELS[pendingRoleChange?.newRole || ""]}
              </Badge>
              . Esta acción afectará los permisos del usuario de inmediato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirmar cambio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
