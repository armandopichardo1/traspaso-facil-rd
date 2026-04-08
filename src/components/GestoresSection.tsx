import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Button } from "@/components/ui/button";
import { DollarSign, Smartphone, Shield, BarChart3 } from "lucide-react";

const benefits = [
  { icon: DollarSign, text: "Gana más por traspaso con mejor servicio" },
  { icon: Smartphone, text: "Plataforma profesional para tus clientes" },
  { icon: Shield, text: "Seguro y antifraude que te dan credibilidad" },
  { icon: BarChart3, text: "Dashboard con todos tus traspasos" },
];

const GestoresSection = () => (
  <section id="gestores" className="py-16 md:py-24 bg-background">
    <div className="container max-w-4xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Para Gestores y Tramitadores</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-4">
          Digitaliza tu negocio y gana más
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Únete a la red de Gestores Aliados de TRASPASA.DO. Usa nuestra plataforma como tu infraestructura: tracking, seguro, antifraude y credibilidad. Tú pones el precio al cliente, nos pagas RD$2,500 por traspaso y te quedas con la diferencia.
        </p>
      </AnimateOnScroll>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {benefits.map((b, i) => (
          <AnimateOnScroll key={b.text} delay={i * 80}>
            <div className="flex items-start gap-3 bg-card p-4 rounded-xl border border-border">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <b.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">{b.text}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll delay={300}>
        <div className="text-center">
          <Button variant="cta" size="lg" asChild>
            <a href="https://wa.me/18091234567?text=Quiero%20ser%20Gestor%20Aliado" target="_blank" rel="noopener noreferrer">
              Quiero ser Gestor Aliado
            </a>
          </Button>
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default GestoresSection;
