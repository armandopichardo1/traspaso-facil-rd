import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SolicitudForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    tipo_usuario: "comprador",
    marca_modelo: "",
    ano: "",
    placa: "",
    plan: "express",
    comentarios: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) {
      toast.error("Nombre y teléfono son requeridos");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        tipo_usuario: form.tipo_usuario,
        marca_modelo: form.marca_modelo.trim() || null,
        ano: form.ano ? parseInt(form.ano) : null,
        placa: form.placa.trim().toUpperCase() || null,
        plan: form.plan,
        comentarios: form.comentarios.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="solicitud" className="py-16 md:py-24 bg-muted/50">
        <div className="container max-w-2xl text-center">
          <div className="bg-teal/10 border border-teal/30 rounded-2xl p-10">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">¡Solicitud recibida!</h2>
            <p className="text-muted-foreground">Te contactamos por WhatsApp en menos de 1 hora.</p>
          </div>
        </div>
      </section>
    );
  }

  const inputClass = "w-full h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <section id="solicitud" className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-2xl">
        <AnimateOnScroll>
          <p className="text-sm font-bold text-cta uppercase tracking-widest mb-2">Inicia Tu Traspaso</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-2">
            Completa estos datos y te contactamos en menos de 1 hora
          </h2>
          <p className="text-muted-foreground mb-8">Todos los campos marcados son requeridos.</p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-5">
            <div>
              <label className={labelClass}>Nombre completo *</label>
              <input type="text" value={form.nombre} onChange={(e) => update("nombre", e.target.value)} className={inputClass} maxLength={200} required />
            </div>

            <div>
              <label className={labelClass}>Teléfono / WhatsApp *</label>
              <input type="tel" value={form.telefono} onChange={(e) => update("telefono", e.target.value)} className={inputClass} maxLength={30} required />
            </div>

            <div>
              <label className={labelClass}>¿Eres comprador o vendedor?</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { value: "comprador", label: "Comprador" },
                  { value: "vendedor", label: "Vendedor" },
                  { value: "concesionario", label: "Concesionario" },
                  { value: "gestor", label: "Gestor" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${form.tipo_usuario === opt.value ? "border-teal bg-teal/10 text-foreground font-medium" : "border-input text-muted-foreground hover:border-teal/50"}`}>
                    <input type="radio" name="tipo_usuario" value={opt.value} checked={form.tipo_usuario === opt.value} onChange={(e) => update("tipo_usuario", e.target.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Marca y modelo</label>
                <input type="text" value={form.marca_modelo} onChange={(e) => update("marca_modelo", e.target.value)} className={inputClass} placeholder="Ej: Toyota Corolla" maxLength={100} />
              </div>
              <div>
                <label className={labelClass}>Año del vehículo</label>
                <input type="number" value={form.ano} onChange={(e) => update("ano", e.target.value)} className={inputClass} placeholder="Ej: 2020" min={1950} max={2027} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Número de placa</label>
              <input type="text" value={form.placa} onChange={(e) => update("placa", e.target.value.toUpperCase())} className={inputClass} placeholder="Ej: A123456" maxLength={15} />
            </div>

            <div>
              <label className={labelClass}>¿Qué plan te interesa?</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { value: "historial", label: "Historial RD$350" },
                  { value: "basico", label: "Básico RD$3,500" },
                  { value: "express", label: "Express RD$5,000" },
                  { value: "dealer", label: "Plan Dealer" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${form.plan === opt.value ? "border-cta bg-cta/10 text-foreground font-medium" : "border-input text-muted-foreground hover:border-cta/50"}`}>
                    <input type="radio" name="plan" value={opt.value} checked={form.plan === opt.value} onChange={(e) => update("plan", e.target.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Comentarios (opcional)</label>
              <textarea value={form.comentarios} onChange={(e) => update("comentarios", e.target.value)} className={`${inputClass} h-24 py-3 resize-none`} maxLength={2000} />
            </div>

            <Button variant="cta" size="xl" type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitud →"}
            </Button>
          </form>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default SolicitudForm;
