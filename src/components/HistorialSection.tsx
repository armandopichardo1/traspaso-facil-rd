import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Search, Users, AlertTriangle, DollarSign, Tag, FileText, Siren, Star, CheckCircle2, Loader2, ShieldX } from "lucide-react";
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

interface PrecheckResult {
  valid: boolean;
  formatted: string;
  province: string;
  vehicleType: string;
  message: string;
}

const genTrackingCode = () => {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HC-${Date.now().toString().slice(-4)}${r}`;
};

const HistorialSection = () => {
  const [placa, setPlaca] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reconciled, setReconciled] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [precheck, setPrecheck] = useState<PrecheckResult | null>(null);
  const [precheckLoading, setPrecheckLoading] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // Debounced placa precheck
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const clean = placa.trim();
    if (clean.length < 4) {
      setPrecheck(null);
      return;
    }
    setPrecheckLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("placa-precheck", {
          body: { placa: clean },
        });
        if (error) throw error;
        setPrecheck(data as PrecheckResult);
      } catch {
        setPrecheck(null);
      } finally {
        setPrecheckLoading(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [placa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const placaClean = placa.trim().toUpperCase();
    const telClean = telefono.trim();
    if (!placaClean || !telClean) {
      toast.error("Por favor ingresa la placa y tu teléfono/WhatsApp");
      return;
    }

    // Optimistic: render success card immediately with skeleton state + tracking code.
    const code = genTrackingCode();
    setTrackingCode(code);
    setSubmitted(true);
    setReconciled(false);

    // Snapshot to restore on failure
    const snapshot = { placa, telefono };

    try {
      const { error } = await supabase.from("historial_consultas").insert({
        placa: precheck?.formatted || placaClean,
        telefono: telClean,
      });
      if (error) throw error;
      setReconciled(true);
      // Clear inputs on confirmed success
      setPlaca("");
      setTelefono("");
      setPrecheck(null);
    } catch {
      // Roll back: restore inputs and surface error
      setSubmitted(false);
      setReconciled(false);
      setTrackingCode("");
      setPlaca(snapshot.placa);
      setTelefono(snapshot.telefono);
      toast.error("No pudimos enviar tu consulta. Intenta de nuevo.");
    }
  };

  return (
    <section id="historial" className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-4xl">
        <AnimateOnScroll>
          <p className="text-[11px] font-semibold text-gold uppercase tracking-[0.18em] mb-3">Producto Estrella</p>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Conoce TODO sobre un vehículo antes de comprar
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            El informe más completo de República Dominicana. Solo ingresa la placa.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          {submitted ? (
            <div className="bg-success/10 border border-success/30 rounded-2xl p-8 text-center mb-10">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                {reconciled ? (
                  <CheckCircle2 className="h-7 w-7 text-success" />
                ) : (
                  <Loader2 className="h-7 w-7 text-success animate-spin" />
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {reconciled ? "¡Consulta recibida!" : "Estamos procesando tu consulta"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {reconciled
                  ? "Te enviamos el informe por WhatsApp en menos de 30 minutos."
                  : "Estamos registrando tu solicitud. No cierres esta pantalla."}
              </p>

              {!reconciled && (
                <div className="max-w-sm mx-auto space-y-2 mb-4">
                  <div className="h-3 rounded-full bg-success/15 animate-pulse" />
                  <div className="h-3 rounded-full bg-success/15 animate-pulse w-5/6 mx-auto" />
                  <div className="h-3 rounded-full bg-success/15 animate-pulse w-2/3 mx-auto" />
                </div>
              )}

              <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Código</span>
                <span className="text-sm font-mono font-bold text-foreground">{trackingCode}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-10">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Número de placa (ej: A123456)"
                    className="w-full pl-9 pr-3 h-12 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={10}
                  />
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Tu WhatsApp"
                  className="sm:w-48 h-12 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="teal" size="lg" type="submit" className="shrink-0">
                  Obtener Informe — RD$350
                </Button>
              </div>

              {/* Inline placa precheck */}
              {(precheckLoading || precheck) && (
                <div className="mt-3 min-h-[1.75rem] flex items-center">
                  {precheckLoading ? (
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verificando placa…
                    </span>
                  ) : precheck?.valid ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-success bg-success/10 border border-success/30 rounded-full px-3 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Placa {precheck.formatted} · {precheck.province}
                      {precheck.vehicleType ? ` · ${precheck.vehicleType}` : ""}
                    </span>
                  ) : precheck ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 rounded-full px-3 py-1">
                      <ShieldX className="h-3.5 w-3.5" />
                      {precheck.message}
                    </span>
                  ) : null}
                </div>
              )}
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
