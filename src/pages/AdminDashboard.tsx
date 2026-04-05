import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, RefreshCw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

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

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leads" | "consultas">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

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
      if (tab === "leads") {
        const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setLeads(data || []);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) return <div className="min-h-screen bg-muted flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!session) return null;

  const formatDate = (d: string) => new Date(d).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
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
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-3xl font-extrabold text-foreground">{leads.length || "—"}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Consultas Historial</p>
            <p className="text-3xl font-extrabold text-foreground">{consultas.length || "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("leads")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "leads" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            Leads de Traspaso
          </button>
          <button
            onClick={() => setTab("consultas")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "consultas" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}
          >
            Consultas Historial
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {tab === "leads" ? (
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
                  {leads.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No hay leads aún</td></tr>
                  ) : leads.map((l) => (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.status === "nuevo" ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
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
                  {consultas.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay consultas aún</td></tr>
                  ) : consultas.map((c) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
