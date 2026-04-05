import { AnimateOnScroll } from "@/components/AnimateOnScroll";

const painCards = [
  {
    emoji: "📋",
    title: "6 pasos, 3 instituciones, 1-3 días perdidos",
    desc: "Notaría, PGR, Plan Piloto, banco, DGII... un proceso diseñado para hacerte perder tiempo",
  },
  {
    emoji: "😰",
    title: "Tu matrícula en manos de extraños",
    desc: "Entregas tu documento original e irremplazable a alguien sin garantías, sin seguro y sin tracking",
  },
  {
    emoji: "🚨",
    title: "Riesgo de fraude y estafa",
    desc: "Vehículos con oposiciones, robos no declarados, doble traspasos. Sin verificación, estás a ciegas",
  },
];

const ProblemaSection = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container max-w-4xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-cta uppercase tracking-widest mb-2">El Problema</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-10">
          Hacer un traspaso en RD es una pesadilla
        </h2>
      </AnimateOnScroll>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {painCards.map((card, i) => (
          <AnimateOnScroll key={card.title} delay={i * 100}>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm h-full">
              <span className="text-3xl block mb-3">{card.emoji}</span>
              <h3 className="font-bold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll delay={300}>
        <div className="bg-cta/10 border border-cta/30 rounded-xl p-5 flex gap-3 items-start">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-foreground text-sm">Norma 03-25:</p>
            <p className="text-sm text-muted-foreground">
              A partir de julio 2025, la DGII bloquea el marbete si no haces el traspaso formal. No esperes más.
            </p>
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default ProblemaSection;
