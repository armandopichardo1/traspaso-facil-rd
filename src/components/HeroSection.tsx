import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, Clock, Star, Users } from "lucide-react";

const socialProof = [
  { icon: Users, value: "500+", label: "Traspasos completados" },
  { icon: Star, value: "4.9★", label: "Calificación promedio" },
  { icon: Clock, value: "24h", label: "Tiempo promedio" },
];

const HeroSection = () => {
  const [placa, setPlaca] = useState("");

  return (
    <section className="bg-navy-gradient bg-geometric-pattern relative overflow-hidden">
      <div className="container py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight mb-4">
            Compra y vende vehículos con total confianza
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70">
            La primera plataforma dominicana con historial vehicular, traspaso digital, pago seguro y sistema antifraude.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card A - Historial */}
          <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Consulta Historial Vehicular</h2>
            <p className="text-muted-foreground text-sm mb-4">Conoce todo antes de comprar</p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="Ingresa número de placa (ej: A123456)"
                  className="w-full pl-9 pr-3 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  maxLength={10}
                />
              </div>
            </div>
            <Button variant="teal" className="w-full" asChild>
              <a href="#historial">Consultar — RD$350</a>
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Resultado al instante · Propietarios · Oposiciones · Valor DGII · Multas
            </p>
          </div>

          {/* Card B - Traspaso */}
          <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-cta" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Traspaso Vehicular</h2>
            <p className="text-muted-foreground text-sm mb-4">Sin filas. Sin estrés. En 24 horas.</p>
            <div className="flex-1 flex flex-col justify-end">
              <Button variant="cta" className="w-full" size="lg" asChild>
                <a href="#solicitud">Iniciar Traspaso →</a>
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Desde RD$3,500 · Seguro incluido · GPS tracking · Pago seguro
              </p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="flex flex-wrap justify-center gap-8 mt-10">
          {socialProof.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-primary-foreground/80">
              <item.icon className="h-5 w-5 text-accent" />
              <span className="font-extrabold text-primary-foreground">{item.value}</span>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
