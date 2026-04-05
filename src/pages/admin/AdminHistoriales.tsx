import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Clock, FileText, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminHistoriales() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Result form state
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [color, setColor] = useState("");
  const [propietarios, setPropietarios] = useState("");
  const [oposiciones, setOposiciones] = useState("");
  const [valorDgii, setValorDgii] = useState("");
  const [marbete, setMarbete] = useState("");
  const [traspasosAnteriores, setTraspasosAnteriores] = useState("");
  const [multas, setMultas] = useState("");

  const { data: consultas, isLoading } = useQuery({
    queryKey: ["admin-historiales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_consultas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completeConsulta = useMutation({
    mutationFn: async (consultaId: string) => {
      const resultado = {
        marca, modelo, ano, color,
        propietarios: propietarios || null,
        oposiciones: oposiciones || null,
        valor_dgii: valorDgii ? parseFloat(valorDgii) : null,
        marbete: marbete || null,
        traspasos_anteriores: traspasosAnteriores || null,
        multas: multas || null,
      };

      const { error } = await supabase
        .from("historial_consultas")
        .update({ resultado: resultado as any, status: "completado" })
        .eq("id", consultaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-historiales"] });
      setSelectedId(null);
      resetForm();
      toast({ title: "Historial completado ✅" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setMarca(""); setModelo(""); setAno(""); setColor("");
    setPropietarios(""); setOposiciones(""); setValorDgii("");
    setMarbete(""); setTraspasosAnteriores(""); setMultas("");
  };

  const pendientes = consultas?.filter((c: any) => c.status === "pendiente") || [];
  const completadas = consultas?.filter((c: any) => c.status === "completado") || [];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-4">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Admin
          </button>
          <span className="text-sm font-bold">Gestión de Historiales</span>
        </div>
      </header>

      <div className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-3xl font-bold text-cta">{pendientes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-3xl font-bold text-green-600">{completadas.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending queue */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Cola de Pendientes
        </h2>
        {pendientes.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6 text-center text-muted-foreground">
              No hay consultas pendientes 🎉
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 mb-6">
            {pendientes.map((c: any) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold">{c.placa}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("es-DO")}
                      {c.email && ` · ${c.email}`}
                      {c.telefono && ` · ${c.telefono}`}
                    </p>
                  </div>
                  <Dialog
                    open={selectedId === c.id}
                    onOpenChange={(open) => {
                      if (open) setSelectedId(c.id);
                      else { setSelectedId(null); resetForm(); }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="cta" size="sm">Procesar</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Procesar Historial: {c.placa}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs">Marca</Label><Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Toyota" /></div>
                          <div><Label className="text-xs">Modelo</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Corolla" /></div>
                          <div><Label className="text-xs">Año</Label><Input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2020" /></div>
                          <div><Label className="text-xs">Color</Label><Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Blanco" /></div>
                        </div>
                        <div>
                          <Label className="text-xs">Historial de Propietarios</Label>
                          <Textarea value={propietarios} onChange={(e) => setPropietarios(e.target.value)} rows={2} placeholder="Detalles de propietarios..." />
                        </div>
                        <div>
                          <Label className="text-xs">Oposiciones y Alertas</Label>
                          <Textarea value={oposiciones} onChange={(e) => setOposiciones(e.target.value)} rows={2} placeholder="Dejar vacío si no hay oposiciones" className="border-red-200 focus:border-red-400" />
                        </div>
                        <div>
                          <Label className="text-xs">Valor DGII (RD$)</Label>
                          <Input type="number" value={valorDgii} onChange={(e) => setValorDgii(e.target.value)} placeholder="450000" />
                        </div>
                        <div>
                          <Label className="text-xs">Estado del Marbete</Label>
                          <Input value={marbete} onChange={(e) => setMarbete(e.target.value)} placeholder="Vigente hasta 12/2025" />
                        </div>
                        <div>
                          <Label className="text-xs">Traspasos Anteriores</Label>
                          <Textarea value={traspasosAnteriores} onChange={(e) => setTraspasosAnteriores(e.target.value)} rows={2} />
                        </div>
                        <div>
                          <Label className="text-xs">Multas Pendientes</Label>
                          <Textarea value={multas} onChange={(e) => setMultas(e.target.value)} rows={2} placeholder="Sin multas pendientes" />
                        </div>
                        <Button
                          variant="cta"
                          className="w-full"
                          onClick={() => completeConsulta.mutate(c.id)}
                          disabled={completeConsulta.isPending || !marca || !modelo}
                        >
                          {completeConsulta.isPending ? "Guardando..." : "Completar y Publicar Resultado ✅"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Completed */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Completadas Recientes
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-left">
                <tr>
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Placa</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {completadas.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Sin historial completado aún</td></tr>
                ) : completadas.slice(0, 20).map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap">{new Date(c.created_at).toLocaleString("es-DO", { dateStyle: "short" })}</td>
                    <td className="p-3 font-mono font-medium">{c.placa}</td>
                    <td className="p-3">
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completado
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
