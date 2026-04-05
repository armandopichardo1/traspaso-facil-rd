import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Shield, Lock, MapPin, FileText } from "lucide-react";

const badges = [
  { icon: Shield, emoji: "🛡️", title: "Sistema Antifraude", desc: "Verificación facial y cruce con DGII" },
  { icon: Lock, emoji: "🔒", title: "Pago Seguro", desc: "Tu dinero en custodia hasta completar el traspaso" },
  { icon: MapPin, emoji: "📍", title: "GPS Tracking", desc: "Sigue tu matrícula en tiempo real" },
  { icon: FileText, emoji: "📄", title: "Seguro de Documentos", desc: "Cobertura hasta RD$50,000" },
];

const TrustBar = () => (
  <section className="bg-trust py-8 border-y border-border">
    <div className="container">
      <AnimateOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((b) => (
            <div key={b.title} className="flex flex-col items-center text-center gap-2">
              <span className="text-2xl">{b.emoji}</span>
              <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default TrustBar;
