import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Star } from "lucide-react";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";
import avatarAutomax from "@/assets/avatar-automax.jpg";
import avatarRoberto from "@/assets/avatar-roberto.jpg";

const testimonials = [
  {
    name: "Carlos M.",
    role: "Comprador",
    avatar: avatarCarlos,
    quote:
      "Vendí mi Toyota y el comprador no quería ir a DGII. Con TRASPASA.DO se resolvió en 2 días sin moverme de mi casa. El tracking de la matrícula me dio mucha paz.",
    stars: 5,
  },
  {
    name: "María P.",
    role: "Compradora",
    avatar: avatarMaria,
    quote:
      "El historial vehicular me salvó. El carro que iba a comprar tenía una oposición por robo. Casi pierdo RD$400,000.",
    stars: 5,
  },
  {
    name: "Roberto S.",
    role: "Gestor Vehicular",
    avatar: avatarRoberto,
    quote:
      "Como gestor manejo 20+ traspasos al mes. Antes era un caos de papeles y filas. Con la plataforma tengo todo digitalizado, mis clientes ven el progreso en tiempo real y yo cobro más rápido.",
    stars: 5,
  },
  {
    name: "AutoMax RD",
    role: "Concesionario",
    avatar: avatarAutomax,
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

      <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
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
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
