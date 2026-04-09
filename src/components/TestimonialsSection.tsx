import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos M.",
    role: "Comprador",
    quote:
      "Vendí mi Toyota y el comprador no quería ir a DGII. Con TRASPASA.DO se resolvió en 2 días sin moverme de mi casa. El tracking de la matrícula me dio mucha paz.",
    stars: 5,
  },
  {
    name: "María P.",
    role: "Compradora",
    quote:
      "El historial vehicular me salvó. El carro que iba a comprar tenía una oposición por robo. Casi pierdo RD$400,000.",
    stars: 5,
  },
  {
    name: "AutoMax RD",
    role: "Concesionario",
    quote:
      "Antes perdíamos 2 empleados cada semana haciendo filas en DGII. Ahora gestionamos 15 traspasos al mes desde el showroom.",
    stars: 5,
  },
];

const TestimonialsSection = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container max-w-5xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">
          Testimonios
        </p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-10">
          Lo que dicen nuestros clientes
        </h2>
      </AnimateOnScroll>

      <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {testimonials.map((t, i) => (
          <AnimateOnScroll key={t.name} delay={i * 120}>
            <div className="min-w-[280px] md:min-w-0 snap-start bg-card rounded-2xl p-6 border border-border shadow-sm h-full flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star
                    key={s}
                    size={16}
                    className="fill-cta text-cta"
                  />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1 mb-5">
                "{t.quote}"
              </p>
              <div>
                <p className="font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
