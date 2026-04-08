import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { ClipboardList, ShieldAlert, AlertTriangle, AlertOctagon } from "lucide-react";

const painCards = [
  {
    icon: ClipboardList,
    title: "6 pasos, 3 instituciones, 1-3 días perdidos",
    desc: "Notaría, PGR, Plan Piloto, banco, DGII... un proceso diseñado para hacerte perder tiempo",
  },
  {
    icon: ShieldAlert,
    title: "Tu matrícula en manos de extraños",
    desc: "Entregas tu documento original e irremplazable a alguien sin garantías, sin seguro y sin tracking",
  },
  {
    icon: AlertTriangle,
    title: "Riesgo de fraude y estafa",
    desc: "Vehículos con oposiciones, robos no declarados, doble traspasos. Sin verificación, estás a ciegas",
  },
];

const ProblemaSection = () => (
  <section className="py-16 md:py-24 bg-navy-gradient relative">
    <div className="container max-w-4xl relative z-10">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">El Problema</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-primary-foreground mb-10">
          Hacer un traspaso en RD es una pesadilla
        </h2>
      </AnimateOnScroll>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {painCards.map((card, i) => (
          <AnimateOnScroll key={card.title} delay={i * 100}>
            <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/10 h-full">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-3">
                <card.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-bold text-primary-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-primary-foreground/60">{card.desc}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll delay={300}>
        <div className="bg-cta/20 border border-cta/30 rounded-xl p-5 flex gap-3 items-start">
          <div className="w-10 h-10 rounded-lg bg-cta/30 flex items-center justify-center shrink-0">
            <AlertOctagon className="h-5 w-5 text-cta" />
          </div>
          <div>
            <p className="font-bold text-primary-foreground text-sm">Norma 03-25:</p>
            <p className="text-sm text-primary-foreground/70">
              A partir de julio 2025, la DGII bloquea el marbete si no haces el traspaso formal. No esperes más.
            </p>
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default ProblemaSection;
