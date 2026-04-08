import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Shield, Lock, MapPin, FileText } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: Shield, title: "Sistema Antifraude", desc: "Verificación facial y cruce con DGII" },
  { icon: Lock, title: "Pago Seguro", desc: "Tu dinero en custodia hasta completar el traspaso" },
  { icon: MapPin, title: "GPS Tracking", desc: "Sigue tu matrícula en tiempo real" },
  { icon: FileText, title: "Seguro de Documentos", desc: "Cobertura hasta RD$50,000" },
];

const TrustBar = () => (
  <section className="bg-trust py-8 border-y border-border">
    <div className="container">
      <AnimateOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((b, i) => (
            <motion.div
              key={b.title}
              className="flex flex-col items-center text-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <b.icon className="h-5 w-5 text-accent" />
              </motion.div>
              <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default TrustBar;
