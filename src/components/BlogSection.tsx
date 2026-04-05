import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const articles = [
  {
    title: "Cómo hacer un traspaso vehicular en RD — Guía completa 2026",
    desc: "Paso a paso del proceso actual, requisitos, costos y oficinas.",
    href: "/guia-traspaso",
  },
  {
    title: "Norma 03-25: Lo que debes saber sobre el bloqueo de marbete",
    desc: "La regulación que cambia todo para los vehículos sin traspaso formal.",
    href: "/norma-03-25",
  },
  {
    title: "Calculadora de impuesto 2% de transferencia DGII",
    desc: "Calcula cuánto pagarás de impuesto en tu traspaso vehicular.",
    href: "/calculadora",
  },
];

const BlogSection = () => (
  <section className="py-16 md:py-24 bg-muted/50">
    <div className="container max-w-4xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Guías y Recursos</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-8">
          Todo lo que necesitas saber
        </h2>
      </AnimateOnScroll>

      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((a, i) => (
          <AnimateOnScroll key={a.href} delay={i * 100}>
            <Link to={a.href} className="group bg-card rounded-2xl p-6 border border-border shadow-sm h-full flex flex-col hover:shadow-md transition-shadow">
              <h3 className="font-bold text-foreground mb-2 group-hover:text-teal transition-colors">{a.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{a.desc}</p>
              <span className="flex items-center gap-1 text-sm font-medium text-teal mt-4 group-hover:gap-2 transition-all">
                Leer más <ArrowRight size={14} />
              </span>
            </Link>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  </section>
);

export default BlogSection;
