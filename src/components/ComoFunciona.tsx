import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Smartphone, PenLine, Bike, Landmark, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Smartphone, title: "Regístrate y verifica", desc: "Ingresa datos del vehículo y sube cédulas. Nuestro sistema antifraude verifica identidades y cruza con DGII para detectar oposiciones o alertas." },
  { icon: PenLine, title: "Firma y paga seguro", desc: "Firmamos el contrato digitalmente. El comprador deposita el precio del vehículo en Pago Seguro — custodiado hasta completar el traspaso." },
  { icon: Bike, title: "Recogemos tu matrícula", desc: "Mensajero certificado recoge la matrícula del vendedor con GPS tracking y seguro. Tú solo llevas el vehículo al Plan Piloto para la inspección." },
  { icon: Landmark, title: "Gestionamos DGII", desc: "Entregamos expediente completo, pagamos el impuesto 2%, y hacemos seguimiento hasta que la nueva matrícula esté lista." },
  { icon: CheckCircle2, title: "Entrega + Liberación", desc: "Te entregamos la nueva matrícula a domicilio. El vendedor recibe el pago cuando el comprador confirma la entrega del vehículo con código QR." },
];

const ComoFunciona = () => (
  <section id="como-funciona" className="py-16 md:py-24 bg-background">
    <div className="container max-w-4xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Cómo Funciona el Traspaso</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-12">
          5 pasos. Nosotros hacemos el trabajo pesado.
        </h2>
      </AnimateOnScroll>

      <div className="relative">
        <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-8">
          {steps.map((step, i) => (
            <AnimateOnScroll key={step.title} delay={i * 100} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="flex gap-5 items-start">
                <motion.div
                  className="shrink-0 w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center relative z-10"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <step.icon className="h-7 w-7 text-accent" />
                </motion.div>
                <div className="pt-2">
                  <p className="text-xs font-bold text-teal uppercase mb-1">Paso {i + 1}</p>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ComoFunciona;
