import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Historial Vehicular",
    price: "RD$350",
    desc: "Informe completo al instante",
    features: ["Propietarios", "Oposiciones", "Valor DGII", "Marbete", "Multas", "Traspasos previos"],
    cta: "Consultar Ahora",
    href: "#historial",
    variant: "teal" as const,
    highlight: false,
  },
  {
    name: "Plan Básico",
    price: "RD$3,500",
    desc: "Traspaso completo en 2-3 días",
    features: ["Contrato digital + notaría", "Recogida matrícula con seguro", "Gestión completa DGII", "GPS tracking", "Entrega a domicilio", "Sistema antifraude"],
    cta: "Solicitar Plan Básico",
    href: "#solicitud",
    variant: "default" as const,
    highlight: false,
  },
  {
    name: "Plan Express",
    price: "RD$5,000",
    desc: "Tu traspaso en 24 horas",
    features: ["Todo lo del Básico", "Prioridad absoluta", "Procesamiento 24h", "Mensajero dedicado", "Pago Seguro incluido"],
    cta: "Solicitar Plan Express",
    href: "#solicitud",
    variant: "cta" as const,
    highlight: true,
    badge: "⚡ MÁS POPULAR",
  },
];

const PricingSection = () => (
  <section id="precios" className="py-16 md:py-24 bg-muted/50">
    <div className="container max-w-5xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Planes y Precios</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-10">
          Más barato, más rápido y más seguro que un gestor
        </h2>
      </AnimateOnScroll>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan, i) => (
          <AnimateOnScroll key={plan.name} delay={i * 100}>
            <div className={`bg-card rounded-2xl p-6 border shadow-sm h-full flex flex-col ${plan.highlight ? "border-cta border-2 relative" : "border-border"}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cta text-cta-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-foreground mb-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mb-5">{plan.desc}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="text-teal shrink-0" size={16} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.variant} className="w-full" asChild>
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll>
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>¿Eres concesionario? Planes desde RD$15,000/mes → <a href="#dealers" className="text-teal font-medium hover:underline">Contáctanos</a></p>
          <p>¿Eres gestor? Únete a nuestra red de aliados y gana más → <a href="#gestores" className="text-teal font-medium hover:underline">Contáctanos</a></p>
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default PricingSection;
