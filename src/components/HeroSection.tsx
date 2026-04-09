import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, Shield, Lock, PenTool, Headphones, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-traspaso-v2.jpg";
import { motion } from "framer-motion";

const trustItems = [
  { icon: Shield, label: "Sistema Antifraude" },
  { icon: Lock, label: "Pago con Escrow" },
  { icon: PenTool, label: "Firma Digital Legal" },
  { icon: Headphones, label: "Soporte 24/7" },
];

const HeroSection = () => {
  const [placa, setPlaca] = useState("");

  return (
    <section className="bg-background relative overflow-hidden">
      {/* Hero */}
      <div className="container py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] mb-4">
              Tu traspaso vehicular{" "}
              <span className="text-cta">en 24 horas.</span>
              <br />
              Sin filas. Sin estrés.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
              Gestionamos todo el papeleo legal de tu vehículo en la DGII de forma 100% digital y segura. La velocidad de un clic con la confianza de un experto legal.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="cta" size="lg" className="font-bold" asChild>
                <a href="#solicitud">Empezar ahora</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#precios">Ver precios</a>
              </Button>
            </div>

            {/* Verified badge */}
            <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full px-4 py-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-accent">Proceso Legal Verificado</span>
              <span className="text-xs text-muted-foreground">· Contrato notariado con validez legal conforme a la Ley 126-02</span>
            </div>
          </motion.div>

          {/* Right - Image placeholder */}
          <motion.div
            className="relative hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src={heroImage}
                alt="Persona sonriente con llaves de carro y documentos digitales en su teléfono"
                className="w-full h-full object-cover"
                width={1024}
                height={768}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trust bar */}
      <motion.div
        className="border-y border-border bg-muted/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="container py-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Product cards */}
      <div className="container py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Historial */}
          <motion.div
            className="bg-card rounded-2xl p-6 shadow-sm border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground mb-1">Historial Vehicular</h2>
            <p className="text-muted-foreground text-sm mb-4">
              No compres a ciegas. Conoce el pasado de cualquier vehículo: accidentes, multas, embargos y dueños anteriores en minutos.
            </p>
            <p className="text-2xl font-extrabold text-foreground mb-4">RD$350</p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="Número de placa (ej: A123456)"
                  className="w-full pl-9 pr-3 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  maxLength={10}
                />
              </div>
            </div>
            <Button variant="teal" className="w-full font-bold" asChild>
              <a href="#historial">Consultar ahora →</a>
            </Button>
          </motion.div>

          {/* Traspaso */}
          <motion.div
            className="bg-cta rounded-2xl p-6 shadow-sm text-white flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-extrabold mb-1">Traspaso Completo</h2>
            <p className="text-white/80 text-sm mb-4">
              Desde la revisión legal hasta la entrega del nuevo título a tu nombre. Nosotros hacemos la fila por ti en la DGII.
            </p>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-2xl font-extrabold mb-4">Desde RD$3,500</p>
              <Button
                className="w-full bg-white text-cta hover:bg-white/90 font-bold"
                size="lg"
                asChild
              >
                <a href="#solicitud">Iniciar trámite 🚀</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
