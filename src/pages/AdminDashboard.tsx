import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, RefreshCw, Car, FileText, Users, ArrowRight, UserCog, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@supabase/supabase-js";
import LeadFilters from "@/components/admin/LeadFilters";
import ConsultaFilters from "@/components/admin/ConsultaFilters";
import SlaConfig from "@/components/admin/SlaConfig";

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
  codigo: string | null;
  status: string;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  comprador_nombre: string | null;
  antifraude_status: string;
  plan: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  cedula: string | null;
  role: string;
};

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"traspasos" | "leads" | "consultas" | "equipo" | "sla">("traspasos");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, tab]);

  const fetchData = async () => {
    setFetching(true);
    try {
      if (tab === "traspasos") {
        const { data, error } = await supabase.from("traspasos").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setTraspasos(data || []);
      } else if (tab === "leads") {
        const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setLeads(data || []);
      } else if (tab === "equipo") {
        const { data, error } = await supabase.from("profiles").select("id, nombre, email, cedula, role").order("created_at", { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      } else {
        const { data, error } = await supabase.from("historial_consultas").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setConsultas(data || []);
      }
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setFetching(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: string) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
    if (error) {
      toast.error("Error al cambiar rol");
      return;
    }
    setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, role: newRole } : p));
    toast.success("Rol actualizado");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      toast.error("Error al actualizar status");
      return;
    }
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    toast.success("Status actualizado");
  };

  if (loading) return <div className="min-h-screen bg-muted flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!session) return null;

  const formatDate = (d: string) => new Date(d).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <a href="/" className="text-lg font-extrabold">
              TRASPASA<span className="text-teal">.DO</span>
            </a>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={fetching}>
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
            <p className="text-3xl font-extrabold text-foreground">{traspasos.length || "—"}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Leads</p>
            <p className="text-3xl font-extrabold text-foreground">{leads.length || "—"}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Historiales</p>
            <p className="text-3xl font-extrabold text-foreground">{consultas.length || "—"}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("traspasos")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "traspasos" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            <Car className="h-3.5 w-3.5 inline mr-1" /> Traspasos
          </button>
          <button
            onClick={() => setTab("leads")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "leads" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            <Users className="h-3.5 w-3.5 inline mr-1" /> Leads
          </button>
          <button
            onClick={() => setTab("consultas")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "consultas" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            <FileText className="h-3.5 w-3.5 inline mr-1" /> Historiales
          </button>
          <button
            onClick={() => setTab("equipo")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "equipo" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            <UserCog className="h-3.5 w-3.5 inline mr-1" /> Equipo
          </button>
          <button
            onClick={() => setTab("sla")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "sla" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            <Clock className="h-3.5 w-3.5 inline mr-1" /> SLAs
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/historiales")} className="ml-auto">
            Gestionar Historiales →
          </Button>
        </div>

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
                    <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No hay traspasos</td></tr>
                  ) : traspasos.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/traspaso/${t.id}`)}>
                      <td className="p-3 whitespace-nowrap">{formatDate(t.created_at)}</td>
                      <td className="p-3 font-mono text-xs">{t.codigo || "—"}</td>
                      <td className="p-3">{t.vehiculo_marca} {t.vehiculo_modelo}</td>
                      <td className="p-3 font-mono">{t.vehiculo_placa || "—"}</td>
                      <td className="p-3">{t.comprador_nombre || "—"}</td>
                      <td className="p-3 capitalize">{t.plan}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={
                          t.antifraude_status === "aprobado" ? "bg-green-100 text-green-800" :
                          t.antifraude_status === "alerta" ? "bg-amber-100 text-amber-800" :
                          t.antifraude_status === "rechazado" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }>{t.antifraude_status}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={
                          t.status === "completado" ? "bg-green-100 text-green-800" :
                          t.status === "cancelado" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }>{t.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="p-3"><ArrowRight className="h-4 w-4 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === "leads" ? (
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
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No hay leads con estos filtros</td></tr>
                    ) : filteredLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{formatDate(l.created_at)}</td>
                        <td className="p-3 font-medium text-foreground">{l.nombre}</td>
                        <td className="p-3">
                          <a href={`https://wa.me/${l.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                            {l.telefono}
                          </a>
                        </td>
                        <td className="p-3 capitalize">{l.tipo_usuario}</td>
                        <td className="p-3">{l.marca_modelo || "—"} {l.ano || ""}</td>
                        <td className="p-3 font-mono">{l.placa || "—"}</td>
                        <td className="p-3 capitalize">{l.plan || "—"}</td>
                        <td className="p-3">
                          <Select value={l.status} onValueChange={(v) => handleStatusChange(l.id, v)}>
                            <SelectTrigger className={`h-7 w-[130px] text-xs font-medium border-0 ${
                              l.status === "nuevo" ? "bg-teal/10 text-teal" :
                              l.status === "contactado" ? "bg-blue-500/10 text-blue-600" :
                              l.status === "en_proceso" ? "bg-cta/10 text-cta" :
                              l.status === "completado" ? "bg-green-500/10 text-green-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
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
                    ))}
                  </tbody>
                </table>
              </>
            ) : tab === "consultas" ? (
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
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay consultas con estos filtros</td></tr>
                    ) : filteredConsultas.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{formatDate(c.created_at)}</td>
                        <td className="p-3 font-mono font-medium text-foreground">{c.placa}</td>
                        <td className="p-3">
                          {c.telefono ? (
                            <a href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                              {c.telefono}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="p-3">{c.email || "—"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === "pendiente" ? "bg-cta/10 text-cta" : "bg-teal/10 text-teal"}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : tab === "equipo" ? (
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
                  {profiles.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay perfiles</td></tr>
                  ) : profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground">{p.nombre || "—"}</td>
                      <td className="p-3">{p.email || "—"}</td>
                      <td className="p-3 font-mono">{p.cedula || "—"}</td>
                      <td className="p-3">
                        <Select value={p.role} onValueChange={(v) => handleRoleChange(p.id, v)}>
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
                  ))}
                </tbody>
              </table>
            ) : tab === "sla" ? (
              <div className="p-4">
                <SlaConfig />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
