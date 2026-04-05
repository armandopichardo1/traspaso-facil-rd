import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Button } from "@/components/ui/button";

const benefits = [
  { emoji: "📊", text: "Dashboard multi-traspaso con status en tiempo real" },
  { emoji: "⏱️", text: "Ahorra 60+ horas al mes en filas y trámites" },
  { emoji: "🔍", text: "Informes de historial al por mayor con descuento" },
  { emoji: "📄", text: "Reportes y facturación para tu contabilidad" },
];

const tiers = [
  { name: "Starter", price: "RD$15,000/mes", desc: "Hasta 15 traspasos" },
  { name: "Growth", price: "RD$30,000/mes", desc: "Hasta 40 traspasos" },
  { name: "Enterprise", price: "RD$50,000/mes", desc: "Ilimitado + API" },
];

const DealersSection = () => (
  <section id="dealers" className="py-16 md:py-24 bg-muted/50">
    <div className="container max-w-4xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Para Dealers y Concesionarios</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-8">
          Gestiona todos tus traspasos desde un solo panel
        </h2>
      </AnimateOnScroll>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {benefits.map((b, i) => (
          <AnimateOnScroll key={b.text} delay={i * 80}>
            <div className="flex items-start gap-3 bg-card p-4 rounded-xl border border-border">
              <span className="text-xl">{b.emoji}</span>
              <p className="text-sm font-medium text-foreground">{b.text}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll delay={300}>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {tiers.map((t) => (
            <div key={t.name} className="bg-card rounded-xl p-5 border border-border text-center">
              <p className="font-bold text-foreground">{t.name}</p>
              <p className="text-xl font-extrabold text-teal">{t.price}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={400}>
        <div className="text-center">
          <Button variant="teal" size="lg" asChild>
            <a href="https://wa.me/18091234567?text=Quiero%20info%20de%20planes%20para%20dealers" target="_blank" rel="noopener noreferrer">
              Solicitar Demo
            </a>
          </Button>
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default DealersSection;
