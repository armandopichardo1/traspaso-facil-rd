import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Search, Users, AlertTriangle, DollarSign, Tag, FileText, Siren, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const reportItems = [
  { icon: Users, label: "Historial de Propietarios" },
  { icon: AlertTriangle, label: "Oposiciones y Alertas (robo, embargo, prenda)" },
  { icon: DollarSign, label: "Valor Fidedigno DGII" },
  { icon: Tag, label: "Estado del Marbete" },
  { icon: FileText, label: "Traspasos Anteriores" },
  { icon: Siren, label: "Multas Pendientes" },
];

const HistorialSection = () => {
  const [placa, setPlaca] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !telefono.trim()) {
      toast.error("Por favor ingresa la placa y tu teléfono/WhatsApp");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("historial_consultas").insert({
        placa: placa.trim().toUpperCase(),
        telefono: telefono.trim(),
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="historial" className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-4xl">
        <AnimateOnScroll>
          <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Producto Estrella</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-2">
            Conoce TODO sobre un vehículo antes de comprar
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            El informe más completo de República Dominicana. Solo ingresa la placa.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          {submitted ? (
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-8 text-center mb-10">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <Search className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">¡Consulta recibida!</h3>
              <p className="text-muted-foreground">
                Te enviamos el informe por WhatsApp en menos de 30 minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-10">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Número de placa (ej: A123456)"
                    className="w-full pl-9 pr-3 h-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={10}
                  />
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Tu WhatsApp"
                  className="sm:w-48 h-12 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="teal" size="lg" type="submit" disabled={loading} className="shrink-0">
                  {loading ? "Enviando..." : "Obtener Informe — RD$350"}
                </Button>
              </div>
            </form>
          )}
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {reportItems.map((item, i) => (
            <AnimateOnScroll key={item.label} delay={i * 50}>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={300}>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 text-cta fill-cta" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "Iba a comprar un carro que tenía una oposición por robo. Gracias al historial de TRASPASA.DO no perdí mi dinero."
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">Carlos M.</p>
                <p className="text-xs text-muted-foreground">Cliente verificado · Santo Domingo</p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default HistorialSection;
